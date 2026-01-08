import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { generateImage, editImage } from "../services/imageGeneration/geminiService.js";

const router = Router();

// Generate new image from text prompt
router.post("/generate", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { prompt, aspectRatio } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const imageBase64 = await generateImage({ prompt, aspectRatio });

    res.json({
      success: true,
      image: imageBase64,
      prompt,
      aspectRatio: aspectRatio || "1:1",
    });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Edit existing image with prompt
router.post("/edit", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { prompt, imageBase64, aspectRatio } = req.body;

    if (!prompt || !imageBase64) {
      res.status(400).json({ error: "Prompt and image are required" });
      return;
    }

    const resultImageBase64 = await editImage({ prompt, imageBase64, aspectRatio });

    res.json({
      success: true,
      image: resultImageBase64,
      prompt,
      aspectRatio: aspectRatio || "1:1",
    });
  } catch (error) {
    console.error("Image editing error:", error);
    res.status(500).json({ error: "Failed to edit image" });
  }
});

export default router;

