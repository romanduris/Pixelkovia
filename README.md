# Pixelkovia

Jediná aktívna aplikácia: **https://pixelkovia.rodulab.com**.

- `/` a `/checkout`: predaj hry, dvoch kníh a bezplatného Atlasu.
- `/Supervisor`: rodičovský portál, samostatné prihlasovacie údaje pre každý nákup, PDF materiály, knižnica, tri potvrdenia prípravy, postup siedmimi úlohami a hodnotenie.
- `/hra`: pôvodná hra so siedmimi nezmenenými úlohami. QR odkazy smerujú sem s parametrom `signal`.
- `/admin`: produktová administrácia, objednávky, priebeh hrania a hodnotenia. `/admin/storyboard` vyžaduje to isté administrátorské prihlásenie.

## Zostavenie a nasadenie

Node.js 24+, Python s `pypdf`; závislosti backendu sú pripnuté v `admin/package-lock.json`.

```sh
npm ci --prefix admin
node scripts/prepare-static.mjs
npm run build:check --prefix admin
npm test --prefix admin
# Po commite a pushi na origin/main:
node scripts/deploy-backend.mjs
WRANGLER_BIN=admin/node_modules/wrangler/bin/wrangler.js node scripts/deploy-funnel.mjs
```

Zdroje sú koreňové HTML/CSS/JS, `books-content/` a `assets/`. `dist/funnel/` je jediný nasadzovaný balík aplikácie. Pages Worker povoľuje presný zoznam verejných súborov a pred každým chráneným súborom overuje serverové oprávnenie. Priame URL pod `_protected/` sa nikdy neobsluhujú. Backend používa pôvodnú produkčnú D1; nevzniká druhý zákaznícky systém.

Pôvodná owner-private ChatGPT Site obsahuje iba oznam o presune, zostavený do `dist/client/`. Nie je druhým náhľadom aplikácie.

## Platby a e-maily

Kartu spracúva vložený Stripe Checkout. E-mail je povinný ešte pred vytvorením platby. Server vypočíta cenu podľa spoločného katalógu; podpis webhooku a skutočná zaplatená relácia rozhodujú o vytvorení objednávky. Jedna platba vytvorí iba jeden prístup. Dva nákupy s rovnakým e-mailom vytvoria dva oddelené účty s rôznymi heslami.

Prístupový e-mail z `Adam@pixelkovia.rodulab.com` posiela Resend. Heslo sa uchováva ako hash; šifrovaná správa v doručovacej fronte sa po odoslaní odstráni. Worker opakuje neúspešné odoslania každých desať minút.

Nastavenie: [docs/payment-setup.md](docs/payment-setup.md). Bez overených kľúčov a e-mailovej domény zostáva nákup vypnutý.

## Overenie

```sh
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/customer-journey.test.cjs
node tests/books-content.test.cjs
node tests/static-assets.test.cjs
node tests/digital-identity.test.cjs
node tests/paper-puzzles.test.cjs
```

Predvolený test používa Chromium; `QA_BROWSER=webkit` volí WebKit. Aktuálny WebKit v tomto Codespace pri lokálnych a zachytených URL padá, preto jeho úplné overenie zostáva otvorené. Test celej cesty používa izolované Workers a D1, skutočné prihlasovacie relácie, prípravu, všetkých sedem pôvodných úloh, návrat do portálu, hodnotenie, druhý telefón a administráciu. Nevytvára produkčných zákazníkov ani platby. Prístupové údaje fixture zostávajú v testovacom procese.

## QR a tlač

```sh
QRCODE_MODULE=/cesta/k/qrcode node scripts/generate-qr.cjs
SHARP_MODULE=/cesta/k/sharp PLAYWRIGHT_MODULE=/cesta/k/playwright node scripts/export-printables.cjs
```

PDF má rodičovský návod ako prvú stranu, sedem pracovných listov a diplom, každé na jednej A4. Pri zmene QR sa obnovia aj dotknuté PDF, obrázkové náhľady a spoločný balík. Pravidlá servera a checklist sa odvodzujú zo spoločných zdrojov cez `admin/scripts/sync-game.mjs` a `sync-checklist.mjs`; ceny cez `scripts/sync-catalog.mjs` pri zostavení.
