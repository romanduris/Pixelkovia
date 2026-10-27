# Nasadenie aplikácie Pixelkovia

**https://pixelkovia.rodulab.com** používa pôvodný Pages projekt `pixelkovia-funnel` v `cloudflare.json`. Obsahuje verejný predaj aj serverom chránené zákaznícke a administrátorské rozhrania. Pôvodná ChatGPT Site sa už na vývoj alebo predaj nepoužíva.

`node scripts/prepare-static.mjs` zostaví:

- explicitný verejný zoznam predajnej stránky, checkoutu, prihlasovacej schránky Supervisor, knižných ukážok a schválených obrázkov;
- `_protected/` s aktuálnou hrou, nahrávkami, PDF a interným storyboardom;
- `_worker.js` s presnou mapou rolí ku každému chránenému súboru a `_routes.json` zahrnujúcim všetky HTTP požiadavky.

`gateway.mjs` nepovolí priame čítanie `_protected/`. Pred vrátením materiálu overí zakúpený produkt cez `BACKEND`; samotné `/hra` navyše overí hernú reláciu daného telefónu. Storyboard vyžaduje administrátorské prihlásenie. Knihy sa čítajú cez serverové API z jediného zdroja `books-content/`, nie z druhých plných HTML kópií. Odpovede API a chránené súbory používajú `no-store`.

```sh
node scripts/prepare-static.mjs
npm run build:check --prefix admin
npm test --prefix admin
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/customer-journey.test.cjs
# Po commite a pushi main:
node scripts/deploy-backend.mjs
WRANGLER_BIN=admin/node_modules/wrangler/bin/wrangler.js node scripts/deploy-funnel.mjs
```

Nasadzuje sa iba **dist/funnel/**. Wrangler je pripnutý na **4.151.1** a číta Pages konfiguráciu `funnel/wrangler.jsonc` vrátane privátneho service bindingu na existujúci Worker. API token sa číta z `PIXELKOVIA_TOKEN` alebo `CLOUDFLARE_API_TOKEN`, nikdy sa nevypisuje. Skripty overujú účet, názvy zdrojov, čistý `main` a zhodu s `origin/main`; nedotýkajú sa iných aplikácií ani wildcard DNS.

Verejné náhľady listov zostávajú fyzickými výrezmi bez celých riešení. Jediná výslovne schválená verejná herná snímka je `assets/sales/game-lock-partial.webp`.
