const { connectLambda } = require("@netlify/blobs");
const { getNamedStore } = require("./lib/config-store");

exports.handler = async (event) => {
  connectLambda(event);
  try {
    const adminKey = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];

    if (!process.env.ADMIN_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "ADMIN_KEY is not set on this Netlify site." }),
      };
    }

    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const store = getNamedStore("trail-of-clues-submissions");
    const { blobs } = await store.list();

    const results = [];
    for (const blob of blobs) {
      const data = await store.get(blob.key, { type: "json" });
      if (data) results.push({ key: blob.key, ...data });
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results),
    };
  } catch (err) {
    // Without this, an unexpected error here crashes the function and the
    // caller just sees a raw 502 with no explanation. Log the real stack
    // trace (visible in Netlify's function logs) and hand back something
    // the admin UI can actually display.
    console.error("get-submissions error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Internal error: ${err.message || String(err)}` }),
    };
  }
};
