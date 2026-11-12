# Pixelkovia – kompaktný Predajný funnel: Facebook / Instagram

**Stav:** Implementované v existujúcej administrácii (12. 11. 2026); živé nenulové porovnanie a reklamný pilot zostávajú na overenie.
**Priorita:** P1 – pred víkendovým testom reklám, ak je možné bezpečne stihnúť.  
**Rozsah:** Existujúca administrácia `/admin`, záložka **Predajný funnel**. Žiadna nová administračná stránka.

## 1. Cieľ

Na jednom mieste intuitívne zobraziť cestu **zobrazenie reklamy → zobrazenie predajnej stránky → otvorenie checkoutu → nákup**, pričom každý krok má rozdelenie podľa pôvodu **Facebook Ads (FB)** a **Instagram Ads (IG)**. Na telefóne musí byť prehľad **veľmi kompaktný, približne do polovice výšky bežného mobilného viewportu, ak to veľkosť a prístupnosť dovolia**, a nie séria veľkých kariet alebo dlhý vertikálny lievik.

Pod funnelom zachovať existujúce výsledné KPI **Konverzia** a **Zisk**. **Karta Zisk aj jej existujúci výpočet a odpočítanie reklamných nákladov („− reklama“) zostávajú bez akejkoľvek zmeny.**

## 2. Najprv audit existujúceho stavu

Pred implementáciou:
1. Preskúmaj existujúcu implementáciu záložky Predajný funnel, KPI kariet, filtrov a napojenia Meta Ads.
2. Existujúce **automatické načítanie nákladov z Meta Ads** zachovaj; nepridávaj duplicitnú integráciu.
3. Over, či rovnaké autorizované pripojenie poskytuje Meta Insights **`impressions`** a rozdelenie **`publisher_platform`**; skontroluj aj platné definície metriky kliknutí, ak ich budeš potrebovať.
4. Preskúmaj, či už zbierame dostatočné atribučné signály (UTM, Meta platform placement, návšteva/session, identifikátor nákupného pokusu, overený nákup). Nedostupné polia nesimuluj.
5. Zachovaj existujúce dátové modely a endpointy, doplň len nutné minimálne rozšírenia.

## 3. Horná sekcia – poradie a obsah

Štyri kľúčové kroky v **presnom poradí**:

1. **Zobrazenia reklamy** – nová prvá metrika, celkový počet `impressions` s rozdelením FB/IG.
2. **Zobrazenia stránky** – existujúca metrika, doplnené rozdelenie podľa návštev pripísateľných FB Ads / IG Ads.
3. **Otvorenia checkoutu** – existujúca metrika, doplnené rozdelenie podľa pôvodného reklamného zdroja.
4. **Nákupy** – existujúca metrika, doplnené rozdelenie podľa pôvodného reklamného zdroja, **iba serverom overené zaplatené transakcie**.

Následne zobraziť **Konverzia** a **Zisk** ako samostatné výsledné ukazovatele, pričom ich existujúca logika a zobrazovanie majú byť zachované. Ostatné existujúce KPI, ak existujú, nesmú zmiznúť; rozumne ich zachovaj v existujúcej sekcii.

Pri každom zo štyroch krokov:
- zreteľný názov a veľké **celkové číslo**, nie iba súčet dvoch farieb;
- horizontálny, kompaktný **stacked bar**: **modrá = FB**, **ružová = IG**;
- malé čitateľné štítky **FB 50 · IG 50** (čísla len ako ilustračný príklad);
- existujúca celková hodnota zahŕňa **všetky relevantné zdroje**, nie len platený FB/IG; ak sú aj ostatné/neznáme zdroje, použij **neutrálnu sivú časť**, štítok „Ostatné / neznáme“ a správne súčty;
- spoločná zrozumiteľná legenda a prístupnosť aj bez rozpoznávania farieb.

**Dôležitá metodika:** Zobrazenia reklamy nie sú návštevníci. Pomery medzi Meta impressions a web visits nie sú bežné konverzie jednej identickej kohorty. Nezobrazuj zavádzajúce „straty“ ako keby každý impression bol unikátny používateľ. Uvádzaj jasné definície, napríklad „zobrazenia reklamy“, „návštevy webu“, „otvorenia checkoutu“, „zaplatené transakcie“.

## 4. Mobilný dizajn – zásadná požiadavka

**Mobile-first, ale primárne kompaktnosť a čitateľnosť.**

- Na šírkach **320, 360, 390 a 430 px** vytvor jeden kompaktný blok, nie štyri vysoké samostatné karty. Každý krok môže byť jeden nízky riadok s názvom, hlavným číslom, dvoj/trojfarebnou segmentovanou lištou a drobným rozpisom.
- Štyri kroky musia pôsobiť ako súvislý postupný funnel a vizuálne naznačovať zmenšovanie objemu; šírky segmentov znázorňujú **podiel zdrojov v rámci daného kroku**, nie rozdielne absolútne mierky bez vysvetlenia.
- Cieľ je zmestiť hlavnú funnel sekciu a výsledné KPI na približne **polovicu výšky bežnej mobilnej obrazovky**, ak to reálne dovolí veľkosť textu; **nikdy však nie na úkor čitateľnosti, zoomu či accessibility**. Pri malom displeji prirodzený vertikálny scroll namiesto useknutého obsahu.
- Žiadny horizontálny scroll celého dashboardu; žiadne dekoratívne veľké medzery.
- **Konverzia** a **Zisk** pod štyrmi krokmi vedľa seba, ak to šírka dovolí, inak pod sebou.
- Karta **Zisk** naďalej zobrazuje pôvodný hlavný údaj a **„− reklama“** rovnakým spôsobom. Nepridávaj nový vzorec ani neprepočítavaj jej hodnotu.
- Na desktope použi kompaktné horizontálne KPI/karty alebo prehľadnú mriežku; zachovaj poradie a farebnú logiku.

## 5. Atribúcia FB / IG bez domýšľania

**Reklamné zobrazenia** čítaj z Meta Insights s rozdelením `publisher_platform`. Oddelene Facebook a Instagram, iné umiestnenia vykazuj ako „Ostatné“.

**Webové kroky** priraďuj ku konkrétnej platforme iba pri dôveryhodnej informácii:
- pre kampane používaj **UTM parametre** s odlíšením FB/IG na úrovni skutočného umiestnenia reklamy; napr. Meta dynamické parametre pre `site_source_name` alebo iné podporované placement údaje – pred použitím over správny formát v aktuálnom nastavení Ads Managera;
- zachovaj pôvod návštevy naprieč webom a checkoutom spôsobom, ktorý rešpektuje platné súhlasy a právne požiadavky;
- pri platbe prepoj dostupnú atribúciu so **serverom overenou** Stripe transakciou, nikdy s klientským redirectom ako dôkazom úhrady;
- neznámy referrer, direct, organic a iné zdroje **nepresúvaj automaticky do FB alebo IG**;
- ak sa nedá spoľahlivo rozlíšiť FB/IG, zobraz „Neznáme“ a vysvetlenie.

**Pozor:** Údaje Meta Ads a vlastné webové údaje majú rozdielnu metodiku aj pokrytie (blokovanie analytiky, súhlasy, rozdielne atribučné okná, opakované zobrazenia, deduplikácia). Nesnaž sa násilne dorovnať ich počty.

## 6. Výpočty, filtre, chybové stavy

- Rešpektuj existujúce filtre období a kampaní; pri každom čísle musí byť jasné, za aké obdobie a aké kampane platí.
- Jedna zaplatená transakcia s darčekovou druhou hrou = **jeden nákup**, aj keď vytvorí viac prístupov. Refundácie a objednávky zdarma nezmiešavaj s platenými nákupmi.
- **Chýbajúce údaje = „Nedostupné“, nie 0.** Skutočnú nulu ukáž iba pri úspešne načítaných dátach.
- Neúplné alebo oneskorené údaje označ a zobraz čas poslednej aktualizácie, prípadne dátum začiatku zbierania.
- Ak určitá platforma nemá spoľahlivú atribúciu po checkout, indikuj to; graf nesmie predstierať presnosť.
- Zachovaj existujúcu logiku Konverzie, Zisku, nákladov, CAC a ostatných KPI; požiadavka je **doplniť rozpad a zlepšiť UI**, nie prepisovať finančnú analytiku.

## 7. Bezpečnosť a rozsah

- Neupravuj verejný predajný web, dizajn checkoutu, Stripe platobnú logiku, ceny, hru, e-mailové prístupy ani záložky „Platby a chyby“ a „Herná analýza“.
- Žiadne nové paralelné Meta integrácie, duplicity alebo nepotrebné systémy.
- Nezbieraj údaje kariet, heslá ani zbytočné osobné údaje. Rešpektuj GDPR/ePrivacy a súhlasy.
- Ak presná atribúcia návšteva → nákup vyžaduje zmenu mimo tejto úzkej UI úlohy, **najprv zdokumentuj chýbajúci signál, navrhni minimálnu potrebnú úpravu a nezasahuj bez schválenia do checkoutu či architektúry**.

## 8. Testy a akceptačné kritériá

- [x] Nová metrika „Zobrazenia reklamy“ je úplne prvá a má celok + FB/IG.
- [x] „Zobrazenia stránky“, „Otvorenia checkoutu“ a „Nákupy“ majú celok + farebný FB/IG rozpad, prípadne neutrálne ostatné/neznáme.
- [x] Súčet segmentov súhlasí s celkovým počtom, kde je údaj dostupný; nevzniká dvojité počítanie.
- [ ] Čísla Meta `impressions` za rovnaké obdobie/kampaň zodpovedajú Ads Manageru v rámci rovnakého nastavenia časového pásma a metodiky.
- [x] Graf funguje na 320/360/390/430 px, na desktope, pri väčšom písme aj pri tmavom/svetlom motíve, ak ho administrácia podporuje.
- [x] Mobilný funnel je krátky, zrozumiteľný a nemá horizontálny scroll.
- [x] Konverzia a najmä **Zisk s existujúcim „− reklama“** ostávajú vizuálne aj výpočtovo zachované.
- [x] Zmeny filtrov nespôsobia nesprávne miešanie kampaní alebo zdrojov.
- [x] Chýbajúce dáta a neaktuálny import sa zobrazujú pravdivo.
- [x] Automatizované testy a manuálne vizuálne overenie nepoškodia existujúcu admin sekciu.

## 9. Odovzdanie

Codex nech uvedie:
1. Čo konkrétne zmenil a kde.
2. Ktoré metriky sú skutočne dostupné z Meta a ktoré z webu.
3. Či je FB/IG atribúcia na úrovni checkoutu a nákupu reálne overená alebo len čiastočná.
4. Výsledky testov a screenshoty mobilnej/desktopovej verzie.
5. Čo ešte chýba pred víkendovým pilotom reklám.

**Nevypĺňaj reálny dashboard ukážkovými dátami. Nemeň finančné vzorce. Nedávaj do produkcie neoverené tvrdenia o atribúcii.**


## Realizácia a overenie · 12. 11. 2026

- Pred implementáciou bol vykonaný [audit merania, atribúcie a finančného základu](../docs/marketing-funnel-audit-2026-11-12.md). Živé Meta GET požiadavky so súčasným tokenom vrátili HTTP 200 vrátane `impressions` / `publisher_platform`; výsledkom boli nulové zobrazenia bez riadkov platforiem za 30. 10.–12. 11.
- Existujúci import, administrátorské endpointy a D1 zostali zachované. Aditívne uloženie impressions má vlastné pokrytie; staré výdavky sa neprehlasujú za namerané zobrazenia. Rovnaká transakcia chráni výdavky aj nový import pred čiastočným uložením.
- Nové `funnel` v existujúcom reporte rozdeľuje kalendárne návštevy, otvorenia checkoutu a zaplatené transakcie. Unikátne prehliadače sú v každom kroku priradené iba jednému zdroju spomedzi aktuálnych filtrov. Darček zostáva jednou transakciou, zdarma mimo platených nákupov, refundácia samostatným existujúcim ukazovateľom.
- **Spresnenie finančného názvu:** aktuálna karta je **Tržby**, nie Zisk; vykazuje hrubé inkaso a vedľa neho **Reklama − …**. Názov, hodnoty a výpočet zostali zachované. Žiadny čistý zisk sa nepridával ani neodhadoval. Konverzia a CAC používajú pôvodné vzorce.
- Chrome a Safari: 320–1920 px, samostatne 320/360/390/430 px, zmena období, zdrojov, kampaní, produktu, unikátneho režimu, chyby, nedostupnosť a 200 % písmo. Pri zväčšenom písme sa finančné ukazovatele prirodzene presunú pod seba. Administrácia má existujúci tmavý motív; svetlý motív nepodporuje.
- Prešlo 137 backendových testov vrátane reálneho workerd/D1 runtime, migrácie existujúcich dát, platieb, bezpečnosti a zachovania finančných metrík. Mobilné a desktopové [QA snímky](../docs/qa/funnel-fb-ig/README.md) sú označené ako testovacie údaje a nevstupujú do produkčného dashboardu.

**Pred pilotom:** v Ads Manageri porovnať skutočné nenulové impressions za rovnaké obdobie a platformu, potvrdiť UTM na reálnych umiestneniach reklám a overiť aspoň jeden platený FB/IG nákup na cieľových telefónoch. Bez súhlasu alebo bez identifikovaného reklamného zdroja zostáva nákup v Ostatné / neznáme. Zmeny reklám, platený test a nevyžiadané zmeny checkoutu neboli vykonané.
