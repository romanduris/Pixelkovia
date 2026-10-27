# Dve knihy a Atlas — stav na kontrolu

Zadanie: používateľom dodané `00_ZADANIE_PRE_CODEX.md` a tri finálne autorské prílohy. Súbory v `MD/` sa po dokončení odstraňujú na výslovný pokyn používateľa. Literárne zdroje zostávajú v `books-content/before.json`, `after.json` a `atlas.json`; pôvodné kontrolné súčty a počty odsekov sú v `content-integrity.json`.

## Audit a zachovanie

- Aktuálny repozitár obsahoval starú sedemkapitolovú rozprávku aj encyklopédiu na spoločnej stránke. Celá stránka ostáva v `legacy-atlas.html`, štýl v `legacy-atlas.css`, originálne ilustrácie ostávajú nezmenené. Ide o súkromný archív; nie nový verejný bonus.
- Piko zostáva modrý obláčik s obrazovkovou tvárou, oblekom a tyrkysovou kravatou. Guardy aj jeho Ochranné pole chránia; všetkých sedem sa vracia domov. V dodaných textoch nebol nájdený dejový rozpor vyžadujúci zmenu hry.
- Žiadny pôvodný dokument MASTER DESIGNER ani TREASUREQUEST_MASTER v tomto checkoute nebol. Tento záznam je konkrétny podklad na rozhodnutie, nie nové schválenie backendu.
- `game-data.js`, herné odpovede, URL/QR, pracovné listy, postup, nahrávky, video a serverové migrácie sa nemenia. Pôvodná kontrola CRO naďalej kontroluje chránené súbory a pôvodný Atlas cez archív; samostatne zaznamenáva schválené nové doplnky katalógu a checkoutu.

## Schválený pracovný model MVP — aktualizácia Early Bird

Používateľ dodal a prikázal zapracovať `PIXELKOVIA_FUNNEL_EARLY_BIRD_A_KNIZKY_ZADANIE.md`. Kontrolný súčet zadania je v `scope-approval.json`. Týmto zadanie nahrádza pôvodný návrh s bonusovými misiami a sčítavaním cien bez akcie.

- Hra `episode-1`: 14,99 € teraz, plánovaná cena po úvodnej ponuke 29,99 €. Nie historická predchádzajúca cena. Bez časovača či vymysleného počtu dostupných kusov.
- `story-book-before` a `story-book-after`: 4,99 € každá. Samostatný nákup nevyžaduje hru. Dve knihy bez hry 9,98 €.
- Checkout má tri karty: dve štandardne nezaškrtnuté knihy a neodoberateľný Atlas zdarma. `atlas-pixelkov` má plánovanú samostatnú cenu 2,99 €; v aktuálnej ponuke sa účtuje 0 €.
- Hra bez kníh 14,99 €, s jednou 19,98 €, s oboma automaticky 19,99 €. Viditeľný riadok zľavy −4,98 € existuje iba pri oboch knihách. Odobratie druhej knihy zľavu okamžite zruší. Plánovaná samostatná cenníková hodnota všetkého je 42,96 €, nie 49,99 € ani minulá cena.
- Bonusové misie sa nevyrábajú ani neponúkajú. Ich pôvodné produkty, ceny a ID aj historický `bedtime-book` ostávajú v súkromnom katalógu a databáze bez migrácie alebo zmeny práv. Verejný katalóg ich neobsahuje a kalkulácia ich ignoruje.
- Formulár, platby a doručovanie ostávajú neaktívne. Nová cenová prezentácia neudeľuje oprávnenia ani nespúšťa backend.

## Pred aktiváciou predaja

1. Serverové doručovanie založené na overených nezávislých oprávneniach `story-book-before` / `story-book-after`. Statické JavaScriptové prepnutie nie je paywall.
2. Prípadné historické nákupné práva vyžadujú osobitný migračný plán, audit a zálohu. Žiadna automatická konverzia `bedtime-book`.
3. Samostatné schválenie a implementácia platieb. Zatiaľ sa nič neobjednáva, neplatí ani neposiela.

## Hranica nasadenia

Verejná Cloudflare Pages doména obsahuje `library.html`, bezplatný `atlas.html` a dve krátke ukážky `book-before-sample.html` / `book-after-sample.html` (dva prvé odseky prvej rozprávky). Verejné sú dve obálky, pôvodné portréty a štyri nové screenshoty ukážkových strán v `assets/sales/books/`. Náhľady obsahujú len dva už verejné úvodné odseky a schválené ilustrácie. Šesť plných príbehových ilustrácií sa samostatne nekopíruje. Okná s ukážkou fungujú aj pre celú dvojknihu.

Plné `book-before.html`, `book-after.html`, archív, `books-preview.html` a zdrojové JSON sú len v súkromnom pracovnom prostredí. Existujúca Sites audience sa nemení. Súkromná redakčná knižnica je dostupná zo storyboardu. Plné knihy sú pripravené na kontrolu, nie na anonymné produkčné doručovanie.

## Grafika

Hotové sú dve samostatné obálky v jednej sérii a šesť konkrétnych príbehových ilustrácií. Webové obálky sú 1400 × 2000; natívny modelový výstup bol 1049 × 1499 (kvalitný ekvivalent pomeru 7:10, optimalizovaný pre web). Príbehové scény vznikli v 1536 × 1024 a web používa 1200 × 800. Názvy sú prístupný HTML text mimo obrázkov. Použité prompty a referencie sú v `artwork-prompts.json`, pôvodné modelové cesty v `artwork-sources.json`. Pôvodné portréty sa nemenili.

## Ručná redakčná kontrola

Obe knihy majú po tri samostatne uzavreté príbehy; druhý zväzok má krátky vysvetľujúci úvod. Texty sa neprepisovali. Miky je poslucháč/mikrofón, Guardy ochranca, Piko nie nový robot. Príbehy neuvádzajú herné kódy, QR ani pokyny na hľadanie herných indícií. Bežná zmienka o nábytku v príbehu nie je herným úkrytom. Atlas má všetkých sedem dodaných profilov, schopností a aktivít. Overenie úplnosti zdrojových dát a rovnosti vykreslených odsekov je súčasťou testov.
