const { getStore } = require("@netlify/blobs");

// A single Blobs store holds the two pieces of editable config:
//   - "group-codes": { "DOLLYTRACK": "A1B2C", ... }        one code per group
//   - "team-roster": { "DOLLYTRACK": ["Team A", ...], ... } which teams
//                                                            belong to which group
// Because this lives in Blobs (not a JSON file bundled with the code), you
// can update it straight from the Netlify dashboard (Site → Blobs →
// trail-of-clues-config) without redeploying, or via seed-config.js.
const CONFIG_STORE_NAME = "trail-of-clues-config";
const GROUP_CODES_KEY = "group-codes";
const TEAM_ROSTER_KEY = "team-roster";

// Sites deployed via Netlify Drop (drag-and-drop) don't get the automatic
// Blobs context that Git-linked or CLI deploys get. If NETLIFY_SITE_ID and
// NETLIFY_API_TOKEN (or BLOBS_SITE_ID / BLOBS_TOKEN) are set as environment
// variables, use them to configure any store manually. Otherwise fall back
// to the automatic behavior (works fine for Git/CLI deploys).
function getNamedStore(name) {
  const siteID = process.env.BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN;

  if (siteID && token) {
    return getStore({ name, siteID, token });
  }

  return getStore(name);
}

function getConfigStore() {
  return getNamedStore(CONFIG_STORE_NAME);
}

async function getGroupCodes() {
  const store = getConfigStore();
  const data = await store.get(GROUP_CODES_KEY, { type: "json" });
  return data || {};
}

async function getTeamRoster() {
  const store = getConfigStore();
  const data = await store.get(TEAM_ROSTER_KEY, { type: "json" });
  return data || {};
}

async function setGroupCodes(groupCodes) {
  const store = getConfigStore();
  await store.setJSON(GROUP_CODES_KEY, groupCodes);
}

async function setTeamRoster(teamRoster) {
  const store = getConfigStore();
  await store.setJSON(TEAM_ROSTER_KEY, teamRoster);
}

module.exports = {
  CONFIG_STORE_NAME,
  GROUP_CODES_KEY,
  TEAM_ROSTER_KEY,
  getConfigStore,
  getNamedStore,
  getGroupCodes,
  getTeamRoster,
  setGroupCodes,
  setTeamRoster,
};
