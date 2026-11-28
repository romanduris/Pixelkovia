# Nasadenie

| Zdroj | Aktuálny identifikátor |
| --- | --- |
| Účet Cloudflare | `033ec39e1948bd5785d92d1993a8036f` |
| Pages | `pixelkovia-funnel` |
| Doména | `pixelkovia.rodulab.com` |
| Backend Worker | `treasurequest-admin` |
| Produkčná D1 | `treasurequest-db` · `a92475ad-b1e6-4a92-90dd-76e9b8e95b7a` |

Konfigurácia backendu je v `admin/wrangler.production.jsonc`; konfigurácia Pages a service bindingu v `funnel/wrangler.jsonc`. Samostatná preview aplikácia sa nepoužíva. Ostatné projekty účtu, ich databázy a DNS sa nemenia.

Po testoch commitnúť a pushnúť `main`, spustiť `node scripts/deploy-backend.mjs` a následne `scripts/deploy-funnel.mjs` s pripnutým Wranglerom. Backendový skript najskôr aplikuje chýbajúce migrácie na presnú existujúcu D1 a následne nasadí Worker. Zachová všetky existujúce secrets; nikdy ich neukladá do konfigurácie.

`ADMIN_PASSWORD_RECORD` a `ADMIN_PASSWORD_PEPPER` ostávajú pôvodné. `CUSTOMER_AUTH_SECRET`, Stripe a Resend credentials sa spravujú ako Cloudflare secrets a zároveň Codespaces secrets. Nastavenie živých platieb je v `docs/payment-setup.md`.

Administrátorské prihlásenie používa serverovú reláciu a cookie `__Host-tq-admin` s `HttpOnly`, `Secure`, `SameSite=Lax` a absolútnou platnosťou 30 dní. Heslo sa v prehliadači aplikáciou neukladá. Režim Lax umožňuje otvorenie administrácie cez odkaz z iného webu; zmenové požiadavky naďalej vyžadujú presný `Origin`. Prihlasovacia stránka overí existujúcu reláciu aj vlastnou požiadavkou, aby obnovila staršie Strict cookies. Odhlásenie a zmena hesla reláciu zneplatnia. Regresný test `node tests/admin-session.test.cjs` z koreňa repozitára používa Chromium, WebKit, lokálny HTTPS server a izolovanú D1; vyžaduje Playwright (prípadne `PLAYWRIGHT_MODULE`) a OpenSSL.
