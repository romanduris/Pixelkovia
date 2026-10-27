# Dve knihy a Atlas — stav na kontrolu

Zadanie: používateľom dodané `00_ZADANIE_PRE_CODEX.md` a tri finálne autorské prílohy. Súbory v `MD/` sa po dokončení odstraňujú na výslovný pokyn používateľa. Literárne zdroje zostávajú v `books-content/before.json`, `after.json` a `atlas.json`; pôvodné kontrolné súčty a počty odsekov sú v `content-integrity.json`.

## Audit a zachovanie

- Aktuálny repozitár obsahoval starú sedemkapitolovú rozprávku aj encyklopédiu na spoločnej stránke. Celá stránka ostáva v `legacy-atlas.html`, štýl v `legacy-atlas.css`, originálne ilustrácie ostávajú nezmenené. Ide o súkromný archív; nie nový verejný bonus.
- Piko zostáva modrý obláčik s obrazovkovou tvárou, oblekom a tyrkysovou kravatou. Guardy aj jeho Ochranné pole chránia; všetkých sedem sa vracia domov. V dodaných textoch nebol nájdený dejový rozpor vyžadujúci zmenu hry.
- Žiadny pôvodný dokument MASTER DESIGNER ani TREASUREQUEST_MASTER v tomto checkoute nebol. Tento záznam je konkrétny podklad na rozhodnutie, nie nové schválenie backendu.
- `game-data.js`, herné odpovede, URL/QR, pracovné listy, postup, nahrávky, video a serverové migrácie sa nemenia. Pôvodná kontrola CRO naďalej kontroluje chránené súbory a pôvodný Atlas cez archív; samostatne zaznamenáva schválené nové doplnky katalógu a checkoutu.

## Ponuka a historické práva

- Hra `episode-1` zostáva 14,99 €. Bonusové misie a ich balíkový výpočet zostávajú rovnaké a nie sú premenované na knihy.
- Nové samostatné ID: `story-book-before` a `story-book-after`. Každé má pracovnú cenu 4,99 €, stav `coming-soon`, cenové označenie `draft` a žiadnu aktívnu kampaň.
- Predvolený checkout hry má dva nezaškrtnuté knižné doplnky. Samostatná pripravovaná ponuka cez `?product=story-book-before` alebo `story-book-after` obsahuje iba príslušnú knihu, nie povinnú hru. Platby, vytvorenie objednávky a odosielanie údajov ostávajú vypnuté.
- Historický produkt `bedtime-book` za 4,90 € a ostatné pôvodné produkty ostávajú bez zmeny. Neoznačujú sa za nový zväzok a neprideľujú nové práva. Ak existujú staré práva, budú sa pri riadnej implementácii viazať k zachovanej pôvodnej rozprávke; žiadna migračná operácia sa teraz nevykonáva.
- Akcia oboch nových kníh za 4,99 € sa NEPOUŽÍVA. Bez schválenia sa ceny sčítajú: dve samostatné knihy 9,98 €; hra a obe knihy 24,97 €.

## Blokujúce rozhodnutia pred predajom

1. Schváliť finálnu cenu každého zväzku a prípadnú kombinovanú akciu. Aktuálne hodnoty sú pracovné, nie spustená fakturácia.
2. Schváliť serverové doručovanie na základe overených nezávislých oprávnení `story-book-before` / `story-book-after`. Nákup jednej knihy nesmie vyžadovať hru, druhú knihu ani herný postup. Existujúce statické prostredie nevie overiť nákup; jeho JavaScript nesmie slúžiť ako paywall.
3. Schváliť migračný plán starých nákupných práv. Odporúčanie: žiadna automatická konverzia `bedtime-book`; zachovať pôvodný obsah, prípadný upgrade rozhodnúť osobitne. Pred migráciou audit počtu dotknutých objednávok, záloha a explicitná mapa SKU → obsah.
4. Až potom možno samostatne aktivovať platby. Táto úloha ich neaktivuje a nerozširuje backend.

## Hranica nasadenia

Verejná Cloudflare Pages doména obsahuje `library.html`, bezplatný `atlas.html` a dve krátke ukážky `book-before-sample.html` / `book-after-sample.html` (dva prvé odseky prvej rozprávky). Verejné sú iba dve obálky a pôvodné portréty. Šesť príbehových ilustrácií sa nepovažuje za verejné ukážky.

Plné `book-before.html`, `book-after.html`, archív, `books-preview.html` a zdrojové JSON sú len v súkromnom pracovnom prostredí. Existujúca Sites audience sa nemení. Súkromná redakčná knižnica je dostupná zo storyboardu. Plné knihy sú pripravené na kontrolu, nie na anonymné produkčné doručovanie.

## Grafika

Hotové sú dve samostatné obálky v jednej sérii a šesť konkrétnych príbehových ilustrácií. Webové obálky sú 1400 × 2000; natívny modelový výstup bol 1049 × 1499 (kvalitný ekvivalent pomeru 7:10, optimalizovaný pre web). Príbehové scény vznikli v 1536 × 1024 a web používa 1200 × 800. Názvy sú prístupný HTML text mimo obrázkov. Použité prompty a referencie sú v `artwork-prompts.json`, pôvodné modelové cesty v `artwork-sources.json`. Pôvodné portréty sa nemenili.

## Ručná redakčná kontrola

Obe knihy majú po tri samostatne uzavreté príbehy; druhý zväzok má krátky vysvetľujúci úvod. Texty sa neprepisovali. Miky je poslucháč/mikrofón, Guardy ochranca, Piko nie nový robot. Príbehy neuvádzajú herné kódy, QR ani pokyny na hľadanie herných indícií. Bežná zmienka o nábytku v príbehu nie je herným úkrytom. Atlas má všetkých sedem dodaných profilov, schopností a aktivít. Overenie úplnosti zdrojových dát a rovnosti vykreslených odsekov je súčasťou testov.
