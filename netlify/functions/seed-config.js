const { connectLambda } = require("@netlify/blobs");
const { getGroupCodes, getTeamRoster, setGroupCodes, setTeamRoster } = require("./lib/config-store");

// Starting data. POST an empty body (or GET with no prior data) and these
// are what get written to Blobs. Edit these arrays/codes here and re-POST
// any time you want to bulk-reset everything back to a known state —
// day-to-day edits are easier done straight in the Netlify dashboard
// (Site → Blobs → trail-of-clues-config), or by POSTing just the piece
// you want to change.
const DEFAULT_GROUP_CODES = {
  DOLLYTRACK: "A1B2C",
  CLAPBOARD: "L4N8T",
  GREENSCREEN: "Z3X7C",
  ACTON: "R5T9U",
  "CUT!": "V4B7N",
};

const DEFAULT_TEAM_ROSTER = {
  DOLLYTRACK: ["Aditi Menon", "Rohan Nair", "Sneha Pillai"],
  CLAPBOARD: ["Arjun Das", "Meera Krishnan", "Vishnu Prasad"],
  GREENSCREEN: ["Kavya Suresh", "Nikhil Raj", "Anjali Nambiar"],
  ACTON: ["Sarath Kumar", "Devika Warrier", "Gokul Sanjay"],
  "CUT!": ["Fathima Rasheed", "Akhil Balan", "Diya Thomas"],
};

exports.handler = async (event) => {
  connectLambda(event);
  try {
    const adminKey = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];

    if (!process.env.ADMIN_KEY || !adminKey || adminKey !== process.env.ADMIN_KEY) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    // GET: just look at what's currently stored, without changing anything.
    if (event.httpMethod === "GET") {
      const [groupCodes, teamRoster] = await Promise.all([getGroupCodes(), getTeamRoster()]);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupCodes, teamRoster }, null, 2),
      };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    let payload = {};
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    // Only overwrite the piece(s) you actually send. POST {} to reset both
    // back to the defaults above; POST { "groupCodes": {...} } to change just
    // the codes and leave the roster untouched, etc.
    const groupCodes = payload.groupCodes || (payload.teamRoster ? await getGroupCodes() : DEFAULT_GROUP_CODES);
    const teamRoster = payload.teamRoster || (payload.groupCodes ? await getTeamRoster() : DEFAULT_TEAM_ROSTER);

    await setGroupCodes(groupCodes);
    await setTeamRoster(teamRoster);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, groupCodes, teamRoster }, null, 2),
    };
  } catch (err) {
    console.error("seed-config error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Internal error: ${err.message || String(err)}` }),
    };
  }
};
