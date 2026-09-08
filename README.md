# Trail of Clues — GECB Silver Screen

A team verification portal for the "Trail of Clues" event. Keeps the original
noir/investigation intro animations (terminal boot → security scan →
confidential notice → reveal), then asks for the **team's name** and their
**group's 5-character alphanumeric code**. A correct code shows a
"CONFIRMED" stamp animation and reveals the assigned group; a wrong code
shows a "CODE REJECTED" stamp. After confirmation, a full-screen animation
tells the team to return immediately to the portico.

There is also a lightweight admin page (`/admin`) where you can see every
team that has checked in (and every rejected attempt), which group they
were assigned to, and when.

## How verification works

- There are 5 **groups**: `DOLLYTRACK`, `CLAPBOARD`, `GREENSCREEN`, `ACTON`,
  `CUT!`.
- Each group has **one** access code (not one per team).
- Each group has a **roster** of team names that belong to it.
- To check in, a team enters its **team name** + its **group's code**.
  Both have to line up — the code has to belong to a group, *and* the
  team name has to be listed on that group's roster. This is what stops
  a team from copying another group's code: even with the right code,
  if their name isn't on that group's roster, they're rejected.

Both the codes and the roster now live in **Netlify Blobs**, not a JSON
file in the repo — so you can edit them straight from the Netlify
dashboard without redeploying.

## 1. Set the admin key

In your Netlify site settings → **Environment variables**, add:

- `ADMIN_KEY` — `ssgecb@2556` (or change it to whatever you prefer; just
  make sure it matches what's in your local `.env` if you also test
  locally). This protects `/admin` and the config endpoints below.

A `.env` file with this value is already included for local dev — don't
commit it (it's in `.gitignore`).

## 2. Load your group codes and team roster into Blobs

There's an admin-only function, `seed-config`, for viewing and writing the
config stored in Blobs.

**First-time setup** — write the starting data (edit the defaults inside
`netlify/functions/seed-config.js` first if you want different codes/names
baked in as the starting point):

```bash
curl -X POST https://yoursite.netlify.app/.netlify/functions/seed-config \
  -H "x-admin-key: ssgecb@2556" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Check what's currently stored:**

```bash
curl https://yoursite.netlify.app/.netlify/functions/seed-config \
  -H "x-admin-key: ssgecb@2556"
```

**Update just the codes** (leaves the roster untouched):

```bash
curl -X POST https://yoursite.netlify.app/.netlify/functions/seed-config \
  -H "x-admin-key: ssgecb@2556" \
  -H "Content-Type: application/json" \
  -d '{
    "groupCodes": {
      "DOLLYTRACK": "NEWC1",
      "CLAPBOARD": "NEWC2",
      "GREENSCREEN": "NEWC3",
      "ACTON": "NEWC4",
      "CUT!": "NEWC5"
    }
  }'
```

**Update just the roster** (leaves the codes untouched) — add as many team
names per group as you like:

```bash
curl -X POST https://yoursite.netlify.app/.netlify/functions/seed-config \
  -H "x-admin-key: ssgecb@2556" \
  -H "Content-Type: application/json" \
  -d '{
    "teamRoster": {
      "DOLLYTRACK": ["Team Alpha", "Team Bravo", "Team Charlie"],
      "CLAPBOARD": ["Team Delta", "Team Echo"],
      "GREENSCREEN": ["Team Foxtrot"],
      "ACTON": ["Team Golf", "Team Hotel"],
      "CUT!": ["Team India"]
    }
  }'
```

### Editing directly in the /admin dashboard (easiest)

The admin dashboard now has a built-in editor for this. Open `/admin`,
log in with `ADMIN_KEY`, click **"Manage Codes & Teams"**, edit each
group's code and team-name list right there, and click **"Save to
Blobs"**. Changes take effect immediately — no redeploy, no curl.

### Editing directly in the Netlify dashboard (no curl needed)

Once `seed-config` has been called at least once (so the keys exist), you
can also open **Site → Blobs → `trail-of-clues-config`** in the Netlify
dashboard, open the `group-codes` or `team-roster` key, and edit the JSON
value directly, then save — no redeploy required either way.

## 3. Deploy to Netlify

This is a standard Vite + React site with Netlify Functions, so you can
either:

- **Drag-and-drop / Git deploy:** connect this folder as a repo (or drag the
  folder in Netlify's UI) — `netlify.toml` already points Netlify at the
  right build command (`npm run build`), publish folder (`dist`), and
  functions folder (`netlify/functions`).
- **Netlify CLI:**
  ```bash
  npm install
  netlify deploy --prod
  ```

Netlify Blobs works automatically on Netlify — no extra database setup
needed. Locally, you can test the whole thing with:

```bash
npm install
netlify dev
```

(Run the `seed-config` POST against `http://localhost:8888/.netlify/functions/seed-config`
first so there's data to validate against locally too.)

## 4. Using it on the day

- Share the site URL with teams. They watch the intro animation, then
  enter their team name + their group's code.
- You (the organizer) open `yoursite.netlify.app/admin`, enter the
  `ADMIN_KEY`, and watch entries come in live (it auto-refreshes every 8s).
- The admin page shows accepted check-ins, rejected attempts, per-group
  counts, and timestamps. Rejected rows also show *why* they were
  rejected — the code wasn't recognized at all, or the code was valid but
  the team isn't on that group's roster (a sign someone may have copied
  another group's code).
- If you need to wipe test data before the real event, call the
  `reset-submissions` function once (e.g. with `curl`), or just ignore old
  test rows — they're clearly timestamped.

  ```bash
  curl -X POST https://yoursite.netlify.app/.netlify/functions/reset-submissions \
    -H "x-admin-key: ssgecb@2556"
  ```

## Project structure

```
public/gecb-logo.png         → your club logo, shown throughout the flow
src/App.tsx                  → intro animations + verification + exit screen
src/AdminApp.tsx             → the /admin dashboard
src/index.css                → all animations/theme (unchanged vibe)
netlify/functions/
  lib/config-store.js        → shared helper for reading/writing Blobs config
  seed-config.js             → admin: view/seed/update group codes + roster
  submit-code.js             → validates a team name + group code, logs the attempt
  get-submissions.js         → admin: lists all attempts
  reset-submissions.js       → admin: clears stored attempts
netlify.toml                 → Netlify build + SPA redirect config
.env                         → local ADMIN_KEY (not committed)
```
