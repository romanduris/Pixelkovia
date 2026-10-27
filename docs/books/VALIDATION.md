# Overenie knižnice — 27. 10. 2026

## Hotový obsah a grafika

- Kniha I: tri kompletné finálne autorské rozprávky a pôvodný úvod.
- Kniha II: tri kompletné finálne autorské rozprávky a samostatný vysvetľujúci úvod po veľkom záblesku.
- Atlas: sedem kompletných dodaných profilov, superschopností a aktivít, verejne zdarma bez registrácie.
- Dve nové zladené obálky a šesť príbehových ilustrácií. Názvy sú HTML text, mená nie sú v obrázkoch. Referencie a prompty: `artwork-prompts.json`.
- Pôvodná rozprávka, encyklopédia aj štýl sú zachované v súkromnom archíve. Vstupné štyri súbory v `MD/` sú po prevzatí a overení odstránené na žiadosť používateľa.

## Úspešné kontroly

- `node tests/books-content.test.cjs`: hash každého literárneho zdroja, 3 + 3 úplné príbehy, doslovne zachovaný archív, sedem profilov, pôvodné ID/ceny, vypnuté platby, všetkých 32 kombinácií a fyzické vylúčenie plných kníh z verejného balíka.
- `node tests/library.test.cjs` v Chromium: šírky 320 / 390 / 1440, všetky nové stránky, obrázky, doslovná rovnosť každého vykresleného odseku s autorskými dátami, dva režimy čítania a ich uchovanie, Atlas, 32 kombinácií, samostatné ponuky kníh bez hry, zachovaný herný postup a 404 pre platené zdroje.
- `tests/public-funnel.test.cjs`: sedem responzívnych rozmerov, FAQ, galéria, ukážka, ceny misií, neaktívne platby, nulové odosielanie údajov, zachovanie postupu a privátna hranica.
- `tests/sales-checkout.test.cjs`, `BROWSER=chromium`: súkromný funnel a checkout pri siedmich rozmeroch, nové znenie Atlasu a pôvodné kombinácie misií.
- `tests/atlas.test.cjs`, `BROWSER=chromium`: pôvodná rozprávka aj encyklopédia v archíve, nezmenený text, pôvodné ilustrácie a oba režimy čítania.
- `tests/progress-migration.test.cjs`: staré postupy sa zachovajú, výsledné heslo aj všetci siedmi vo finále ostali nezmenení.
- `tests/qr-entry.test.cjs`, iba Chromium: každý QR alias funguje priamo; splnenia a rozpracované minihry sa zachovajú.
- `tests/paper-puzzles.test.cjs`: hádanky aj návratové znaky nezmenené.
- `scripts/verify-cro-scope.cjs`: 176 chránených záznamov skontrolovaných; starý Atlas cez archív, explicitne schválené nové dodatky checkoutu/katalógu samostatne hashované.
- `tests/static-assets.test.cjs`: 80 cache-bustovaných odkazov zodpovedá presnému obsahu.

## Limit overenia

WebKit pri navigácii na lokálnu stránku v tomto prostredí predčasne zavrel stránku/browser. Nie je označený za úspešný. Chromium prešiel všetkými uvedenými mobilnými a desktopovými scenármi. Nová úloha nemení prehrávače ani multimédiá hry.

## Screenshoty

- [Knižnica — mobil](screenshots/library-mobile.png)
- [Knižnica — desktop](screenshots/library-desktop.png)
- [Atlas — mobil](screenshots/atlas-mobile.png)
- [Atlas — desktop](screenshots/atlas-desktop.png)
- [Kniha I — mobilný súkromný náhľad](screenshots/book-before-mobile.png)
- [Kniha II — desktopový súkromný náhľad](screenshots/book-after-desktop.png)

## Čaká na samostatné obchodné rozhodnutie

Finálne ceny, prípadná spoločná akcia, konverzia starých oprávnení a serverové vydávanie platených kníh podľa nezávislých licencií. Konkrétny návrh a blokujúce podmienky pred predajom sú v `MASTER_DESIGNER.md`. Nenasadzuje sa nová platobná brána ani serverový paywall.
