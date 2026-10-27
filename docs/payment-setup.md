# Platby a automatické doručenie

Používa sa účet Stripe **Pixelkovia**, `acct_1UVB5BGle1VvIsLT`, jednorazové platby v EUR. Predajné ceny zostávajú v spoločnom `site-config.js`: hra 14,99 €, každá kniha 4,99 €, kompletný balík 19,99 €, voliteľný Atlas zdarma.

## Nastavenie kľúčov

Kľúče patria do **Codespaces secrets**, s prístupom repozitára `romanduris/Pixelkovia`, a do Cloudflare Worker secrets. Nezadávajú sa do chatu, Git súborov ani argumentov príkazu.

- `PIXELKOVIA_TOKEN`: existujúci Cloudflare token.
- `CUSTOMER_AUTH_SECRET`: existujúci náhodný autentifikačný a šifrovací kľúč; po začatí predaja ho neotáčať bez samostatného migračného postupu.
- `STRIPE_SECRET_KEY`: preferovaný obmedzený `rk_live_` kľúč pre vlastný server. Potrebuje čítanie účtu a relácií, tvorbu Checkout Sessions a správu platobného webhooku.
- `STRIPE_PUBLISHABLE_KEY`: verejný `pk_live_` kľúč rovnakého účtu.
- `RESEND_API_KEY`: kľúč Resend s oprávnením na nastavenie odosielacej domény a odosielanie.
- `STRIPE_WEBHOOK_SECRET`: vygeneruje sa pri vytvorení endpointu a musí zostať zachovaný.

```sh
node scripts/configure-commerce.mjs --interactive
```

Skript číta chýbajúce kľúče skrytým vstupom, overí účet Pixelkovia a prijímanie platieb, uloží kľúče ako Codespaces secrets, nastaví iba e-mailové DNS záznamy pre `pixelkovia.rodulab.com`, overí doménu Resend a vytvorí alebo opätovne použije platobný webhook. Následne nastaví Worker secrets. Existujúce konfliktné DNS neprepisuje. Hodnoty kľúčov nevypisuje.

Každý kľúč kontroluje hneď po zadaní. Ak je testovací, zamenený alebo zamaskovaný, vypíše názov premennej a konkrétny dôvod a zopakuje iba jej výzvu. Vkladajte celý kľúč cez tlačidlo kopírovania v Stripe, bez názvu premennej. Okolité úvodzovky a značky vloženia terminálu skript odstráni. Platnosť a oprávnenia následne overí poskytovateľ.

Resend je zriadený cez Stripe Projects v bezplatnom pláne. Pri prvom nastavení v aktuálnom Codespace možno použiť jeho vygenerované prostredie bez zobrazovania kľúča:

```sh
node --env-file=/tmp/pixelkovia-tools/.env scripts/configure-commerce.mjs --interactive
```

Súbor spravuje CLI; ručne ho neupravovať ani nevypisovať. Tento dočasný súbor nie je potrebný na prevádzku webu. `RESEND_API_KEY` je uložený aj v Codespaces secrets a Cloudflare. Po obnovení Codespace sa trvalé secrets načítajú do prostredia a stačí pôvodný príkaz bez `--env-file`.

DNS názvy Resend, napríklad `send.pixelkovia`, sú relatívne k zóne `rodulab.com`. Skript ich prevedie na `send.pixelkovia.rodulab.com`, podporuje aj úplné názvy a CNAME bez proxy. Záznamy mimo odosielacej subdomény odmietne.

Ak je DNS overenie ešte rozpracované, platby ostanú vypnuté. Opakovanie skriptu používa uložené secrets a existujúci webhook; nevytvára druhý endpoint. Web funguje aj po zastavení alebo prestavaní Codespace.

## Spracovanie nákupu

E-mail je povinný pred vytvorením Checkout Session. Formulár karty je vložený na checkout stránke; banka môže vyžiadať overenie. Cenu a obsah objednávky určuje server, nie suma zaslaná prehliadačom.

Podpísané udalosti `checkout.session.completed` a `checkout.session.async_payment_succeeded` spúšťajú vytvorenie prístupu len po overení `payment_status=paid`, režimu, sumy, meny a väzby na serverovú objednávku. Opakovaná udalosť nevytvorí ďalší účet. Úplný refund zneplatní zaplatený stav objednávky. Návratová URL sama prístup neudelí.

Každý nákup má vlastné zákaznícke ID, zakúpené produkty a náhodné heslo, aj pri rovnakom e-maile. E-mail z **Adam@pixelkovia.rodulab.com** obsahuje iba krátke poďakovanie, odkaz na `/Supervisor`, prihlasovací e-mail a heslo pre daný nákup. Fronta je šifrovaná, úspešné odoslanie vymaže šifrovaný obsah a neúspešné odoslanie sa opakuje.

Vývojový voucher `free`, starý adaptér Payment Links a ručné doručovanie sa nepoužívajú.

## Overenie

`admin/tests/customer-access.test.mjs` kontroluje dva nezávislé nákupy rovnakého e-mailu, idempotenciu, prihlásenie, rozdielne knihy, podpis platobnej udalosti a odstránenie obsahu doručovacej fronty. `tests/customer-journey.test.cjs` overuje skutočný portál, všetkých sedem úloh a hodnotenie v izolovanom Workers/D1 prostredí. Tieto testy nenahrádzajú platbu kartou a doručenie cez živého poskytovateľa.

`node --test tests/email-dns.test.mjs` overuje názvy odosielacích DNS záznamov vrátane ochrany ostatných subdomén.

`node --test tests/commerce-credentials.test.mjs` overuje skryté zadávanie, opakovanie výzvy, rozlíšenie chýb a obnovenie terminálu po zrušení bez vypísania zadanej hodnoty.
