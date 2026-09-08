const { connectLambda } = require("@netlify/blobs");
const { getGroupCodes, getTeamRoster, getNamedStore } = require("./lib/config-store");

// Normalize a name for comparison: lowercase, collapse whitespace.
// "  Team   Alpha" and "team alpha" both match this way.
function normalize(name) {
  return String(name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// Turn a team name into a safe Blobs key fragment.
function slugify(name) {
  return normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

exports.handler = async (event) => {
  connectLambda(event);
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    const teamName = String(payload.teamLead || payload.teamName || "").trim();
    const codeRaw = String(payload.code || "").trim().toUpperCase();

    if (!teamName || codeRaw.length !== 5) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid fields" }) };
    }

    const [groupCodes, teamRoster] = await Promise.all([getGroupCodes(), getTeamRoster()]);

    // Each group has exactly ONE code (not one per team), so this is a
    // straightforward reverse lookup: which group does this code belong to?
    const matchedEntry = Object.entries(groupCodes).find(
      ([, groupCode]) => String(groupCode).trim().toUpperCase() === codeRaw
    );
    const group = matchedEntry ? matchedEntry[0] : null;

    // Even with a correct code, the team name must actually appear on that
    // group's roster. This is what stops a team from borrowing another
    // group's code and checking in under it — the code alone isn't enough,
    // the team also has to be one of the ones assigned to that group.
    const roster = group ? teamRoster[group] || [] : [];
    const teamInRoster = roster.some((name) => normalize(name) === normalize(teamName));

    const store = getNamedStore("trail-of-clues-submissions");
    const timestamp = new Date().toISOString();

    if (!group || !teamInRoster) {
      // Log the rejected attempt so organizers can see failed tries too.
      const rejectKey = `rejected-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await store.setJSON(rejectKey, {
        teamLead: teamName,
        code: codeRaw,
        status: "rejected",
        // Helpful on /admin: was the code itself unrecognized, or a valid
        // code for a group this team just isn't part of?
        reason: !group ? "unknown-code" : "team-not-in-group",
        timestamp,
      });
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: false }),
      };
    }

    // Many teams share one group code, so we key accepted records by
    // group + team name (not by code) to keep one record per team.
    const acceptedKey = `accepted-${group}-${slugify(teamName)}`;
    const existing = await store.get(acceptedKey, { type: "json" });

    if (!existing) {
      await store.setJSON(acceptedKey, {
        teamLead: teamName,
        code: codeRaw,
        team: group,
        status: "accepted",
        timestamp,
      });
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true, team: group }),
    };
  } catch (err) {
    console.error("submit-code error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: `Internal error: ${err.message || String(err)}` }),
    };
  }
};
