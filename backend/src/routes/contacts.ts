import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { pool } from "../db/connection.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/contacts
 * List all contacts for the authenticated user
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.jwtUser?.userId;

  try {
    const result = await pool.query(
      `SELECT id, email, name, tags, created_at, updated_at
       FROM contacts
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ contacts: result.rows });
  } catch (error: any) {
    console.error("Failed to fetch contacts:", error);
    res.status(500).json({
      error: "Failed to fetch contacts",
      message: error.message,
    });
  }
});

/**
 * POST /api/contacts
 * Create a single contact
 */
router.post(
  "/",
  authenticateToken,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("name").optional().isString(),
    body("tags").optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.jwtUser?.userId;
    const { email, name = "", tags = [] } = req.body as {
      email: string;
      name?: string;
      tags?: string[];
    };

    try {
      const result = await pool.query(
        `INSERT INTO contacts (user_id, email, name, tags)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, email)
         DO UPDATE SET name = EXCLUDED.name, tags = EXCLUDED.tags, updated_at = NOW()
         RETURNING id, email, name, tags, created_at, updated_at`,
        [userId, email.trim().toLowerCase(), name.trim(), tags]
      );

      res.json({ contact: result.rows[0] });
    } catch (error: any) {
      console.error("Failed to create contact:", error);
      res.status(500).json({
        error: "Failed to create contact",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/contacts/bulk
 * Bulk create contacts (ignores duplicates)
 */
router.post(
  "/bulk",
  authenticateToken,
  [
    body("contacts").isArray({ min: 1 }).withMessage("Contacts array required"),
    body("contacts.*.email").isEmail().withMessage("Valid email is required"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.jwtUser?.userId;
    const { contacts } = req.body as {
      contacts: Array<{ email: string; name?: string; tags?: string[] }>;
    };

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const inserted: any[] = [];
      let skipped = 0;

      for (const contact of contacts) {
        try {
          const result = await client.query(
            `INSERT INTO contacts (user_id, email, name, tags)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, email) DO NOTHING
             RETURNING id, email, name, tags, created_at, updated_at`,
            [
              userId,
              contact.email.trim().toLowerCase(),
              (contact.name || "").trim(),
              contact.tags || [],
            ]
          );
          if (result.rows.length > 0) {
            inserted.push(result.rows[0]);
          } else {
            skipped++;
          }
        } catch (err) {
          skipped++;
        }
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        insertedCount: inserted.length,
        skippedCount: skipped,
        contacts: inserted,
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Failed to bulk import contacts:", error);
      res.status(500).json({
        error: "Failed to import contacts",
        message: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/**
 * PATCH /api/contacts/:id
 * Update a contact
 */
router.patch(
  "/:id",
  authenticateToken,
  [
    body("email").optional().isEmail(),
    body("name").optional().isString(),
    body("tags").optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.jwtUser?.userId;
    const { id } = req.params;
    const { email, name, tags } = req.body as {
      email?: string;
      name?: string;
      tags?: string[];
    };

    try {
      const sets: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (email !== undefined) {
        sets.push(`email = $${idx++}`);
        values.push(email.trim().toLowerCase());
      }
      if (name !== undefined) {
        sets.push(`name = $${idx++}`);
        values.push(name.trim());
      }
      if (tags !== undefined) {
        sets.push(`tags = $${idx++}`);
        values.push(tags);
      }

      if (sets.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      sets.push(`updated_at = NOW()`);
      values.push(id, userId);

      const result = await pool.query(
        `UPDATE contacts SET ${sets.join(", ")}
         WHERE id = $${idx++} AND user_id = $${idx++}
         RETURNING id, email, name, tags, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ contact: result.rows[0] });
    } catch (error: any) {
      console.error("Failed to update contact:", error);
      res.status(500).json({
        error: "Failed to update contact",
        message: error.message,
      });
    }
  }
);

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
  const userId = req.jwtUser?.userId;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM contacts WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.json({ success: true, id });
  } catch (error: any) {
    console.error("Failed to delete contact:", error);
    res.status(500).json({
      error: "Failed to delete contact",
      message: error.message,
    });
  }
});

export default router;
