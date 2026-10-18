# Nové súbory etapy 2

- `admin/.gitignore`
- `admin/README.md`
- `admin/docs/DEPLOYMENT.md`
- `admin/docs/FILES.md`
- `admin/docs/dashboard-preview.png`
- `admin/migrations/0001_initial.sql`
- `admin/migrations/0002_product_catalog.sql`
- `admin/package-lock.json`
- `admin/package.json`
- `admin/public/admin.css`
- `admin/public/admin.js`
- `admin/public/index.html`
- `admin/scripts/deployment-plan.mjs`
- `admin/scripts/inventory-cloudflare.mjs`
- `admin/scripts/seed-demo.mjs`
- `admin/scripts/sync-checklist.mjs`
- `admin/scripts/sync-game.mjs`
- `admin/src/analytics.mjs`
- `admin/src/auth.mjs`
- `admin/src/checklist.mjs`
- `admin/src/db.mjs`
- `admin/src/demo.mjs`
- `admin/src/email-templates.mjs`
- `admin/src/game-rules.mjs`
- `admin/src/game-service.mjs`
- `admin/src/worker.mjs`
- `admin/tests/access.test.mjs`
- `admin/tests/browser.test.cjs`
- `admin/tests/core.test.mjs`
- `admin/tests/runtime.test.mjs`
- `admin/tests/support.mjs`
- `admin/wrangler.jsonc`
- `admin/wrangler.production.example.jsonc`

Upravené koreňové súbory etapy 2: `README.md`, `site-config.js`, `site-content.js`. Doplnenie heslového nasadenia mení iba prvé dva z nich.

Doplnenie prihlásenia iba heslom:

- `admin/migrations/0003_admin_password_sessions.sql`
- `admin/public/login.css`
- `admin/public/login.html`
- `admin/public/login.js`
- `admin/scripts/prepare-admin-password.mjs`
- `admin/src/password-auth.mjs`
- `admin/tests/password.test.mjs`
- `admin/tests/password-browser.test.cjs`
