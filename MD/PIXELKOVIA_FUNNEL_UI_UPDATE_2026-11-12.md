# Pixelkovia – update UI stránky „Predajný funnel“

**Stav:** Implementované a otestované, 12. 11. 2026
**Rozsah:** Existujúca záložka **Predajný funnel** v administrácii. Úprava hlavne UI, bez prestavby analytiky.

## Cieľ

Horný prehľad zjednodušiť a vizuálne zmeniť na jasný kompaktný funnel: **Zobrazenia → Stránka → Checkout → Nákupy**, s postupne sa skracujúcimi segmentovanými pruhmi (modrá FB Ads, ružová IG Ads, sivá ostatné/neznáme). Na konci zobraziť **Konverzia, Tržby, Zisk**.

## 1. Horný filter a informácie

- Prepínač **1d / 7d / 14d / 30d / 90d** mierne zúžiť, zhustiť horizontálne medzery, zachovať klikateľnosť a indikáciu výberu.
- Zachovať ovládanie kalendára a existujúce dátumové filtre.
- Odstrániť veľký informačný box pod filtrom typu „Iba nameraná časť obdobia od ...“ **z tejto hornej časti UI**. Ak obsahuje zásadné upozornenie na kvalitu údajov, uchovať ho diskrétne cez info ikonu alebo detail; neskrývať skutočnosť, že údaje nepokrývajú celé obdobie.

## 2. Nové usporiadanie štyroch krokov

Použiť presné krátke popisy:
1. **Zobrazenia** (reklamné impressions z Meta)
2. **Stránka** (návštevy / zobrazenia predajného webu podľa existujúcej definície)
3. **Checkout** (otvorenia checkoutu)
4. **Nákupy** (existujúca definícia nákupov; nemení sa spôsob počítania)

Každý krok sa zobrazí v **jedinom horizontálnom riadku**:

**[VEĽKÝ TUČNÝ NÁZOV] [ŠIROKÝ SEGMENTOVANÝ PRUH] [VEĽKÝ TUČNÝ POČET]**

- Názvy zarovnať do jedného ľavého stĺpca, začiatok všetkých pruhov na rovnakej x-pozícii, čísla vpravo do jedného stĺpca.
- Zachovať kompaktné rozostupy a jednotnú výšku riadkov.
- Zrušiť rušivé podnadpisy ako „Meta – priebežné“, „návštevy – čiastočné“, „platobné pokusy“, „platené + zdarma“; dôležité definície sprístupniť v existujúcich info tooltipoch.
- Pruh nech vyjadruje absolútny objem daného kroku voči referenčnému kroku (ak je metrika porovnateľná). Napríklad pri hodnotách 1000 / 500 / 100 / 20 budú dĺžky úmerné hodnotám. Zachovať viditeľné minimum pri veľmi krátkych pruhoch, no nezavádzať dojem, že ide o presnú mierku, ak bola použitá minimálna šírka.
- **Pozor:** reklamné impressions, webové návštevy a nákupy nemajú rovnaký menovateľ ani nevyhnutne jednu kohortu. Graf nesmie predstierať presne namerané prechody alebo percentuálne straty medzi nimi. Pri nule alebo chýbajúcom údaji nemá graf vytvárať falošný funnel.

## 3. Segmentácia pruhov FB / IG / ostatné

Každý pruh rozčleniť podľa reálne dostupných zdrojov:
- **FB Ads – modrá**
- **IG Ads – ružová**
- **Ostatné / neznáme – sivá**

Segmenty majú súčet zhodný s celkovou hodnotou kroku. **Nepriraďovať neznáme zdroje Facebooku ani Instagramu.** Ak zdrojový rozpad nie je dostupný, zobraz nedostupnosť, nie vymyslené hodnoty.

**Vnútri segmentov** zobraziť malé hodnoty, napríklad „FB 50“, „IG 25“, „Ost. 25“, ak sa bezpečne zmestia. Na mobile adaptívne skracovať alebo zobraziť až po ťuknutí; text nesmie pretekať. Farba samotná nesmie byť jediným rozlišovacím znakom.

Spoločnú **legendu premiestniť z hornej časti boxu pod všetky štyri grafy**; má byť malá, prehľadná a mobilne čitateľná.

## 4. Spodné výsledkové karty

Zachovať:
- **Konverzia** – existujúca hodnota a metodika bez zmeny.
- **Tržby** – existujúci zdroj a metodika bez zmeny.

Pridať alebo jasne vyčleniť tretiu kartu:
- **Zisk = Tržby − náklady na reklamu**, s využitím už existujúcich údajov.

Pre všetky sumy v EUR použiť formát na **jedno desatinné miesto** (napr. `58,9 €`). Zisk kladný zvýrazniť **zelenou**, záporný **červenou**, nulu neutrálne. **Zachovať existujúci rozpis „− reklama“ a pôvodné finančné výpočty**; nesmie dôjsť k duplicitnému odpočtu reklamy. Ak chýba spoľahlivý údaj o reklamných nákladoch, zisk zobraziť ako nedostupný namiesto domysleného čísla.

## 5. Mobile-first dizajn

- Na šírkach **320 / 360 / 390 / 430 px** musí byť funnel kompaktný a čitateľný.
- Všetky štyri riadky nech tvoria jeden kompaktný vizuálny blok; na mobile **nie štyri veľké karty pod sebou**.
- Názvy, pruhy a veľké výsledné počty ponechať v jednom riadku, pokiaľ to rozumne umožní prístupnosť a zväčšené písmo. Na malých šírkach uprednostni čitateľnosť pred doslovným držaním jedného riadka.
- Žiadny horizontálny scroll celej stránky, odrezané čísla ani prekrývajúce sa štítky.
- Tri výsledkové KPI zobraz v kompaktnom responzívnom layoute, podľa potreby zalamuj.
- Na desktope zachovať rovnakú logiku a výrazne širšie segmentované pruhy.

## 6. Rozsah a bezpečnosť zmien

- Najprv preskúmaj existujúci kód, komponenty, dátové zdroje a filtre; opätovne ich použi.
- **Nemeníš** predajnú stránku, checkout, Stripe, hernú logiku, iné záložky Managementu ani existujúce pravidlá atribúcie a výpočty.
- Nové grafy musia rešpektovať obdobie, kampaň a existujúce súhlasy.
- Správne rozlišuj `0`, „Nedostupné“ a „neaktuálne údaje“.
- Nezobrazuj ukážkové čísla ako produkčné.

## 7. Akceptačné kritériá

- [x] Užší filter a diskrétnejšie zaobchádzanie s hornou informačnou hláškou.
- [x] Štyri kroky presne: **Zobrazenia, Stránka, Checkout, Nákupy**.
- [x] V každom riadku názov → farebný pruh → číslo, správne zarovnané.
- [x] Dĺžky pruhov zodpovedajú reálnym počtom, bez zavádzania pri neporovnateľných metrikách.
- [x] Segmenty FB / IG / ostatné a malé čísla vnútri, ak sa zmestia.
- [x] Legenda je až pod grafmi.
- [x] Konverzia a Tržby zostali zachované.
- [x] Zisk = tržby − reklama, kladný zelený / záporný červený, EUR na 1 desatinné miesto.
- [x] Existujúca položka **„− reklama“** sa zachováva a suma sa neodpočítava dvakrát.
- [x] Mobil 320/360/390/430 px a desktop bez pretečenia.
- [x] Testy existujúcich filtrov a finančných výpočtov prešli.

## 8. Odovzdanie

Po implementácii uveď upravené súbory, výsledky testov, prípadné obmedzenia údajov a screenshoty mobilnej aj desktopovej verzie. Nič nesimuluj v produkčných číslach.

**Priorita:** Čistý, kompaktný, intuitívny horný predajný funnel bez zbytočnej komplexity.


## Realizácia a overenie

- Úpravy zostali v hornej časti existujúcej záložky: užšie obdobia, rozbaľovacia informácia o kvalite merania, štyri zarovnané riadky, adaptívne štítky segmentov, legenda pod grafmi a výsledky Konverzia / Tržby / Zisk. Otvorenie definícií sa ukladá medzi existujúce administračné preferencie.
- Dáta, reporty, databáza, atribúcia, počítanie nákupov a pôvodné finančné výpočty zostali zachované. Zisk sa odvodzuje iba v UI ako `revenueCents - costs`, pred zaokrúhlením; pri chýbajúcich, neúplných, chybných alebo neaktuálnych nákladoch je nedostupný. Existujúce „Reklama − …“ zostáva pri hrubých tržbách. Spodný obchodný detail sa nemenil.
- Reklamné impressions majú samostatnú mierku. Webové kroky používajú maximum dostupných webových objemov; graf môže podľa skutočných počítadiel aj rásť a nepredstiera jednu kohortu ani mieru odchodu. Minimum 4 px je uvedené v metodike. Nulové a nedostupné hodnoty nevytvárajú farebné segmenty.
- Prešlo 137 backendových testov; samostatne aj 3 testy preferencií po rozšírení povolených názvov detailov. Prešiel build statického balíka aj Wrangler dry-run.
- Celý prehliadačový scenár prešiel v Chromium a WebKit (Safari cez virtuálnu obrazovku), 320–1920 px vrátane 320/360/390/430 px a 200 % písma. Overené filtre, nedostupnosť, nulové náklady, kladný/záporný/nulový zisk, zachovaná konverzia/tržby/CAC, zarovnanie a štítky bez pretečenia.
- Aktualizované [snímky a podrobnosti QA](../docs/qa/funnel-fb-ig/README.md) obsahujú výslovne označené testovacie údaje. Reálna nenulová reklamná atribúcia na cieľových zariadeniach zostáva samostatným predreklamným overením; tento UI zásah ju nenahrádza.


### Spresnenie podľa vlastníka po nasadení

- Mobilný prepínač období používa päť rovnakých stĺpcov s medzerami a samostatnú 44 px plochu kalendára, aby sa filtre nestláčali. Funkcia filtrov a dátové zdroje zostávajú zachované.
- Segmenty ukazujú iba číselné hodnoty; označenia FB / IG / ostatné zostávajú v legende a v prístupnom popise či detaile.
- Veta o mierke a minime pruhu bola odstránená z hlavného prehľadu. Metodika a obmedzenia sú naďalej dostupné po otvorení informácie pri metrike.
