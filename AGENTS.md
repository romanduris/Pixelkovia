# Project workflow

- Communicate with the user in Slovak.
- Use the project skill at `.agents/skills/mystery-at-home-workflow/SKILL.md` for changes in this repository.
- After every completed task that changes repository files, commit the changes and push to `origin/main`. Work only on `main`; do not create or push other branches. This includes project instructions and skills. Read-only tasks do not require an empty commit.
- When the Sites workflow creates source commits, also push those commits to `origin/main` before finishing. Publishing the Site does not replace the GitHub push. Do not force-push.
- After every completed website change, publish the updated version of the existing Site and include its permanent link in the final response. The user explicitly requested previews that continue to work after Codespace is stopped.
- After every completed change, including instruction or skill changes, return the permanent Site URL as a clickable Markdown link in the final response. The user prefers opening it in a new browser tab; use a supported new-tab handoff when available. Use the deployed URL, never a temporary Codespace or localhost preview.
- Reuse the Site project ID in `.openai/hosting.json`; do not create a duplicate Site. Preserve the current audience unless the user requests a sharing change.
- Build the static deployment with `node scripts/prepare-static.mjs`. The source of truth remains the root HTML/CSS/JS files and `assets/`; do not edit generated `dist/` files.
- Keep the game playable and preserve progress compatibility when changing its appearance.
- The public sales funnel is deployed separately to `https://pixelkovia.rodulab.com` using the Cloudflare Pages project configured in `funnel/cloudflare.json`. The game will have its own site; keep the existing Sites audience private.
- For sales changes, also build and test `dist/funnel/`, commit and push `main`, then publish that directory with `scripts/deploy-funnel.mjs`. Follow `funnel/README.md` for credentials and the pinned Wrangler CLI. Never upload the complete `dist/` or repository to the public Pages project.
- The public funnel must not contain game JavaScript, answers, complete worksheets/PDFs, the parent portal, audio/video files or administration. Use only its explicit public asset list and physically cropped worksheet previews; verify private routes return 404. Preserve the inactive payment behavior until separately authorized.
- The user approved `assets/sales/game-lock-partial.webp` as the public still preview of the nine puzzle. This is the only deliberate puzzle-preview exception; full game files, answer data and complete worksheets stay excluded.

- Keep only the current prelaunch content, catalog and media. Remove superseded pages, archive copies, retired product IDs and compatibility code for abandoned drafts; no order-history migration is needed at this stage. Do not rewrite Git history.
