// This file is a serverless function
// Vercel runs it whenever we go to /api/royale
// It lets us call the Clash Royale API safely without showing our key

export default async function handler(req, res) {
  try {
    const { test, path, tag, battlelog } = req.query;

    // Health check
    if (test === "true") {
      return res.status(200).json({ status: "ok", message: "Server is running on Vercel!" });
    }

    if (!path) {
      return res.status(400).json({ error: "Missing 'path' query param" });
    }

    // Build proxy URL
    const cleanPath = String(path).replace(/^\/+/, ""); // remove leading slashes
    let url = `https://proxy.royaleapi.dev/v1/${cleanPath}`;

    // Add tag as /%23TAG if provided (no leading #)
    if (tag) url += `/%23${encodeURIComponent(String(tag).replace(/^#/, ""))}`;

    // Add /battlelog if requested
    if (String(battlelog).toLowerCase() === "true") url += "/battlelog";

    // Fetch from RoyaleAPI proxy using your token stored on Vercel
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    const text = await r.text();

    // (Optional) CORS – safe even if you’re same-origin
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    try { return res.status(r.status).json(JSON.parse(text)); }
    catch { return res.status(r.status).send(text); }
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
