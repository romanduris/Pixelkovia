# Predajný funnel Pixelkovia

> Aktuálny stav po CRO úprave: [audit, nové poradie, merania a screenshoty](cro-audit-2026-10-26/README.md). Stránka má osem sekcií, ponuku hneď po ukážke a FAQ 8 + 11. Nižšie je zachovaný historický záznam predchádzajúcej iterácie; jej dve veľké scény a samostatná knižka už nepopisujú aktuálne rozloženie.

Zmena z 26. 10. 2026. Zdroj stránky je `sales-page.js` a `sales.css`, výber ponuky tvorí `checkout.html`, `checkout.js` a `checkout.css`. Ceny, garancia a výpočet sú v `site-config.js`. Hra, odpovede, uložený postup a herné PDF sa touto zmenou nemenia.

## Obsah a výber ponuky

- Úvod spája pozvanie do spoločného tímu, schválenú obývačkovú scénu, konkrétny priebeh a okamžite dostupné tlačidlo. Na mobile je skupina pri stole medzi nadpisom a popisom, všetko v jednej ilustrácii.
- Priebeh: spoločný zážitok → konkrétne úlohy → úloha mobilu → príprava → zručnosti → skutočné PDF → postavy → knižka → ponuka → garancia a recenzie → 19 FAQ → posledná výzva.
- Skontrolovaný balík `vsetky-materialy.pdf` má 9 A4: rodičovský návod, úlohy 1–7, diplom. Na predajnej stránke sú skutočné náhľady listov 1, 2 a 4; mobil ukazuje prvé dva.
- Základná hra 14,99 €, jednotlivé bonusové misie po 2,90 €, tri spolu 4,90 €, kompletný výber 19,89 €. Balík misií šetrí 3,80 € oproti 8,70 €. Nie je označený ako presná polovičná zľava.
- Cena 14,99 € je východisková obchodná hypotéza, nie výsledok merania konverzií. Pri domácej hre TODY je verejná cena 9,90 €, Mozkonaut ponúka PDF hry za 359–439 Kč. Konkrétne rozsahy produktov sú rôzne. Vyššiu cenu Pixelkov odôvodňuje kombinácia papierového príbehu, digitálnych scén, videí a minihier; overiť treba reálnym predajom.
- Samostatná ponuková cena digitálnej knižky s encyklopédiou je 4,90 €, k hlavnej hre 0 €. Doplnených je sedem profilov a spoločné drobné aktivity v `atlas.html`; pôvodná rozprávka zostáva zachovaná.
- Bonusové misie sú označené ako pripravovaný obsah. Ich výber funguje, no stránka nesľubuje ich okamžité dodanie.
- Žiadny doplnok sa v základnej ponuke automaticky nevyberá. Odkaz výslovne ponúkajúci celý balík prenesie výber cez `?extras=all`. Všetky tri samostatne vybrané misie automaticky použijú lacnejší balík. Dve misie stoja 5,80 €; rozhranie vysvetlí, že všetky tri vyjdú lacnejšie.
- Používateľ potvrdil 14-dňovú garanciu spokojnosti a následne výslovne požiadal ponechať finálne Kúpiť neaktívne. Je natívne `disabled`; formulár blokuje aj Enter a programové odoslanie. Nevzniká objednávka, platba ani e-mail. Meno a e-mail sa neodosielajú a neukladajú. Žiadna e-mailová služba sa nezapája.
- Reálne recenzie neboli dodané. Sekcia to otvorene uvádza; hodnotenia, počty zákazníkov a referencie sa nevymýšľajú.

## Výskum a inšpirácia

Preverené 26. 10. 2026:

1. [Baymard: Payment UX](https://baymard.com/blog/payment-ux) — zrozumiteľný súhrn, viditeľná celková cena a jasná predstava o tom, čo sa stane po ďalšom kroku.
2. [Baymard: Minimize Form Fields](https://baymard.com/research-articles/checkout-flow-average-form-fields) — zníženie počtu polí a odloženie vytvárania účtu. Digitálna ponuka tu potrebuje len e-mail a nepovinné meno.
3. [Baymard: Checkout UX Best Practices](https://baymard.com/research-articles/current-state-of-checkout-ux) — viditeľné povinné/nepovinné vstupy a jednoduchý výber doplnkov.
4. [Shopify: One-page checkout, 2026](https://www.shopify.com/enterprise/blog/one-page-checkout) — priebežne aktualizované ceny a malý počet údajov. Zdrojový článok je aktuálna inšpirácia; základ návrhu stojí na konkrétnych potrebách digitálneho produktu.
5. [Nielsen Norman Group: How Long Do Users Stay on Web Pages?](https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/) — jasný prínos v prvých sekundách. Ide o dlhodobý UX princíp, nie nový trend ani záruku pozornosti konkrétnej rodiny.
6. [Hravopedia](https://hravopedia.sk/) — konkrétna rodičovská situácia, ukážka obsahu, jednoduché kroky, balík a podrobné otázky. Žiadne jej tvrdenia o výsledkoch či zákazníkoch sa neprenášajú.
7. [Sada 3 v 1](https://eslo-3v1.impultienda.ar/) — prvý webový čítač stránku neotvoril; celý HTML obsah sa podarilo načítať priamo. Použitá je inšpirácia v poradí argumentov, ukázaní balíka, opakovaní výzvy a umiestnení garancie. Jej štatistiky, recenzie, odpočty a údajná dostupnosť neboli overované ani použité.
8. [TODY: Záhada v Chrastove](https://www.tody.sk/produkt/zahada-v-chrastove-domaca-unikova-hra/) a [Mozkonaut: Únikovky doma](https://www.mozkonaut.cz/unikovky/p-kde-ji-hrat/doma) — cenové a formátové porovnanie priamo u predajcov.

## Nové obrazové súbory

Použitý je vstavaný nástroj image_gen, nie CLI. Rodinné zábery sú ilustračné scény podľa dodaných PDF, nie zákaznícke fotografie alebo doslovné fotografické reprodukcie tlačovín. Presné funkčné kruhy, texty a čísla poskytujú skutočné PDF náhľady hneď pod nimi. Mená postáv nie sú súčasťou generovaných scén.

- `assets/family-signal-puzzle-v2.webp` — šesť signálov s dátumami, časmi a číslicami, podľa listu 1.
- `assets/family-cipher-puzzle-v2.webp` — dva papierové abecedné kruhy bez kovového spoja, podľa listu 2.
- `assets/pixelkovia-room-mobile.webp`, `assets/pixelkovia-room-desktop.webp` — WebP kópie pôvodnej schválenej ilustrácie. Mobil ju skladá výrezom v CSS.
- `assets/miky-sheet-preview.webp`, `assets/printables/p2-preview.webp`, `assets/printables/p4-preview.webp` — optimalizované kópie existujúcich skutočných náhľadov PDF.

Pôvodné PNG zostávajú zachované. Konverzia a zmenšenie použili Sharp bez zmeny obsahu obrázkov. Úvodný mobilný obrázok má približne 180 kB namiesto niekoľkých MB.

Presné prompty a vstupy: [funnel-image-prompts.json](funnel-image-prompts.json). Vybrané pôvodné výstupy sú zachované aj v úložisku generátora. Pokus o následnú úpravu písmen na kruhoch nebol vybraný.

## Overenie

`BROWSER=chromium PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/sales-checkout.test.cjs` overuje 320, 390, 768 a 1440 px: prechody, všetkých osem kombinácií doplnkov, automatickú cenu balíka, žiadne predvolené doplnky, neaktívnu platbu, neodoslanie formulára, neukladanie kontaktných údajov, zachovanie herného postupu, PDF odkazy a rodičovskú prípravu.

Samostatne prešla kontrola migrácie uloženého postupu. Rozloženie sa vizuálne kontroluje na mobilných aj desktopových snímkach, vrátane úvodu, pracovných listov, postáv a súhrnu objednávky.

Obmedzenia: miestny WebKit padá aj na samostatnom HTML `<h1>Test</h1>` bez projektu; jeho overenie v tomto prostredí nie je spoľahlivé. Existujúce `mission-data.test.cjs` očakáva starú formuláciu „iba celý P1“ v nezmenených herných dátach, ktoré už používajú „iba celý list k úlohe 1“. Existujúci `narrative.test.cjs` čaká scénu pri úlohe `search`, ktorú aktuálny hráč nezobrazuje týmto spôsobom. Tieto staršie nezhody sa v rámci predajnej stránky nemenili.

Následná mobilná úprava s novými fotografickými scénami a skutočnými zábermi hry: [mobile-sales.md](mobile-sales.md).

## Neinteraktívne náhľady pracovných listov

Listy na predajnej stránke zostávajú neklikateľné a neodkazujú na PDF. Po následnej vizuálnej korekcii používajú opäť pôvodné ostré náhľady `assets/miky-sheet-preview.webp`, `assets/printables/p2-preview.webp` a `assets/printables/p4-preview.webp`; rovnaký ostrý list sa vrátil aj do ilustrácie ponuky. Pôvodné malé rozloženie zostáva zachované. Predchádzajúce miniatúry so šírkou 180 px sa už nepoužívajú. Text nevyzýva na otvorenie PDF. Originálne tlačoviny a sťahovanie v rodičovskej príprave zostávajú nezmenené. Táto úprava rieši prezentáciu, nepridáva overovanie prístupu k existujúcim statickým herným súborom.
