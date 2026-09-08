const { connectLambda } = require("@netlify/blobs");
const { getNamedStore } = require("./lib/config-store");

exports.handler = async (event) => {
  connectLambda(event);
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const adminKey = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];

    if (!process.env.ADMIN_KEY || !adminKey || adminKey !== process.env.ADMIN_KEY) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const store = getNamedStore("trail-of-clues-submissions");
    const { blobs } = await store.list();

    for (const blob of blobs) {
      await store.delete(blob.key);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cleared: blobs.length }),
    };
  } catch (err) {
    console.error("reset-submissions error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Internal error: ${err.message || String(err)}` }),
    };
  }
};
