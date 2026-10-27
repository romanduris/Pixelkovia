# Pixelkovia: Stratený signál

Rodinná hra pre deti 7–13 rokov a rodičov: sedem úloh, tlačiteľné indície a spoločný telefón. Repozitár obsahuje aktuálnu hru, rodičovskú prípravu, storyboard, dve knihy, Atlas a predajnú ponuku.

## Stránky a zdroje

- `index.html`, `sales-page.js`, `sales.css`: predajná stránka.
- `checkout.html`, `checkout.js`, `checkout.css`, `site-config.js`: aktuálny katalóg a výpočet ponuky v centoch. Platby a odosielanie formulára sú vypnuté.
- `parent.html`, `prep-store.js`, `portal-library.js` / `.css`: príprava, materiály a knižnica pre rodiča.
- `game.html`, `app.js`, `game-data.js`, `story-text.js`, `cipko-game.js`: hráčska časť a uložený postup aktuálnej hry.
- `storyboard.html`, `site-content.js`: interný redakčný prehľad, prehrávanie dodaných nahrávok a video podklady.
- `print-materials.js`, `signal-print.css`, `printables.html`: spoločný zdroj pracovných listov, rodičovského ťaháka a diplomu.
- `library.html`, `atlas.html`, `book-*-sample.html`: knižnica, sedem profilov Atlasu a krátke ukážky.
- `book-before.html`, `book-after.html`, `books-preview.html`, `books-content/`: plné knihy iba v súkromnej Site.
- `library-read.html`: zákaznícka čítačka; obsah získa až po serverovom overení zaplateného nákupu. Bez pripojenej zákazníckej identity zostávajú dostupné ukážky a Atlas.
- `book-previews.js` / `.css`: spoločné prístupné okná s ukážkami.
- `admin/`: samostatná chránená administrácia; pravidlá siedmich úloh a checklist sa odvodzujú z aktuálnych herných zdrojov.

V projekte zostávajú iba aktuálne produkty, nahrávky a stránky. Priečinok `MD/` slúži na vstupné zadania; po zapracovaní sa ich súbory odstránia.

## Ponuka

Hra stojí 14,99 € v uvádzacej ponuke; plánovaná cena po jej skončení je 29,99 €. Každá kniha stojí 4,99 €. S jednou knihou je cena 19,98 €, s oboma sa automaticky odpočíta 4,98 € a celok stojí 19,99 €. Celý balík sa dá v checkoute vybrať jedným klikom; oproti súčtu aktuálnych samostatných cien 24,97 € ušetrí 4,98 €. Atlas je predvolene zaškrtnutý zdarma a možno ho odobrať bez zmeny ceny; jeho plánovaná samostatná cena je 2,99 €. Samostatné knihy fungujú bez hry. Podrobnosti: [aktuálna ponuka](docs/offer.md).

## Hra a médiá

QR vstupy: `signal=miky`, `plugy`, `pingy`, `cipko`, `guardy`, `navrat`. Otvárajú priamo príslušnú úlohu. Rozpracované úlohy a dokončenia aktuálnej verzie sa ukladajú lokálne v tom istom prehliadači; postup sa nesynchronizuje medzi zariadeniami.

Aktuálne médiá: `PicoVideo.mp4`, `Miky.mp3`, `Plugy.mp3`, `Guardy.mp3`, `EndScene-Dabing.mp4`. Správy majú prehrávanie, pauzu, opakovanie a prepis. Nahrávky sa potichu pripravujú už pri riešení; automatický štart pri úspechu je autorizovaný gestom. Finále sa po správnom hesle spustí s oneskorením 1 s. Po dohraní ostane posledný záber a po 1 s sa zobrazí KONIEC; opakovanie ho skryje.

## Tlačoviny

Deväť strán A4: rodičovský ťahák, sedem indícií a diplom. Tlač jednostranne v mierke 100 %. Čiernobiela tlač je podporovaná. QR majú korekciu H a štyri moduly bieleho okraja. Tlačové texty a geometria zostávajú vektorové, ilustrácie sa v PDF optimalizujú podľa rozmeru.

Autorské nástroje inštalujte mimo repozitára. Premenné `PLAYWRIGHT_MODULE`, `QRCODE_MODULE` a `SHARP_MODULE` určujú cesty k modulom; `pypdf` je potrebný na spojené PDF.

```bash
QRCODE_MODULE=/cesta/k/qrcode node scripts/generate-qr.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node scripts/export-printables.cjs
# Export podporuje aj jednotlivé ID, napríklad p1 p3.
node admin/scripts/sync-game.mjs
node admin/scripts/sync-checklist.mjs
node scripts/prepare-static.mjs
node tests/books-content.test.cjs
node tests/paper-puzzles.test.cjs
node tests/static-assets.test.cjs
```

## Publikovanie

Pracuje sa na `main`, po dokončení zmeny nasleduje commit a push do `origin/main`. `dist/` sa generuje; neupravuje sa ručne.

- Súkromná hra a redakčné stránky: [existujúca Site](https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site), identita v `.openai/hosting.json`, prístup iba vlastníkovi.
- Verejná ponuka: [pixelkovia.rodulab.com](https://pixelkovia.rodulab.com). Cloudflare sa odovzdáva výhradne `dist/funnel/`, nikdy celý repozitár alebo celý `dist/`. [Postup](funnel/README.md).
- Administrácia sa zostavuje samostatne podľa [admin/README.md](admin/README.md); statické nasadenie ju neobsahuje.

Verejný balík vylučuje hru, odpovede, celé PDF, rodičovský portál, zákaznícku čítačku, administráciu, nahrávky, videá a plné knihy. Knižničné API kontroluje vlastníctvo a doručuje obsah; pripojenie zákazníckeho prihlasovania, platby a prepojenie hráča na server zostávajú nezapojené.
