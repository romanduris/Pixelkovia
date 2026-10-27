# Verejný funnel Pixelkovia

Samostatná predajná stránka a checkout: **https://pixelkovia.rodulab.com**. Hra bude mať vlastnú stránku; tento projekt jej kód, rodičovský portál, platené príbehy, riešenia, celé PDF, nahrávky ani administráciu nedoručuje. Pôvodná súkromná Site s testovaním hry zostáva zachovaná.

## Build a hranica verejného obsahu

`node scripts/prepare-static.mjs` vytvorí existujúci súkromný výstup `dist/` a samostatný verejný balík **`dist/funnel/`**. Do Cloudflare Pages sa nahráva výhradne vnorený balík. Zdroj pravdy zostáva v koreňových súboroch, `assets/` a tomto adresári; generovaný výstup sa neupravuje.

- Predajný HTML obsah sa vykreslí pri builde z `sales-page.js`. Pri zostavení sa zo súkromných herných dát čítajú iba verejné mená, roly a ID postáv. Herné zdroje sa neposielajú návštevníkovi.
- `sales-interactions.js` zabezpečuje spodnú lištu, otvorenie ukážky a galériu troch rodinných scén a desať jasne označených ilustračných hodnotení; nepoužíva herný postup.
- `atlas.html` je verejný bonus zdarma s kompletnými siedmimi profilmi. `library.html` a `book-before-sample.html` / `book-after-sample.html` obsahujú iba anotácie, obálky a po dva úvodné odseky prvej rozprávky. Plné knihy, `books-preview.html`, `books-content/` a šesť príbehových ilustrácií sa nikdy nekopírujú.
- Checkout používa odvodený `purchase-config.js` s rovnakými cenami a rovnakou funkciou výpočtu z `site-config.js`, bez administrácie a oprávnení na hranie. Platby zostávajú vypnuté, kontakty sa neodosielajú ani neukladajú.
- Odkaz **Voucher** pod tlačidlom otvorí dialóg; vývojový kód `free` upraví celý aktuálny výber na 0 €. Ide iba o prepočet ponuky v pamäti stránky, bez objednávky, odosielania alebo odomknutia obsahu. Rovnaký výpočet a správanie používa súkromný aj verejný build.
- Checkout má kompaktné riadky doplnkov a ponuku celého balíka jedným klikom: 19,99 € oproti aktuálnemu súčtu samostatných položiek 24,97 €. Atlas má normálny checkbox, predvolene zaškrtnutý; jeho odobratie nemení cenu a skryje ho v súhrne. Funkcia `quote()` vracia aj túto voľbu.
- Kopíruje sa presný zoznam 40 schválených obrázkov a fontov. Používateľ schválil skutočný statický záber rozpracovanej mriežky s deviatkou (`assets/sales/game-lock-partial.webp`) namiesto detailu Pika; herný JavaScript ani ďalšie riešenia sa nenahrávajú. Náhľady listov sú fyzicky orezané na rovnakú viditeľnú časť ako v predajnej galérii; celý pôvodný list ani jeho spodný odmenový znak sa nenahrávajú. Originály sú nedotknuté. Štyri súbory `assets/sales/books/*-page-*.webp` sú náhľady strán s pôvodnými ilustráciami a iba dvoma už zverejnenými úvodnými odsekmi každej knihy. Plné obrázky príbehov sa nekopírujú. Obnova výrezov: `SHARP_MODULE=/cesta/k/sharp node scripts/generate-funnel-previews.cjs`.
- Vlastná `404.html` vypína implicitný SPA fallback Pages. Neexistujúce herné a administrátorské adresy vracajú 404. CSP povoľuje potrebné obrázky/fonty a blokuje odoslanie formulára aj nové sieťové API volania.
- Root a checkout môžu zdieľať vzhľad s hrou, ale verejný balík nemá runtime závislosť od hráča, herných dát ani súkromného hostingu.

## Overenie a publikovanie

```bash
node scripts/prepare-static.mjs
# Statický server s koreňom dist/funnel na porte 8081.
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/public-funnel.test.cjs
node tests/books-content.test.cjs
node tests/static-assets.test.cjs
node scripts/deploy-funnel.mjs --check
# Po commite a pushi presnej verzie na main:
WRANGLER_BIN=/cesta/k/wrangler/bin/wrangler.js node scripts/deploy-funnel.mjs
```

Wrangler je pripnutý na 4.151.1. Token sa číta z `PIXELKOVIA_TOKEN` alebo `CLOUDFLARE_API_TOKEN`, zostáva v prostredí procesu a nevypisuje sa. Cieľový účet, zóna, projekt a subdoména sú v `cloudflare.json`. Skript pred zápisom overí účet/zónu, čistý `main`, zhodu `origin/main`, hranicu artefaktu a úspešné nasadenie. Vytvorí alebo použije iba Pages projekt `pixelkovia-funnel` a presný CNAME `pixelkovia.rodulab.com`. Existujúci wildcard a ostatné DNS záznamy nemení; pri kolízii presného záznamu zastaví prácu. DNS smeruje na skutočný `subdomain` vrátený Cloudflare, nie na odhadnutý hostname.

Test verejného funnelu overuje sedem viewportov, zachovanie celej ilustrácie v úvode, CTA, FAQ, galériu (šípky, bodky, klávesnicu aj dotykové posunutie), dialóg ukážky, ceny a všetky kombinácie doplnkov vrátane dvoch nezávislých kníh s pracovnou cenou, neaktívny nákup, nulové odoslanie údajov, zachovanie lokálneho postupu a 404 pre zakázané súbory. Rovnaký test sa spúšťa proti produkčnej doméne.

Prístup k súkromnej Site zostáva owner-private. Táto zmena nespúšťa platby ani zákaznícke doručovanie a nevyberá adresu budúcej samostatnej hry.

Technické podklady: [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [vlastné domény Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/), [statické routovanie a 404](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Ponuka

Platné ceny, doplnky a pravidlá automatickej zľavy sú v [aktuálnej ponuke](../docs/offer.md). Katalóg má presne štyri produkty: hru, dve knihy a Atlas. Funkcia `quote()` je spoločná pre súkromný aj verejný build. Spoločné `book-previews.js` / `.css` otvárajú ukážky na funneli, checkoute a v knižnici bez zmeny výberu alebo ceny.
