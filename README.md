# Pixelkovia: Stratený signál

Rodinné dobrodružstvo v byte. Sedem kamarátov zo sveta za obrazovkami potrebuje obnoviť prerušené spojenie. Deti riešia papierové indície a spoločné heslo; telefón overuje odpovede a uchováva postup.

## Digitálna identita V6.1

Schválená sada B: Piko je pôvodný modrý sprievodca s obláčikovou hlavou, obrazovkovou tvárou, oblekom a tyrkysovou kravatou. Miky je mikrofón, Pixi svietiaci pixel, Plugy živý USB konektor bez chvosta, Pingy dátový posol, Čipko mikročip s okuliarmi. Guardy používa posledný schválený oranžový štít s tyrkysovou kravatou a kľúčovou dierkou. Hlavný vizuál vychádza z obývačkového variantu 2; obrazové adaptácie pre mobil a desktop zachovávajú layout a veľkosti textov.

Ilustrácie neobsahujú mená ani menovky. Mená zostávajú upraviteľným HTML textom mimo artworku. Nové hovorené prepisy a TTS prompty nepoužívajú konkrétne mená postáv. Zdrojové prompty sú v `assets/characters/` a `assets/printable-scenes/PROMPTS.json`.

## Spoločné zdroje

- `game-data.js`: príbeh, postavy, odpovede a hlasové podklady. `story-text.js` vykresľuje tie isté odseky v hre, storyboarde a tlačovinách.
- `app.js`: oddelený funnel, príprava, hranie, uložený postup a izolované testy zo storyboardu. `cipko-game.js` obsahuje štyri dotykové hry úlohy 5.
- `site-content.js`, `site-config.js`: prezentácia, materiály, príprava, storyboard a katalóg. Ceny a nákupné pravidlá sa nemenia.
- `atlas.html`: deväť literárnych kapitol, sedem úplných profilov a nové ilustrácie. Funguje aj bez JavaScriptu; hráč dostane odkaz až po finále.
- `print-materials.js`, `printables.html`, `signal-print.css`: upraviteľný zdroj všetkých PDF aj zhodného storyboardu. Každý list má jednu A4. Balík má deväť strán: rodičovský návod prvý, úloh 1–7, diplom.

## Zachované hádanky

| Krok | Riešenie |
| --- | --- |
| Úvod | Prvé miesto odhalí iba schválené video, písaný úvod ho neprezrádza. |
| Úloha 1, kúpeľňa | Šesť dátumových záznamov → 741296, S, ďalšia indícia pri okne. |
| Úloha 2, okno | D → A, KODGDM SRG VWROLFNDPL → HĽADAJ POD STOLIČKAMI. Iba papier, bez QR; V sa zachová pri vstupe na liste k úlohe 3. |
| Úloha 3, pod stoličkou | △ 3, ○ 2, □ 4; tabuľka 5 × 7 odhalí 9, E, hádanka smeruje k topánkam. |
| Úloha 4, topánka | Oprava 12 mostíkov podľa trojbodového servisného kľúča, potom 14 presunov cez svetelné uzly → POSTELI a kartička T. Iba papier, bez QR a overovania. Úloha 5 pod vankúšom v detskej posteli. |
| Úloha 5, posteľ | Pixely 1–16 po poradí, obrázok 3 × 3, pexeso 6 párov, potrubie 3 × 3 → 7, 2, 9, 4 → CH – LAD – NIČ – KA → CHLADNIČKA, L. List k úlohe 6 je v chladničke; List k úlohe 7 je samostatne pod gaučom. |
| Úloha 6, chladnička | Deväť poškodených pečatí, sedem doplnkových vzorov, dve falošné pečate. Číslice platných pečatí v poradí opráv 1–7 → 5817264. Úkryt pod gaučom prezradí až Guardyho správa po overení. Ochranné pole partiu chráni, nie je nepriateľom. |
| Úloha 7, pod gaučom | Tri obrazovky 5 × 7: presné dvojice ○★ a △□ odhalia O, K, O. Opakujúce sa O je posledná indícia. Spolu s písmenami z úloh 1–5 vytvorí SVETLO; potvrdenie v návratovej bráne. Vráti sa všetkých sedem, Piko posledný. |

Úkryty sú suché a dostupné bez presúvania nábytku; okno sa neotvára. List úlohy 1 a kruhy z úlohy 2 strihajú deti, Úloha 4 a Úloha 7 zostávajú celé. Čiernobiela tlač je plne hrateľná.

## Video a dabing

`assets/PicoVideo.mp4` a obe pôvodné MP3 zostávajú byte po byte nezmenené. Storyboard oddeľuje archívne nahrávky od nových textov.

**Nové nahrávky Mikyho a Plugyho sú zapojené** cez `GAME.audio = assets/Miky.mp3` a `GAME.plugyAudio = assets/Plugy.mp3`; pôvodné súbory zostávajú v archíve. Miky sa prehrá po správnom kóde. Plugy sa počas odhalenia deviatky pripraví potichu a po odomknutí mosta sa automaticky prehrá od začiatku. Obe správy majú pauzu, pokračovanie, opakovanie a dostupný prepis. `GAME.recordings` určuje stav jednotlivých nahrávok. Testy používajú priamo dodané MP3 v dotykovom Chrome aj WebKite. Prehrávač zachováva prednačítanie, gesto, automatický štart pri úspechu, pauzu, pokračovanie, opakovanie a retry. Chyba sama neotvára prepis ani nemení postup.

## Kompatibilita a administrácia

Kľúč `zahada-v1-progress`, verzia uloženia 2, poradie úloh, číselné dokončenia a písmená zostávajú zachované. Už dokončený Úloha 5 zostáva splnený; rozpracovaný Úloha 5 používa náročnejšie hry. Po poslednej hre sa automaticky uloží písmeno L; obrazovka ukáže iba číslice 7294 a pokyn pokračovať na papieri, bez zadávania miesta. Úloha 6 má samostatný QR `signal=guardy` na ďalšiu úlohu. Stav každej hry sa ukladá do `cipko` v existujúcom postupe. Verzia 2 zachová dohrané minihry zo staršej verzie; aktuálna rozpracovaná plocha sa prispôsobí novému počtu dielikov. Pôvodné QR payloady a URL sú nezmenené pre už vytlačené papiere. Nový List k úlohe 4 nemá QR; nájdený Úloha 5 obsahuje nový QR `signal=cipko`. Ten zaznamená papierový krok 4 a písmeno T bez zadávania odpovede; QR na liste k úlohe 3 rovnako zachová papierové písmeno V z listu k úlohe 2. Starý vstup Úloha 4 zobrazí pokyn pokračovať na papieri. Ich historické hodnoty zostávajú iba v kompatibilnom vstupnom mapovaní a QR dátach. Každý platný QR otvorí priamo svoju úlohu bez overovania predchádzajúcich dokončení. Už vyriešené úlohy aj rozpracované hry sa zachovajú; uložené dokončenia môžu mať medzery. V prehľade sa po spustení dajú otvoriť všetky úlohy. Starý výber políčok sa prevedie na novú vlastnosť bez straty výberu. Nové tlačoviny vyžadujú opätovné potvrdenie vytlačenia, nie reset hry.

Administrácia ponecháva historické obchodné kľúče produktov, pretože ich používajú objednávky a nákupné práva. Dopredná migrácia `0003_digital_identity_names.sql` mení iba viditeľné názvy. Historická migrácia zostáva historickým záznamom. Autentifikácia, ceny, platby a serverové relácie sa nemenia. Starší osem-etapový serverový kontrakt sa nesmie slepo regenerovať zo samostatného sedemúlohového browserového prototypu. Administrácia sa touto publikáciou statického Site nenasadzuje.

## Export a overenie

Autorské závislosti sa inštalujú mimo repozitára: Playwright s Chromium/WebKit, qrcode, jsqr a Python pypdf. `PLAYWRIGHT_MODULE` určuje absolútnu cestu k modulu. Lokálny server: `python3 -m http.server 8080`.

```sh
PLAYWRIGHT_MODULE=/cesta/k/playwright JSQR_MODULE=/cesta/k/jsqr node tests/worksheet-readability.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/print-pagination.test.cjs
node tests/paper-puzzles.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/cipko.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/paper-flow.test.cjs
node tests/mission-data.test.cjs
node tests/digital-identity.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/qr-entry.test.cjs
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

Priama tlač webových listov zachováva samostatné strany aj pri voľbe kratšieho papiera Letter: celé rozloženie vrátane pätičky sa rovnomerne prispôsobí. A4 aj stiahnutý deväťstranový PDF balík zostávajú v pôvodnej mierke. Regresný test overuje kompletnú tlač s hlavičkami aj bez nich a samostatný list Úloha 2.

Tlačové listy používajú spoločné typografické roly v `signal-print.css`: hlavné správy a pracovné pokyny 9 pt Arial, doplňujúce vysvetlenia 8 pt, hlavné nadpisy 21 pt. Menšie popisky a pätičky sú oddelené od hráčskych pokynov; samotné šifry, rovnice a získané písmená zostávajú zámerne výraznejšie. QR kódy na listoch k úlohám 1, 3 a 5 majú jednotne 32 × 32 mm vrátane bieleho okraja štyroch modulov. Generátor používa korekciu H; pôvodné URL sa nemenia. Test číta korekčnú úroveň priamo z formátových bitov vygenerovaných SVG, dekóduje aj vzorku s vymazanou plochou a porovnáva typografiu i rozmery v Chromium a WebKite.

Podklady pre Pikovu záverečnú nahrávku a voliteľné video bez hovorenia (25 s) sú v [docs/finale-podklady.md](docs/finale-podklady.md) aj v storyboarde pri finále. Kým nie sú dodané médiá, hra zobrazuje celú rozlúčku ako text bez ďalšej úlohy. Úlohy majú jednotné označenia Úloha 1–7; v štvorčekoch rodičovského ťaháka sú skrátené na U1–U7.

Aktuálna šestka overuje sedemmiestny kód 5817264 cez číselnú klávesnicu. Správa po úspechu prezradí miesto pod gaučom. Staré odpovede POD GAUC a SPOLU sa prijímajú pre už vytlačené listy; uložené splnenia sa nemenia. Šestka už nepridáva O: posledné písmeno deti odhalia na papieri v sedmičke. Celé heslo SVETLO sa zadáva iba raz. Podklady na nahovorenie: [Guardy](docs/guardy-nahravka.md), [záverečná rozlúčka a video](docs/finale-podklady.md). Nové nahrávky ani finálové video ešte nie sú dodané; hra používa textové správy.
