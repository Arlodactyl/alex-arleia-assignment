// This file is a serverless function
// It runs whenever /api/royale is called
// It securely proxies Clash Royale API requests

export default async function handler(req, res) {
  try {
    const { test, path, tag, battlelog, name, locationId } = req.query;

    // Health check
    if (test === "true") {
      return res.status(200).json({ status: "ok", message: "Server is running!" });
    }

    if (!path) {
      return res.status(400).json({ error: "Missing 'path' query param" });
    }

    // Build base URL
    const cleanPath = String(path).replace(/^\/+/, ""); // remove leading slashes
    let url = `https://proxy.royaleapi.dev/v1/${cleanPath}`;

    // Add player or clan tag to the path (e.g. /players/%239Q2YJ0U or /clans/%23ABC123)
    if (tag) {
      const encodedTag = encodeURIComponent(String(tag).replace(/^#/, ""));
      url += `/%23${encodedTag}`;
    }

    // Add /battlelog if requested
    if (String(battlelog).toLowerCase() === "true") {
      url += "/battlelog";
    }

    // Build query parameters for name and locationId (for clan search)
    const queryParams = [];
    if (name) queryParams.push(`name=${encodeURIComponent(name)}`);
    if (locationId) queryParams.push(`locationId=${encodeURIComponent(locationId)}`);

    // Append query string to the URL if needed
    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }

    console.log("Proxying request to:", url);

    // Call RoyaleAPI through proxy with token from env
    const apiResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
        Accept: "application/json",
      },
    });

    const text = await apiResponse.text();

    // Optional: Allow CORS (safe even if same-origin)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Return JSON response (parsed if possible)
    try {
      return res.status(apiResponse.status).json(JSON.parse(text));
    } catch {
      return res.status(apiResponse.status).send(text);
    }
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
