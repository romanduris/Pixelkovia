# Project workflow

- Communicate with the user in Slovak.
- After every completed website change, publish the updated version of the existing Site and include its permanent link in the final response. The user explicitly requested previews that continue to work after Codespace is stopped.
- Reuse the Site project ID in `.openai/hosting.json`; do not create a duplicate Site. Preserve the current audience unless the user requests a sharing change.
- Build the static deployment with `node scripts/prepare-static.mjs`. The source of truth remains the root HTML/CSS/JS files and `assets/`; do not edit generated `dist/` files.
- Keep the game playable and preserve progress compatibility when changing its appearance.
