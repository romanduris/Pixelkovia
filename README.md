# Pixelkovia: Stratený signál

Rodinné dobrodružstvo v byte. Sedem kamarátov zo sveta za obrazovkami potrebuje obnoviť prerušené spojenie. Deti riešia papierové indície a spoločné heslo; telefón overuje odpovede a uchováva postup.

## Digitálna identita V6.1

Schválená sada B: Piko je pôvodný modrý sprievodca s obláčikovou hlavou, obrazovkovou tvárou, oblekom a tyrkysovou kravatou. Miky je mikrofón, Pixi svietiaci pixel, Plugy živý USB konektor bez chvosta, Pingy dátový posol, Čipko mikročip s okuliarmi. Guardy používa posledný schválený oranžový štít s tyrkysovou kravatou a kľúčovou dierkou. Hlavný vizuál vychádza z obývačkového variantu 2; obrazové adaptácie pre mobil a desktop zachovávajú layout a veľkosti textov.

Ilustrácie neobsahujú mená ani menovky. Mená zostávajú upraviteľným HTML textom mimo artworku. Nové hovorené prepisy a TTS prompty nepoužívajú konkrétne mená postáv. Zdrojové prompty sú v `assets/characters/` a `assets/printable-scenes/PROMPTS.json`.

## Spoločné zdroje

- `game-data.js`: príbeh, postavy, odpovede a hlasové podklady. `story-text.js` vykresľuje tie isté odseky v hre, storyboarde a tlačovinách.
- `app.js`: oddelený funnel, príprava, hranie, uložený postup a izolované testy zo storyboardu.
- `site-content.js`, `site-config.js`: prezentácia, materiály, príprava, storyboard a katalóg. Ceny a nákupné pravidlá sa nemenia.
- `atlas.html`: deväť literárnych kapitol, sedem úplných profilov a nové ilustrácie. Funguje aj bez JavaScriptu; hráč dostane odkaz až po finále.
- `print-materials.js`, `printables.html`, `signal-print.css`: upraviteľný zdroj všetkých PDF aj zhodného storyboardu. Každý list má jednu A4. Balík má deväť strán: rodičovský návod prvý, P1–P7, diplom.

## Zachované hádanky

| Krok | Riešenie |
| --- | --- |
| Úvod | Prvé miesto odhalí iba schválené video, písaný úvod ho neprezrádza. |
| P1, kúpeľňa | Šesť dátumových záznamov → 741296, S, ďalšia indícia pri okne. |
| P2, okno | D → A, KODGDM SRG VWROLFNDPL → HĽADAJ POD STOLIČKAMI. Iba papier, bez QR; V sa zachová pri vstupe na P3. |
| P3, pod stoličkou | △ 3, ○ 2, □ 4; tabuľka 5 × 7 odhalí 9, E, hádanka smeruje k topánkam. |
| P4, topánka | Oprava 12 mostíkov podľa trojbodového servisného kľúča, potom 14 presunov cez svetelné uzly → POSTELI a kartička T. Iba papier, bez QR a overovania. P5 pod vankúšom v detskej posteli. |
| P5, posteľ | Hlavná cesta 2 → 4 → 6 → kód 246, L; posledná indícia pod inou stoličkou. |
| P6, iná stolička | Akrostich SPOLU → O. Ochranné pole partiu chráni, nie je nepriateľom. |
| P7, poškodený signál | Vyfarbovanie správnych dvojíc na šiestich obrazovkách → SVETLO; potvrdenie v telefóne. Vráti sa všetkých sedem, Piko posledný. |

Úkryty sú suché a dostupné bez presúvania nábytku; okno sa neotvára. P1 a kruhy P2 strihajú deti, P4 a P7 zostávajú celé. Čiernobiela tlač je plne hrateľná.

## Video a dabing

`assets/PicoVideo.mp4` a obe pôvodné MP3 zostávajú byte po byte nezmenené. Storyboard oddeľuje archívne nahrávky od nových textov.

**Nový dabing čaká na dodanie** pre Mikyho a Plugyho. `GAME.audio` a `GAME.plugyAudio` sú preto `null`; hra ponúka výrazné tlačidlo na prečítanie správy so všetkými potrebnými indíciami. `GAME.recordings` určuje očakávané nové súbory. Po dodaní sa nastaví cesta a preverí prehrávanie v dotykovom Chrome aj WebKite. Prehrávač zachováva prednačítanie, gesto, automatický štart pri úspechu, pauzu, pokračovanie, opakovanie a retry. Chyba sama neotvára prepis ani nemení postup.

## Kompatibilita a administrácia

Kľúč `zahada-v1-progress`, verzia uloženia 2, poradie úloh, číselné dokončenia, odpovede a písmená zostávajú zachované. Pôvodné QR payloady a URL sú nezmenené pre už vytlačené papiere. Nový P4 nemá QR; nájdený P5 obsahuje nový QR `signal=cipko`. Ten po dokončenej úlohe 3 zaznamená papierový krok 4 a písmeno T bez zadávania odpovede. Starý vstup P4 zobrazí pokyn pokračovať na papieri. Ich historické hodnoty zostávajú iba v kompatibilnom vstupnom mapovaní a QR dátach. Ak QR smeruje na neskoršiu úlohu a prehliadač nemá potrebný postup, vstup najprv identifikuje správnu naskenovanú úlohu a vysvetlí chýbajúci postup; až na výslovné ťuknutie otvorí aktuálnu skoršiu úlohu. Nič neoznačí za vyriešené iba na základe takéhoto skenu. Starý výber políčok sa prevedie na novú vlastnosť bez straty výberu. Nové tlačoviny vyžadujú opätovné potvrdenie vytlačenia, nie reset hry.

Administrácia ponecháva historické obchodné kľúče produktov, pretože ich používajú objednávky a nákupné práva. Dopredná migrácia `0003_digital_identity_names.sql` mení iba viditeľné názvy. Historická migrácia zostáva historickým záznamom. Autentifikácia, ceny, platby a serverové relácie sa nemenia. Starší osem-etapový serverový kontrakt sa nesmie slepo regenerovať zo samostatného sedemúlohového browserového prototypu. Administrácia sa touto publikáciou statického Site nenasadzuje.

## Export a overenie

Autorské závislosti sa inštalujú mimo repozitára: Playwright s Chromium/WebKit, qrcode, jsqr a Python pypdf. `PLAYWRIGHT_MODULE` určuje absolútnu cestu k modulu. Lokálny server: `python3 -m http.server 8080`.

```sh
PLAYWRIGHT_MODULE=/cesta/k/playwright JSQR_MODULE=/cesta/k/jsqr node tests/worksheet-readability.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/print-pagination.test.cjs
node tests/paper-puzzles.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/paper-flow.test.cjs
node tests/mission-data.test.cjs
node tests/digital-identity.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/progress-migration.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/narrative.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/storyboard-print.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/presentation.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/stage1.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright JSQR_MODULE=/cesta/k/jsqr node tests/intro-qr.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/prototype.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/miky-audio.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/plugy.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node scripts/export-printables.cjs
node scripts/prepare-static.mjs
```

Zvukové regresné testy pripájajú pôvodné nahrávky iba ako výslovné testovacie podklady; nepredstierajú nový dabing. Backend: `npm run build:check` a `npm test` v `admin/`.

## Publikovanie

Existujúci Site: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site

ID aj publikum sú zachované. Build vzniká cez `node scripts/prepare-static.mjs`; `dist/` nie je zdrojom obsahu. Zmeny sa commitnú a pushnú do `origin/main`, potom sa publikuje existujúci Site. Trvalý odkaz funguje aj po vypnutí Codespace.

Priama tlač webových listov zachováva samostatné strany aj pri voľbe kratšieho papiera Letter: celé rozloženie vrátane pätičky sa rovnomerne prispôsobí. A4 aj stiahnutý deväťstranový PDF balík zostávajú v pôvodnej mierke. Regresný test overuje kompletnú tlač s hlavičkami aj bez nich a samostatný list P2.

Tlačové listy používajú spoločné typografické roly v `signal-print.css`: hlavné správy a pracovné pokyny 9 pt Arial, doplňujúce vysvetlenia 8 pt, hlavné nadpisy 21 pt. Menšie popisky a pätičky sú oddelené od hráčskych pokynov; samotné šifry, rovnice a získané písmená zostávajú zámerne výraznejšie. QR kódy na P1, P3 a P5 majú jednotne 32 × 32 mm vrátane bieleho okraja štyroch modulov. Generátor používa korekciu H; pôvodné URL sa nemenia. Test číta korekčnú úroveň priamo z formátových bitov vygenerovaných SVG, dekóduje aj vzorku s vymazanou plochou a porovnáva typografiu i rozmery v Chromium a WebKite.
