# Pixelkovia — CRO audit a úprava funnelu

> Historický záznam CRO iterácie. Po nej nasledovala [oprava ilustrácie cez celú plochu úvodu](../hero-background-2026-10-26/README.md); pôvodné merania a screenshoty nižšie zostali zachované ako porovnávací záznam.

26. október 2026 · Základ porovnania: `1c2bbd4a976a51f85271f417e74f92326cfcdfaf`

[Publikovaná stránka](https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site) · [Vizuálne porovnanie](compare.html) · [Pôvodné merania](before.json) · [Nové merania](after.json)

Výsledok je zmena informačnej architektúry, obsahu a prezentácie. Nemáme návštevnícke dáta ani spustené platby, preto nejde o preukázané zvýšenie konverzií. Osem sekcií ponecháva konkrétnu ukážku, celý obsah ponuky, všetkých sedem postáv, podmienky prípravy, garanciu aj všetkých 19 pôvodných FAQ.

## A. Audit pred úpravou

### Najdôležitejšie zistenia

| Zistenie | Prečo prekážalo rozhodnutiu | Zmena |
| --- | --- | --- |
| Kompletná ponuka sa na mobile 390 × 844 začínala na 7 444 px; samotná cenová karta na 8 021 px. | Rodič prešiel takmer deväť výšok obrazovky, kým sa začal ucelený obchodný blok. | Ponuka je tretia sekcia, hneď po konkrétnej ukážke. |
| Samostatný emocionálny úvod, zručnosti, postavy a knižka opakovali príbuzné argumenty. | Veľká časť scrollovania neprinášala úmerne veľa nových informácií. | Benefity a postavy sú spolu; knižka je priamo v ponuke. |
| Dve vysoké scény a ďalšie ukážky rozťahovali demonštráciu na 2 520 px pri 390 px šírke. | Princíp papier + mobil sa vysvetlil skôr, než sa blok skončil. | Jedna celá rodinná scéna, tri stručné kroky a viditeľný skutočný záber úvodnej správy. |
| Rozsvietená mriežka ukazovala výsledok úlohy. | Pred hraním prezrádzala riešenie. | Z predajnej prezentácie odstránená; z hry ani z assetov sa nič nevymazalo. |
| Hlavný obsah balíka, materiály, knižka a cena boli rozdelené. | Návštevník ich musel sám spojiť do jednej ponuky. | Jedna sekcia obsahu, drobné ostré náhľady, jedna detailná cenová karta a knižka zdarma. |
| Všetkých 19 zatvorených otázok tvorilo dlhý blok. | Menej podstatné otázky súperili s vekovým odporúčaním, prípravou a garanciou. | Osem hlavných otázok; zvyšných jedenásť v bloku „Ďalšie otázky“. Texty sú zhodné s baseline. |
| Spodná lišta sa na 390 px zobrazovala aj pri plne viditeľnom hero CTA. | Dve súbežné nákupné výzvy zvyšovali vizuálny hluk. | Lišta sa skryje pri viditeľnom hlavnom CTA v hero, ponuke alebo závere. |
| Predaj ešte nefunguje. | Nákupná formulácia by mohla navodzovať dojem prijatej objednávky. | Konzistentné „Pozrieť ponuku“ a okamžite viditeľný stav platieb aj v checkoute. |
| Samostatný blok o chýbajúcich recenziách neprinášal dôkaz produktu. | Zdôrazňoval absenciu dôveryhodnosti. | Nahradili ho reálne materiály, presný obsah a jasná garancia; žiadne vymyslené recenzie. |

### Audit každej pôvodnej sekcie — deväť otázok

Číslovanie: **1** cieľ, **2** nová informácia, **3** hodnota pre rozhodnutie, **4** opakovanie, **5** poloha, **6** možnosť zlúčenia, **7** obsah vzhľadom na výšku, **8** význam pre mobil, **9** opora v produkte. Výšky nižšie sú merané pri 390 × 844, FAQ zatvorené. Označenie rozhodnutia opisuje úpravu, nie univerzálnu CRO poučku.

#### 1. Hero — KEEP / COMPRESS

**1:** Zaujať a vysvetliť produkt. **2:** Názov, atmosféra, hlavná cena a vstup do ponuky. **3:** Vysoká, ale konkrétne požiadavky boli rozptýlené. **4:** Emócia sa opakovala v nasledujúcom úvode a závere. **5:** Patrí na začiatok. **6:** Fakty z pásu pod hero patria sem. **7:** 690 px má opodstatnenie ako vizuálny úvod; pri novom konkrétnom titulku potrebujeme zachovať miesto na postavy a čitateľný text. **8:** Kritická. **9:** Sedem úloh, vekové odporúčanie, digitálna tlač a jeden mobil vychádzajú z hry a aktuálnej ponuky. Výsledok: konkrétny nadpis, krátky dej, štyri fakty, cena, knižka, CTA a pravdivý stav predaja.

#### 2. Emocionálny úvod „spolu“ — MERGE

**1:** Pomenovať spoločný rodinný čas. **2:** Emocionálna motivácia, málo ďalších produktových faktov. **3:** Pomáha identifikácii, nemusí stáť pred dôkazom hry. **4:** Opakuje hero, zručnosti aj finále. **5:** Samostatná druhá sekcia odďaľovala ukážku. **6:** Zlúčená so zručnosťami a postavami. **7:** 408 px bolo veľa za prevažne podobné posolstvo. **8:** Benefit dôležitý, samostatná plocha menej. **9:** Spolupráca je súčasťou herných činností, nejde však o meraný pedagogický výsledok.

#### 3. Ukážka hybridného hrania — COMPRESS / MOVE

**1:** Dokázať, ako sa strieda papier, hľadanie a telefón. **2:** Konkrétne scény a rozhranie. **3:** Veľmi vysoká. **4:** Druhá scéna opakovala princíp a časť textu z prípravy. **5:** Má byť ihneď po hero. **6:** Ilustračná fotografia a skutočný záber môžu tvoriť jeden blok. **7:** 2 520 px bolo neúmerne veľa; dve vysoké fotografie neboli potrebné na vysvetlenie jedného princípu. **8:** Kritická. **9:** Ilustračná scéna je označená; Pikov záber je z dodávaného videa. Grid s výsledkom je vyradený z funnelu.

#### 4. Ako sa hrá — COMPRESS / MOVE

**1:** Objasniť prácu rodiča. **2:** Tlač, ukrytie, spustenie, pomôcky. **3:** Vysoká, rieši praktickú námietku. **4:** Časť princípu vysvetľovala už ukážka a FAQ. **5:** Za skorou kompletnou ponukou, pred ďalšími benefitmi. **6:** Pomôcky sú spoločná poznámka, nie ďalšie veľké karty. **7:** 808 px bolo možné skrátiť na tri kroky. **8:** Vysoká. **9:** Pokyny zodpovedajú príprave; nesľubujeme neodmeraný čas prípravy. Celé listy ukrýva rodič, strihajú až deti.

#### 5. Zručnosti — MERGE

**1:** Vysvetliť, čo deti počas hry robia. **2:** Hľadanie súvislostí, postreh, spolupráca. **3:** Stredná až vysoká pri konkrétnych činnostiach. **4:** Prekrýva spoločný čas a úlohy v ukážke. **5:** Nevyžaduje samostatný blok pred cenou. **6:** Zlúčená s emóciou a postavami. **7:** 699 px nebolo potrebných na tieto tri argumenty. **8:** Dôležité, ale stručne. **9:** Hra obsahuje dané činnosti; nesľubujeme zvýšenie inteligencie ani merané vzdelávacie výsledky.

#### 6. Materiály — MERGE / MOVE

**1:** Ukázať konkrétne dodávané výstupy. **2:** Vzhľad tlačových listov. **3:** Vysoká dôkazná hodnota. **4:** Obsah sa objavoval aj v ponuke. **5:** Patrí priamo k tomu, čo rodič kupuje. **6:** Zlúčená s hlavnou ponukou. **7:** 677 px bolo možné nahradiť menšou galériou bez čitateľnej polovice hry. **8:** Dôležitá. **9:** Zachované pôvodné ostré zdroje; náhľady sú malé, neklikateľné a označené ako výrezy. Spodná časť s odmenovým znakom zostáva mimo výrezu. Toto nie je ochrana pôvodných verejných súborov pred technickým stiahnutím.

#### 7. Sedem Pixelkov — KEEP / MERGE

**1:** Podporiť príbeh a vzťah k postavám. **2:** Mená a úlohy siedmich kamarátov. **3:** Podporná emocionálna hodnota. **4:** Dlhší príbehový úvod opakoval atmosféru hero. **5:** Po vysvetlení a ponuke. **6:** Pod spoločné benefity. **7:** 582 px bolo možné skrátiť pri zachovaní všetkých postáv. **8:** Dôležité ako krátka, natívne posuvná galéria. **9:** Schválené postavy z hry, bez úprav identity; na predajnej stránke sa využívajú existujúce WebP.

#### 8. Knižka a encyklopédia — MERGE

**1:** Ukázať bonus v cene. **2:** Čítanie a bližšie spoznanie postáv. **3:** Pomáha hodnote ponuky. **4:** Samostatná veľká prezentácia opakovala cenu a príbehovú emóciu. **5:** Patrí k cene hlavnej hry. **6:** Zlúčená s cenovou kartou. **7:** 827 px bolo neúmerne veľa za doplnok k hlavnej hre. **8:** Dôležité vidieť „zdarma“, nepotrebuje vlastnú obrazovku. **9:** Existujúca digitálna knižka a encyklopédia; samostatná cena 4,90 € zostala v katalógu aj FAQ. Ilustrácia bonusu sa zobrazuje celá.

#### 9. Hlavná ponuka — MOVE / COMPRESS

**1:** Spojiť obsah a cenu. **2:** Presný balík, cena, dobrovoľné doplnky. **3:** Kritická. **4:** Materiály a knižka už boli vysvetlené inde. **5:** Pôvodných 7 444 px je príliš neskoro na prvý ucelený blok; teraz je tretí. **6:** Obsahuje materiály aj knižku. **7:** 1 486 px sa dá využiť efektívnejšie odstránením duplicitnej prezentácie. **8:** Kritická. **9:** Cena 14,99 €, knižka zdarma, voliteľné pripravované misie a obchodné pravidlá sú z existujúcej konfigurácie. Zachovaná jedna detailná cenová karta.

#### 10. Garancia a dôvera — COMPRESS / REMOVE

**1:** Znížiť obavu z nevhodnej kúpy. **2:** Garancia a kontakt; negatívny blok o absencii recenzií. **3:** Garancia vysoká, samotné konštatovanie chýbajúcich recenzií nízka. **4:** Materiálové dôkazy už boli inde. **5:** Kompaktná garancia pred FAQ. **6:** Recenzie nenahrádzame prísľubmi; dôkazy sú v ukážke a ponuke. **7:** 769 px nebolo potrebných pre jednu garanciu. **8:** Vysoká. **9:** Schválených 14 dní, kontakt z nákupného e-mailu, vrátenie zaplatenej sumy aj po začatí hrania. Bez falošných hodnotení.

#### 11. FAQ — COMPRESS

**1:** Odpovedať na námietky a obmedzenia. **2:** Vek, čas, tlač, internet, počet hráčov, uloženie, opakovanie, doplnky, neaktívna platba. **3:** Vysoká. **4:** Zámerne podrobnejšie rozvíja stručné tvrdenia vyššie. **5:** Pred záverom. **6:** Osem prioritných otázok, jeden blok pre ďalších jedenásť. **7:** 1 625 px bolo možné skrátiť bez vymazania odpovedí. **8:** Kritická, musí fungovať dotykom aj klávesnicou. **9:** Všetkých 19 položiek je doslovne zachovaných; kontrolované hashom zdrojového poľa aj počtom v DOM.

#### 12. Finálna výzva — COMPRESS

**1:** Ponúknuť ďalší krok po prečítaní. **2:** Rekapitulácia, nie nový argument. **3:** Vysoká ako akcia, nižšia ako opakovanie príbehu. **4:** Pôvodne ďalšia emocionálna plocha. **5:** Na konci. **6:** Cena, obsah, bonus a garancia v jednej vete. **7:** 500 px bolo možné skrátiť. **8:** Dôležitá, CTA pohodlne dosiahnuteľné a bez súbežnej spodnej lišty. **9:** Všetky rekapitulované údaje zodpovedajú tej istej ponuke.

Pôvodný pás faktov, navigácia a päta neboli samostatné `<section>`. Fakty sa presunuli do hero, kontakt a päta zostávajú dostupné. Počet 12 → 8 preto porovnáva rovnaký selektor `#app > section`.

## B. Before / after — architektúra

| Pôvodné poradie | Pôvodný blok | Rozhodnutie | Nové miesto |
| --- | --- | --- | --- |
| 1 | Hero + pás faktov | KEEP / COMPRESS | 1. Hero so zážitkom, požiadavkami, cenou a stavom predaja |
| 2 | Samostatná emócia spoločného času | MERGE | 5. Benefity a Pixelkovia |
| 3 | Dve vysoké scény + herné obrazovky | COMPRESS / MOVE | 2. Jedna celá scéna, postup a viditeľný skutočný záber |
| 4 | Príprava / ako sa hrá | COMPRESS / MOVE | 4. Tri kroky + pravdivé požiadavky |
| 5 | Zručnosti | MERGE | 5. Benefity a Pixelkovia |
| 6 | Materiály | MERGE / MOVE | 3. Obsah ponuky a malé ostré výrezy |
| 7 | Sedem postáv | KEEP / MERGE | 5. Všetkých sedem, na mobile natívne posúvanie |
| 8 | Samostatná knižka | MERGE | 3. Bonus priamo pri cene |
| 9 | Ponuka | MOVE / COMPRESS | 3. Čo dostanete za 14,99 € |
| 10 | Garancia a informácia o chýbajúcich recenziách | COMPRESS / REMOVE | 6. Garancia; nepotrebný negatívny blok odstránený |
| 11 | 19 FAQ v jednom zozname | COMPRESS | 7. Osem hlavných + jedenásť ďalších, rovnaký obsah |
| 12 | Veľká finálna emócia a CTA | COMPRESS | 8. Krátka rekapitulácia a „Pozrieť ponuku“ |

## C. Skutočné merania

| Rozmer | Výška pred → po | Skrátenie | Sekcie pred → po | Ukážka: px pred → po (výšky obrazovky) | Ponuka: px pred → po | Cenová karta: px pred → po |
| --- | --- | --- | --- | --- | --- | --- |
| 320 × 568 | 12316 → 7465 | 39.4 % | 12 → 8 | 1578 → 1151 (2.78 → 2.03) | 7429 → 2221 | 7981 → 3219 |
| 360 × 640 | 11962 → 7165 | 40.1 % | 12 → 8 | 1551 → 1091 (2.42 → 1.7) | 7280 → 2160 | 7832 → 3074 |
| 390 × 844 | 12094 → 7157 | 40.8 % | 12 → 8 | 1650 → 1052 (1.95 → 1.25) | 7444 → 2169 | 8021 → 3102 |
| 430 × 932 | 11957 → 6907 | 42.2 % | 12 → 8 | 1623 → 1052 (1.74 → 1.13) | 7409 → 2194 | 7985 → 3049 |
| 768 × 1024 | 10592 → 5304 | 49.9 % | 12 → 8 | 1694 → 1209 (1.65 → 1.18) | 6659 → 1783 | 6746 → 2007 |
| 1366 × 768 | 11192 → 5061 | 54.8 % | 12 → 8 | 1772 → 1009 (2.31 → 1.31) | 7311 → 1768 | 7397 → 2007 |
| 1440 × 900 | 11206 → 5061 | 54.8 % | 12 → 8 | 1775 → 1009 (1.97 → 1.12) | 7323 → 1768 | 7408 → 2007 |

| Rozmer | Prvé CTA v navigácii: px pred → po | Hero CTA: px pred → po | Cena v hero celá v prvom pohľade: pred → po | Mobilná lišta: pred → po | Overflow pred / po | Padding sekcií: px pred → po |
| --- | --- | --- | --- | --- | --- | --- |
| 320 | 10 → 9 | 511 → 707 | nie → nie | áno → áno | nie / nie | 1065 → 528 |
| 360 | 10 → 9 | 511 → 707 | áno → nie | áno → áno | nie / nie | 1065 → 528 |
| 390 | 12 → 11 | 585 → 715 | áno → áno | áno → nie | nie / nie | 1065 → 532 |
| 430 | 12 → 11 | 585 → 715 | áno → áno | áno → nie | nie / nie | 1065 → 532 |
| 768 | 22 → 18 | 626 → 819 | áno → áno | nie → nie | nie / nie | 1931 → 714 |
| 1366 | 22 → 18 | 626 → 654 | áno → áno | nie → nie | nie / nie | 1931 → 714 |
| 1440 | 22 → 18 | 626 → 654 | áno → áno | nie → nie | nie / nie | 1931 → 714 |

Viditeľnosť v tabuľke znamená umiestnenie celého prvku v hraniciach viewportu. Pôvodné hero CTA na krátkej obrazovke mohla prekryť spodná lišta. Po úprave cena na 320/360 px zostáva viditeľná v spodnej lište; údaj „nie“ sa vzťahuje iba na samostatný blok ceny v hero.

### Výšky a padding jednotlivých sekcií na mobile 390 × 844

| Pôvodný blok | Začiatok px | Výška px | Vertikálny padding px |
| --- | --- | --- | --- |
| Dnes večerbudeme jeden tím. | 68 | 690 | 0 |
| „Poď sem.Na niečo sme prišli!“ | 923 | 408 | 73 |
| Dobrodružstvo, ktorémôžete chytiť do rúk. | 1331 | 2520 | 98 |
| Z obyčajného bytumiesto plné tajomstiev. | 3852 | 808 | 98 |
| Každý môžezažiariť po svojom. | 4659 | 699 | 98 |
| Toto si naozajvytlačíte na stôl. | 5358 | 677 | 98 |
| Spoznajte partiu,ktorá vás potrebuje. | 6035 | 582 | 98 |
| A po dobrodružstveešte chvíľu spolu. | 6617 | 827 | 98 |
| Vaša obývačka.Vaše deti.Váš spoločný príbeh. | 7444 | 1486 | 98 |
| Sadne vám hra?Vyskúšajte ju spolu. | 8931 | 769 | 98 |
| Nech viete,do čoho idete. | 9699 | 1625 | 98 |
| Pri stole je miestoaj pre váš tím. | 11325 | 500 | 110 |

| Nový blok | Začiatok px | Výška px | Vertikálny padding px |
| --- | --- | --- | --- |
| Premeňte svoj byt na veľké rodinné dobrodružstvo. | 66 | 750 | 0 |
| Takto vyzerá dobrodružstvo u vás doma. | 816 | 1353 | 84 |
| Čo dostanete za 14,99 €. | 2169 | 1728 | 84 |
| Vy pripravíte indície. Potom hráte spolu. | 3897 | 697 | 84 |
| Viac spoločného objavovania. | 4594 | 870 | 84 |
| Ak vám hra nesadne, vrátime peniaze. | 5487 | 281 | 50 |
| Čo rodičia potrebujú vedieť. | 5792 | 798 | 84 |
| Vaše ďalšie rodinné dobrodružstvo sa môže začať doma. | 6590 | 304 | 62 |

Výšky, začiatky, padding a počet textových znakov pre každú sekciu na **všetkých siedmich** rozmeroch sú v priložených `before.json` a `after.json`.

### Metóda a interpretácia

- Chromium, lokálny statický HTTP server, čerstvý kontext pri každom rozmere, DPR 1, bez obmedzenia CPU a siete. Nie je to meranie cez produkčný CDN ani simulácia pomalého mobilného pripojenia.
- Výška je `document.documentElement.scrollHeight`, všetky dodávané statické obrázky sú pred snímkou načítané. FAQ majú štandardný zatvorený stav. Otvorením odpovedí stránka prirodzene narastie; odpovede neboli odstránené.
- „Ukážka“ znamená začiatok prvej konkrétnej rodinnej scény. „Ponuka“ znamená začiatok ucelenej sekcie, nie miesto klikateľného tlačidla. Pre odlíšenie meriame aj začiatok samotnej cenovej karty a pozíciu hero CTA.
- Najskoršou výzvou je odkaz v navigácii; hero CTA je výrazná hlavná výzva. Na krátkych displejoch 320/360 px je v prvom pohľade dostupná spodná lišta s cenou. Hero s celým textom sa na taký displej nezmestí bez scrollovania.
- Súčet vertikálnych paddingov sekcií je merateľný ukazovateľ priestoru, nie dôkaz, že všetok pôvodný padding bol nadbytočný. Hlavné úspory vznikli zlúčením obsahu, odstránením opakovaných prezentácií a druhej vysokej scény.
- Mobilné skrátenie je väčšie než pracovný cieľ 25–35 %. Nepridávali sme prázdny priestor na dorovnanie cieľa. Hlavné vysvetľujúce texty majú na mobile 14–15 px, FAQ otázky 15 px, odpovede 14 px; drobné štítky a popisy obrázkov 9–12 px. CTA majú aspoň 44 px na výšku.
- Rodinná fotografia zachováva celú kompozíciu 4 : 5. Hero používa schválený mobilný obrázok a ponecháva viditeľné postavy. Pracovné listy sú zámerne malé výrezy bez spodného odmenového znaku, nie rozmazané celé strany. Bez odkazu na zväčšenie alebo PDF.

### Laboratórny výkon

| Rozmer | LCP ms pred → po | CLS pred → po | Lokálna TBT vzorka ms pred → po | FAQ: najdlhšia zachytená interakcia ms pred → po |
| --- | --- | --- | --- | --- |
| 320 × 568 | 324 → 368 | 0.000 → 0.000 | 0 → 44 | 16 → 16 |
| 360 × 640 | 364 → 388 | 0.000 → 0.000 | 0 → 47 | 24 → 16 |
| 390 × 844 | 352 → 320 | 0.000 → 0.000 | 55 → 28 | 16 → 16 |
| 430 × 932 | 284 → 280 | 0.000 → 0.000 | 15 → 20 | 24 → 16 |
| 768 × 1024 | 292 → 364 | 0.067 → 0.063 | 0 → 36 | 16 → 16 |
| 1366 × 768 | 360 → 356 | 0.087 → 0.079 | 0 → 32 | 16 → 24 |
| 1440 × 900 | 344 → 480 | 0.070 → 0.071 | 0 → 73 | 24 → 48 |

Vzorky `PerformanceObserver` sa odoberajú po načítaní stránky a fontov, pred vynúteným načítaním všetkých lazy obrázkov pre screenshot. „TBT vzorka“ je súčet nadlimitných častí pozorovaných dlhých úloh, nie oficiálny Lighthouse audit. Trvanie jedného otvorenia a zavretia FAQ nie je INP skutočných návštevníkov; neprítomný záznam znamená N/A, nie 0 ms. Výsledky sú jednotlivé lokálne lab vzorky citlivé na beh stroja, fonty a cache mimo kontextu. Z týchto čísel nemožno vyvodzovať zrýchlenie produkcie ani percentil používateľov.

Ciele LCP ≤ 2,5 s, INP ≤ 200 ms a CLS ≤ 0,1 sa posudzujú na 75. percentile skutočných návštev. Lab pomáha odhaľovať problémy; nenahrádza dáta z prevádzky. [Google: Web Vitals](https://web.dev/articles/vitals), [Google: Core Web Vitals report](https://support.google.com/webmasters/answer/9205520), [PageSpeed Insights: field a lab data](https://developers.google.com/speed/docs/insights/v5/about).

Hlavný obrázok má `fetchpriority="high"` a nemá lazy loading; rodinná scéna zachováva `srcset` 640/960/1200 a `sizes`. Postavy využívajú existujúce optimalizované WebP. Rozmery a pomery obrázkov sú určené v HTML/CSS. Nepribudla knižnica ani externá služba. Existujúce načítanie Google Fonts ostalo zachované; výsledky fontového swapu sa môžu líšiť podľa siete. Úprava spoločného fontového systému je ďalšia prípadná technická úloha, nie súčasť tejto zmeny.

### Overený skutočný obsah a obchodné pravidlá

| Položka | Overenie |
| --- | --- |
| Hlavná hra | 7 úloh; cena 14,99 €; pôvodný katalógový status zachovaný |
| Tlač | 7 pracovných listov A4 + rodičovský návod + diplom = 9 strán PDF |
| Videá | `GAME.video` → `assets/PicoVideo.mp4`, 1 541 061 B; `GAME.finaleVideo` → `assets/EndScene-Dabing.mp4`, 1 197 170 B |
| Hlasové správy | `assets/Miky.mp3` 789 325 B, `assets/Plugy.mp3` 549 834 B, `assets/Guardy.mp3` 542 311 B; produkčné konfigurácie odkazujú na tieto reálne súbory |
| Prísľub médií | Úvodné a záverečné video + tri hlasové správy; neuvádzame sedem nahraných hlasov |
| Knižka a encyklopédia | K hre 0 €, samostatná ponuková cena 4,90 €; nezmenené |
| Misie | Pripravované; jedna 2,90 €, dve 5,80 €, všetky tri 4,90 €; kompletný výber 19,89 €. Žiadna nie je predvolená. |
| Garancia | 14 dní od nákupu; žiadosť na roman.duris@gmail.com z e-mailu objednávky; vrátenie zaplatenej sumy aj po začatí hrania |
| Nákup | `paymentsEnabled=false`; neaktívne finálne tlačidlo; nevzniká objednávka, platba ani e-mail |
| Prístup | `access.mode='test'`; existujúci Site zostáva zdieľaný iba s vlastníkom; zmena funnelu ho neotvára zákazníkom |

Konfigurácia a prítomnosť súborov overujú dodávaný obsah. Tento audit nemenil nahrávky ani neoveroval ich zvuk na fyzickom telefóne.

## D. Screenshoty

[Otvoriť porovnanie s výberom rozmeru](compare.html). Dokument obsahuje všetkých sedem rozmerov; možno prepnúť medzi celou stránkou a prvou obrazovkou na 390/1440 px.

| Rozmer | Pred úpravou | Po úprave |
| --- | --- | --- |
| 320 × 568 | [Celá stránka](before/320x568-full.jpg) | [Celá stránka](after/320x568-full.jpg) |
| 360 × 640 | [Celá stránka](before/360x640-full.jpg) | [Celá stránka](after/360x640-full.jpg) |
| 390 × 844 | [Celá stránka](before/390x844-full.jpg) | [Celá stránka](after/390x844-full.jpg) |
| 430 × 932 | [Celá stránka](before/430x932-full.jpg) | [Celá stránka](after/430x932-full.jpg) |
| 768 × 1024 | [Celá stránka](before/768x1024-full.jpg) | [Celá stránka](after/768x1024-full.jpg) |
| 1366 × 768 | [Celá stránka](before/1366x768-full.jpg) | [Celá stránka](after/1366x768-full.jpg) |
| 1440 × 900 | [Celá stránka](before/1440x900-full.jpg) | [Celá stránka](after/1440x900-full.jpg) |

Prvé obrazovky: [mobil pred](before/390x844-hero.jpg), [mobil po](after/390x844-hero.jpg), [desktop pred](before/1440x900-hero.jpg), [desktop po](after/1440x900-hero.jpg).


Snímky celej stránky zachytávajú jednu kompozíciu s fixnými prvkami pri aktuálnej pozícii viewportu. Neznamenajú, že lišta prekrýva všetky časti naraz. Správanie pri scrollovaní, schovanie pri CTA, dotykové rozmery a priestor nad pätou sa overovali osobitne v prehliadači. Zvyšok obsahu možno odscrollovať nad lištu; nejde o trvalé zakrytie konca stránky. Safe area používa CSS `env(safe-area-inset-*)`; hardvérový výrez iPhonu nebol fyzicky meraný.

## E. Testy a limity

| Kontrola | Výsledok a význam |
| --- | --- |
| `tests/sales-checkout.test.cjs`, Chromium | PASS na finálnom statickom výstupe `dist/` na 320/360/390/430/768/1366/1440 px. Osem sekcií, všetkých 19 FAQ, osem hlavných, jedenásť ďalších; klávesnica aj dotyk; viditeľný skutočný záber, dialóg a návrat focusu. |
| CTA a kotvy | PASS. Nákupné odkazy vedú na `checkout.html`, označenie „Pozrieť ponuku“; platné interné kotvy. Navigácia nevedie do portálu ani herného testu. |
| Mobilná lišta | PASS. Zmestí sa do viewportu aj pri 320 px; hlavné ciele ≥ 44 px. Pri viditeľnom hlavnom CTA je skrytá, pri ukážke sa zobrazí. Päta má rezervu, focus na lište ju neskryje počas používania. |
| Ponuka a checkout | PASS. Všetkých osem kombinácií misií, individuálny aj balíkový výber, správna zľava pri všetkých troch, knižka v cene, žiadne predvolené doplnky. Stav neaktívnych platieb viditeľný pred formulárom. |
| Neaktívny nákup a údaje | PASS. Submit, Enter ani neaktívne tlačidlo neodosielajú objednávku/e-mail/platbu. Kontaktné údaje sa neukladajú. Postup hry zostáva rovnaký. |
| Obrázky a responzivita | PASS bez JS chýb, chýbajúcich lokálnych zdrojov, neplatných kotiev a horizontálneho pretekania pri siedmich rozmeroch. PASS aj na hraniciach breakpointov 370/371, 700/701 a 1050/1051 px. Rodičovská fotografia celá; náhľady ostré, malé, bez odkazu na zväčšenie; verejný grid s riešením odstránený. |
| `scripts/verify-cro-scope.cjs` | PASS. 176 SHA-256 porovnaní s baseline: všetky assety vrátane PDF a médií, herné zdroje, rodičovský portál, administrácia a logika checkoutu. Rovnaké obchodné pravidlá aj zdroj všetkých 19 FAQ. |
| `tests/progress-migration.test.cjs` | PASS. Staré postupy sa migrujú bez straty, nové sa neposunú druhýkrát, finále zostáva dostupné. |
| `tests/stage1.test.cjs` | PASS po úprave dvoch očakávaní funnelu: informácia o dĺžke je vo FAQ a mobilná lišta sa kontroluje mimo viditeľného hero CTA. Herné/prístupové kontroly nemeníme. |
| `tests/static-assets.test.cjs` | PASS po `node scripts/prepare-static.mjs`: 62 publikovaných URL skriptov/štýlov má správny hash aktuálneho obsahu. |
| `tests/presentation.test.cjs` | FAIL už pred zmenou: rodičovský portál má 7 riadkov prípravy, starý test očakáva 6. Po aktualizácii selektorov novej ukážky zlyháva na rovnakej existujúcej nezhode. Kontrolný beh s očakávaním 7 navyše našiel staré očakávanie 3 skrytých TTS blokov oproti skutočným 4. Tieto nesúvisiace očakávania sme vo finálnej verzii nemenili; celý test neoznačujeme za úspešný. |
| WebKit / iPhone emulácia | FAIL pre haváriu procesu pri `page.goto`, pred prvou obsahovou aserciou. Rovnaký pokus so znovu načítanými zdrojmi baseline havaruje tiež; jednoduchá prázdna HTML kontrola prejde. Príčinu havárie nevyvodzujeme, Safari zostáva neoverené. |
| Fyzický telefón a používateľské testovanie | Nevykonané; emulácia nedokazuje správanie všetkých zariadení ani spokojnosť rodičov. |
| `git diff --check`, JS syntaktické kontroly, statický build | PASS. Zdroj pravdy ostáva v koreňových súboroch a `assets/`, nie v `dist/`. |

Testy funnelu boli aktualizované na nové selektory a správanie. Neboli uvoľnené cenové, súkromné ani herné hranice. Pôvodné zlyhanie prezentačného testu zostáva viditeľné. Všetky výsledky sú lokálne pred publikovaním; nasadenie samo o sebe nie je potvrdenie fyzického Safari testu.

### Návrh merania — zatiaľ bez implementácie

| Udalosť | Spúšťač | Minimálne údaje |
| --- | --- | --- |
| `landing_view` | Jedno načítanie funnelu | Variant stránky, kategória zariadenia |
| `hero_offer_click` | Klik na hero CTA | Umiestnenie CTA, variant |
| `game_preview_open` | Otvorenie skutočného záberu | Typ ukážky, variant |
| `offer_view` | Ponuka viditeľná aspoň z 50 % po dobu 1 s, raz za návštevu | Variant, zariadenie |
| `checkout_view` | Otvorenie checkoutu | Variant, bez osobných údajov |
| `missions_selection` | Zmena dobrovoľného výberu | Počet doplnkov, súčet v centoch |
| `purchase_completed` | Až potvrdená reálna platba | Suma/mena, deduplikačný identifikátor; potvrdenie zo servera |

Pred napojením treba vybrať nástroj, spôsob súhlasu podľa skutočného nasadenia, dobu uchovania a minimálny dátový rozsah. Do eventov neposielať meno, e-mail, text formulára ani postup dieťaťa. Teraz sa nepridal analytický skript, cookie ani služba a úspešný nákup sa nesimuluje.

Po spustení predaja testovať po jednej významnej zmene: konkrétny titulok vs. emocionálny, kratšia vs. pôvodná stránka, skorá vs. neskorá ponuka, skutočný záber vs. všeobecná fotografia. Primárny výsledok je potvrdený nákup na relevantného návštevníka; doplnkové ukazovatele sú otvorenie ponuky/checkoutu a pochopenie produktu. Náhodné rozdelenie, vopred určený minimálny relevantný rozdiel a potrebná vzorka; bez dát nevymýšľať univerzálny počet návštev. Pri nízkej návštevnosti urobiť moderované testy s rodičmi: čo kupujú, čo tlačia, načo je telefón, čo získajú za cenu a či chápu neaktívny stav nákupu. Časovanie a počet testovaných určiť podľa možností, nie tvrdením o štatistickej istote z malej vzorky.

## F. Otvorené rozhodnutia mimo tejto úpravy

1. **Reálne platenie a doručenie:** výber poskytovateľa, serverové potvrdenie, prijatie objednávky, doručenie a zákaznícky prístup. Terajšie tlačidlo zostáva neaktívne.
2. **Otvorenie Site zákazníkom:** teraz je owner-private. Sprístupnenie inému publiku a vyriešenie produkčného prístupu je samostatná zmena; vzhľad funnelu ho nemení.
3. **Dokončenie bonusových misií:** status „pripravujeme“ ostáva pravdivý. Ich tvorba a aktivácia nie sú hotové týmto funnelom.
4. **Zmena cien alebo obchodných pravidiel:** nič sa nemenilo. Testovanie ceny, iná garancia, pravidlá doplnkov alebo predplatné by boli novým obchodným rozhodnutím.
5. **Meranie a experimenty:** výber analytiky, nasadenie a ochrana údajov vyžadujú samostatné zadanie; navrhnuté eventy sa zatiaľ neposielajú.
6. **Recenzie:** zbierať až reálne skúsenosti a zverejňovať ich so súhlasom; teraz žiadne nevytvárame.
7. **Overenie pred reálnym predajom:** fyzický iPhone/Android, rodičovské používateľské testy, oprava starých očakávaní širšieho prezentačného testu a meranie na skutočnej mobilnej sieti. WebKit haváriu nemožno označiť za úspešný test.

### Reprodukcia

```bash
# Bežiaci statický server v koreňovom adresári, napr. port 8080.
PLAYWRIGHT_MODULE=/cesta/k/playwright node scripts/audit-sales.cjs after
PLAYWRIGHT_MODULE=/cesta/k/playwright BROWSER=chromium node tests/sales-checkout.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/stage1.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/progress-migration.test.cjs
node scripts/verify-cro-scope.cjs
node scripts/prepare-static.mjs
node tests/static-assets.test.cjs
```

Pre pôvodnú architektúru treba použiť uvedený baseline commit. Pôvodné merania a snímky v tomto adresári vznikli pred úpravou. Pozície navigačného CTA a cenovej karty boli doplnené samostatným replayom pôvodného `sales-page.js`, `sales.css` a `site-config.js`; pôvodné screenshoty ani lab vzorky sa neprepisovali.
