import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { config } from "../../config/env.js";

// ── Campaign email template ───────────────────────────────────────────────────

interface CampaignEmailParams {
  headline: string;
  sub_headline?: string;
  value_proposition: string;
  body_paragraphs: string[];
  feature_cards?: { icon: string; title: string; desc: string }[];
  image_urls?: string[];
  cta_text: string;
  cta_url?: string;
  sign_off_name?: string;
  accent_color?: string;
  dark_bg?: string;
}

async function buildCampaignEmail({
    headline,
    sub_headline,
    value_proposition,
    body_paragraphs,
    feature_cards,
    image_urls,
    cta_text,
    cta_url,
    sign_off_name,
    accent_color,
    dark_bg,
  }: CampaignEmailParams): Promise<string> {
    const accent = accent_color || "#f0a500";   // amber/gold default
    const heroBg = dark_bg || "#111111";         // near-black hero
    const sectionBg = "#1a1a1a";
    const bodyBg = "#f4f4f4";

    const bodyBlocks = (body_paragraphs || [])
      .map((p: string) => `<p style="margin:0 0 18px 0;font-size:15px;color:#333;line-height:1.7;">${p}</p>`)
      .join("");

    // Product images — first image is hero, rest rendered as a grid
    const imgs = image_urls || [];
    const heroImage = imgs[0]
      ? `<div style="margin-bottom:0;">
          <img src="${imgs[0]}" alt="Product" width="600" style="width:100%;max-width:600px;height:auto;display:block;object-fit:cover;" />
        </div>`
      : "";
    const gridImages = imgs.slice(1).length > 0
      ? `<table width="100%" cellpadding="4" cellspacing="0" style="margin-bottom:24px;">
          <tr>${imgs.slice(1, 4).map((url: string) => `
            <td width="${Math.floor(100 / Math.min(imgs.slice(1).length, 3))}%" style="padding:4px;">
              <img src="${url}" alt="Product" width="180" style="width:100%;height:160px;object-fit:cover;display:block;border-radius:4px;" />
            </td>`).join("")}
          </tr>
        </table>`
      : "";

    // Feature cards — 2-col grid rendered as stacked blocks for email safety
    const featureBlock = (feature_cards && feature_cards.length > 0)
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
          <tr>${feature_cards.slice(0, 2).map((f: { icon: string; title: string; desc: string }) => `
            <td width="50%" valign="top" style="padding:4px;">
              <div style="background:#fff;border-top:3px solid ${accent};padding:20px;border-radius:4px;">
                <div style="font-size:28px;margin-bottom:8px;">${f.icon || "⚡"}</div>
                <p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:1px;">${f.title}</p>
                <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">${f.desc}</p>
              </div>
            </td>`).join("")}
          </tr>
          ${feature_cards.length > 2 ? `<tr>${feature_cards.slice(2, 4).map((f: { icon: string; title: string; desc: string }) => `
            <td width="50%" valign="top" style="padding:4px;">
              <div style="background:#fff;border-top:3px solid ${accent};padding:20px;border-radius:4px;">
                <div style="font-size:28px;margin-bottom:8px;">${f.icon || "⚡"}</div>
                <p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:1px;">${f.title}</p>
                <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">${f.desc}</p>
              </div>
            </td>`).join("")}
          </tr>` : ""}
        </table>`
      : "";

    return `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f4f4;">

  <!-- ── HERO ── -->
  <div style="background:${heroBg};padding:48px 32px 40px;text-align:center;">
    <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${accent};">
      ${sign_off_name || "Campaign"}
    </p>
    <h1 style="margin:0 0 16px 0;font-size:34px;font-weight:900;color:#ffffff;line-height:1.2;text-transform:uppercase;letter-spacing:-0.5px;">
      ${headline}
    </h1>
    ${sub_headline ? `<p style="margin:0 0 28px 0;font-size:16px;color:#cccccc;line-height:1.5;">${sub_headline}</p>` : ""}
    <a href="${cta_url || "#"}"
       style="display:inline-block;background:${accent};color:#111;padding:16px 40px;text-decoration:none;border-radius:2px;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:2px;">
      ${cta_text || "Shop Now"}
    </a>
  </div>

  <!-- ── HERO PRODUCT IMAGE ── -->
  ${heroImage}

  <!-- ── VALUE PROP BAND ── -->
  <div style="background:${sectionBg};padding:24px 32px;text-align:center;">
    <p style="margin:0;font-size:16px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:1px;">
      ${value_proposition}
    </p>
  </div>

  <!-- ── BODY ── -->
  <div style="background:${bodyBg};padding:36px 32px;">
    ${bodyBlocks}
    ${gridImages}
    ${featureBlock}
  </div>

  <!-- ── BOTTOM CTA ── -->
  <div style="background:${heroBg};padding:36px 32px;text-align:center;">
    <p style="margin:0 0 20px 0;font-size:20px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:1px;">
      Ready to get started?
    </p>
    <a href="${cta_url || "#"}"
       style="display:inline-block;background:${accent};color:#111;padding:16px 40px;text-decoration:none;border-radius:2px;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:2px;">
      ${cta_text || "Shop Now"} »
    </a>
  </div>

  <!-- ── FOOTER ── -->
  <div style="background:#222;padding:20px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#666;">${sign_off_name || "The Team"} &nbsp;|&nbsp; <a href="${cta_url || "#"}" style="color:#888;text-decoration:none;">${cta_url || ""}</a></p>
  </div>

</div>`;
}

// ── Routing helpers ────────────────────────────────────────────────────────────

const CAMPAIGN_KEYWORDS = [
  "campaign", "promotion", "promo", "newsletter", "blast", "broadcast",
  "bulk email", "marketing email", "launch email", "sale email", "product launch",
];

function isCampaignRequest(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return CAMPAIGN_KEYWORDS.some((kw) => lower.includes(kw));
}

function getLLM(temperature = 0.7) {
  return new ChatAnthropic({
    modelName: config.anthropicModel || "claude-haiku-4-5-20251001",
    temperature,
    anthropicApiKey: config.anthropicApiKey,
    maxTokens: 2000,
  });
}

function extractText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw.map((b: any) => b?.text ?? "").join("");
  return JSON.stringify(raw);
}

// ── Image scraping helpers ──────────────────────────────────────────────────────

function extractUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s,]+/g;
  return [...text.matchAll(urlRegex)].map((m) => m[0].replace(/[.,;)'"]+$/, ""));
}

function isDirectImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

async function scrapeProductImages(pageUrl: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EmailImageBot/1.0)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const html = await response.text();
    const images: string[] = [];

    // 1. og:image (most reliable for product pages)
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1]) images.push(ogMatch[1]);

    // 2. WooCommerce / standard product images
    for (const match of html.matchAll(/class="[^"]*(?:wp-post-image|product[_-]image|woocommerce-product-gallery)[^"]*"[^>]+src="([^"]+)"/gi)) {
      if (!images.includes(match[1])) images.push(match[1]);
    }

    // 3. Any large uploaded image (WordPress-style uploads path)
    for (const match of html.matchAll(/https?:\/\/[^"'\s]+\/wp-content\/uploads\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi)) {
      const url = match[0].replace(/-\d+x\d+(\.\w+)$/, "$1"); // prefer original over thumbnail
      if (!images.includes(url)) images.push(url);
    }

    return [...new Set(images)].slice(0, 3);
  } catch {
    return [];
  }
}

async function resolveImageUrls(prompt: string, explicitImageUrls?: string[]): Promise<string[]> {
  // Explicit image URLs from the UI take priority
  const explicit = (explicitImageUrls ?? []).filter(Boolean);
  if (explicit.length > 0) return explicit;

  // Look for URLs in the prompt text
  const urlsInPrompt = extractUrlsFromText(prompt);
  const results: string[] = [];

  for (const url of urlsInPrompt) {
    if (isDirectImageUrl(url)) {
      results.push(url);
    } else {
      // It's a webpage — try to scrape product images from it
      const scraped = await scrapeProductImages(url);
      results.push(...scraped);
    }
    if (results.length >= 3) break;
  }

  return [...new Set(results)].slice(0, 3);
}

// ── Campaign path: LLM extracts structured fields → template renders HTML ──────

async function generateCampaignEmail(params: {
  prompt: string;
  subject?: string;
  tone?: string;
  imageUrls?: string[];
}): Promise<string> {
  const { prompt, subject, tone, imageUrls } = params;
  const llm = getLLM(0.7);

  // Resolve images: explicit input > direct image URLs in prompt > scraped from product page
  const resolvedImages = await resolveImageUrls(prompt, imageUrls);

  const imageHint = resolvedImages.length > 0
    ? `\nProduct image URLs already resolved (do NOT change): ${resolvedImages.join(", ")}`
    : "";

  const extractionPrompt = `You are a campaign email content strategist. Extract structured content for a campaign email template.
Return ONLY a valid JSON object — no explanation, no markdown fences.

User request: "${prompt}"
${subject ? `Email subject: "${subject}"` : ""}
Tone: ${tone || "professional"}${imageHint}

JSON schema to fill:
{
  "headline": "PUNCHY ALL-CAPS headline (max 8 words)",
  "sub_headline": "Supporting sentence (optional)",
  "value_proposition": "One bold sentence for the highlighted band",
  "body_paragraphs": ["paragraph 1", "paragraph 2"],
  "feature_cards": [
    { "icon": "emoji", "title": "SHORT TITLE", "desc": "Two sentence description." }
  ],
  "image_urls": [],
  "cta_text": "Button label",
  "cta_url": "URL if mentioned, otherwise #",
  "sign_off_name": "Brand/sender name",
  "accent_color": "hex color matching brand context",
  "dark_bg": "#111111"
}

Rules:
- Make reasonable assumptions — do NOT leave fields empty
- If a URL is given, infer brand name and context from it
- accent_color: tools/hardware → #f0a500, tech → #0066ff, health → #00b386, fashion → #e63946, default → #f0a500
- Include 2-4 feature_cards with relevant emoji icons
${resolvedImages.length > 0 ? `- Set image_urls to: ${JSON.stringify(resolvedImages)}` : "- Set image_urls to []"}`;

  const response = await llm.invoke([new HumanMessage(extractionPrompt)]);
  const raw = extractText(response.content).trim()
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    // Fix common LLM JSON mistakes: undefined → null, trailing commas
    .replace(/:\s*undefined\b/g, ": null")
    .replace(/,\s*([\]}])/g, "$1")
    .trim();

  const fields = JSON.parse(raw);
  // Always override image_urls with resolved images — never trust the LLM to relay URLs
  if (resolvedImages.length > 0) {
    fields.image_urls = resolvedImages;
  }
  return await buildCampaignEmail(fields as CampaignEmailParams);
}

// ── Personal email path: LLM writes HTML directly ──────────────────────────────

async function generatePersonalEmail(params: {
  prompt: string;
  subject?: string;
  tone?: string;
}): Promise<string> {
  const { prompt, subject, tone } = params;
  const llm = getLLM(0.7);

  const response = await llm.invoke([
    new SystemMessage(
      `You are an expert email writer. Output ONLY the plain text body of the email — no HTML tags, no markdown, no code fences, no explanations.

Use blank lines to separate paragraphs. Use plain line breaks for the signature block.
Structure: greeting → body paragraphs → warm closing → signature.
Tone: ${tone || "professional, warm, and human"}
${subject ? `Subject context: "${subject}"` : ""}

Your output must be pure readable text that can be pasted directly into an email client.`
    ),
    new HumanMessage(`Write this email: ${prompt}`),
  ]);

  return extractText(response.content)
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

// ── Public entry point ──────────────────────────────────────────────────────────

export async function runEmailAgent(params: {
  prompt: string;
  subject?: string;
  tone?: string;
  imageUrls?: string[];
}): Promise<string> {
  if (isCampaignRequest(params.prompt)) {
    return generateCampaignEmail(params);
  }
  return generatePersonalEmail(params);
}
