// This file is a serverless function
// Vercel runs it whenever we go to /api/royale
// It lets us call the Clash Royale API safely without showing our key

export default async function handler(req, res) {
  try {
    const { path, tag, test } = req.query;

    // ✅ Test endpoint
    if (test === "true") {
      return res.status(200).json({
        status: "ok",
        message: "Server is running on Vercel!",
      });
    }

    // if no path was given, return error
    if (!path) {
      return res.status(400).json({ error: "Missing path parameter" });
    }

    // build the api url, add %23 before the tag because # must be encoded
    let url = `https://proxy.royaleapi.dev/v1/${path}`;
    if (tag) {
      url += `/%23${tag}`;
    }

    // fetch data from royaleapi proxy, add the secret key from vercel
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.CR_API_TOKEN}`,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
