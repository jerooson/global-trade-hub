import { pool } from "../db/connection.js";

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  name?: string;
  provider: string;
  provider_id?: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password_hash?: string;
  name?: string;
  provider?: string;
  provider_id?: string;
  is_verified?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  password_hash?: string;
  is_verified?: boolean;
  updated_at?: Date;
}

export const UserModel = {
  async createUser(input: CreateUserInput): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, provider, provider_id, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.email,
        input.password_hash || null,
        input.name || null,
        input.provider || "local",
        input.provider_id || null,
        input.is_verified || false,
      ]
    );
    return result.rows[0];
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByProvider(provider: string, providerId: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT * FROM users WHERE provider = $1 AND provider_id = $2`,
      [provider, providerId]
    );
    return result.rows[0] || null;
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.password_hash !== undefined) {
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(input.password_hash);
    }
    if (input.is_verified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      values.push(input.is_verified);
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async deleteUser(id: string): Promise<void> {
    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  },
};

// Refresh Token Model
export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export const RefreshTokenModel = {
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const result = await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, token, expiresAt]
    );
    return result.rows[0];
  },

  async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    return result.rows[0] || null;
  },

  async deleteByToken(token: string): Promise<void> {
    await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
  },

  async deleteByUserId(userId: string): Promise<void> {
    await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
  },

  async deleteExpired(): Promise<void> {
    await pool.query(`DELETE FROM refresh_tokens WHERE expires_at <= NOW()`);
  },
};

// Password Reset Model
export interface PasswordReset {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export const PasswordResetModel = {
  async createPasswordReset(userId: string, token: string, expiresAt: Date): Promise<PasswordReset> {
    const result = await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, token, expiresAt]
    );
    return result.rows[0];
  },

  async findByToken(token: string): Promise<PasswordReset | null> {
    const result = await pool.query(
      `SELECT * FROM password_resets 
       WHERE token = $1 AND expires_at > NOW() AND used = false`,
      [token]
    );
    return result.rows[0] || null;
  },

  async markAsUsed(token: string): Promise<void> {
    await pool.query(
      `UPDATE password_resets SET used = true WHERE token = $1`,
      [token]
    );
  },

  async deleteExpired(): Promise<void> {
    await pool.query(`DELETE FROM password_resets WHERE expires_at <= NOW() OR used = true`);
  },
};

