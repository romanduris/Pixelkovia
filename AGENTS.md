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
