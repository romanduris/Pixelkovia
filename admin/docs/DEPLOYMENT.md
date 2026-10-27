# Nasadenie administrácie Pixelkov

Účet: `033ec39e1948bd5785d92d1993a8036f`.

| Prostredie | Worker | D1 databáza | UUID |
| --- | --- | --- | --- |
| Hlavné | `treasurequest-admin` | `treasurequest-db` | `a92475ad-b1e6-4a92-90dd-76e9b8e95b7a` |
| Preview | `treasurequest-admin-preview` | `treasurequest-db-preview` | `992a2f73-b515-456a-97a6-d277eadd27c8` |

Adresy: [administrácia](https://treasurequest-admin.livingstones-romanduris.workers.dev) a [preview](https://treasurequest-admin-preview.livingstones-romanduris.workers.dev). Každý Worker používa vlastnú D1 cez `TQ_DB`. Ostatné aplikácie účtu, databázy a DNS nie sú súčasťou tohto nasadenia.

## Zostavenie a nasadenie

1. `node admin/scripts/sync-game.mjs` a `sync-checklist.mjs` odvodia pravidlá siedmich úloh a checklist zo spoločných zdrojov.
2. V `admin/` spustite `npm ci`, `npm run build:check` a `npm test`.
3. Ignorované `wrangler.production.jsonc` a `wrangler.preview.jsonc` sa odvodzujú od `wrangler.production.example.jsonc` so skutočnými overenými ID. `ENVIRONMENT` je `production` alebo `preview`, `DEMO_MODE=false`, `ADMIN_AUTH_MODE=password`, `WEB_URL` smeruje na súkromnú Site.
4. Pred nasadením overte existujúci názov Workera, presné D1 UUID a mená autentifikačných secrets. Nasadzuje sa iba existujúci Worker, bez nových zdrojov či zmien DNS. Pracovná verzia je commitnutá a pushnutá na `origin/main`.
5. Použite pripnutý Wrangler z `admin/node_modules` a správnu konfiguráciu; zachovajte existujúce secrets. `workers_dev=true`, náhodné version preview URL vypnuté.
6. Po nasadení musia chránené stránky bez prihlásenia smerovať na login, dátové API vracať 401 a podvrhnutá hlavička ani nesprávny Origin nesmú obísť ochranu.

## Heslo a prístup

Prihlásenie používa uložené heslo bez Access a e-mailu. Secrets `ADMIN_PASSWORD_RECORD` a `ADMIN_PASSWORD_PEPPER` sa uchovávajú vo Workerovi. D1 obsahuje iba hash relácie; cookie je `HttpOnly`, `Secure`, `SameSite=Strict`. Platí limit pokusov, najviac 8 hodín a 30 minút nečinnosti. Podrobnosti sú v [README](../README.md).

API token sa číta z `PIXELKOVIA_TOKEN` alebo `CLOUDFLARE_API_TOKEN`. Nepatrí do kódu, argumentov príkazu ani výstupu. Existujúce autentifikačné secrets a relácie sa pri obsahových zmenách nemažú.

Administrácia používa aktuálne štyri produkty a sedem úloh. Bez zapojeného privátneho identity service bindingu zákaznícke API zostáva vypnuté; platby ani e-maily sa týmto nasadením nespúšťajú. Testovacie dáta sa vytvárajú iba vedomým spustením lokálnych fixture nástrojov a do online prostredia sa automaticky nevkladajú.
