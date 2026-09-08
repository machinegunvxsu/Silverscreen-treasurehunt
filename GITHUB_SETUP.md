# Pushing this to GitHub

1. Create a new empty repo on GitHub (no README/gitignore, since this project already has one).
2. From this folder, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

3. In Netlify: **Add new site → Import an existing project → GitHub**, select the repo.
4. Netlify will read `netlify.toml` automatically for build settings.
5. Under Site settings → Environment variables, add `ADMIN_KEY` (same value as before).
6. Deploy. Git-linked deploys get automatic Netlify Blobs context, so no `NETLIFY_SITE_ID`/`NETLIFY_API_TOKEN` setup needed.
