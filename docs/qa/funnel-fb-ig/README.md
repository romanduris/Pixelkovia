# FB/IG funnel · vizuálne overenie po UI úprave 12. 11. 2026

Snímky z automatizovaných testov existujúcej administrácie. **Obsahujú označené testovacie údaje, nie skutočné výsledky predaja alebo reklám.** Do produkčného dashboardu sa ukážkové dáta ani tieto snímky nevkladajú.

| Zobrazenie | Snímka |
| --- | --- |
| Chrome, viewport 1440 px | [Desktop](desktop-1440.png) |
| Chrome, viewport 320 px | [Mobil 320](mobile-320.png) |
| Chrome, mobilný filter 320 px | [Obdobia a kalendár](toolbar-320.png) |
| Chrome, viewport 360 px | [Mobil 360](mobile-360.png) |
| Safari, viewport 390 px | [Mobil 390](mobile-390-safari.png) |
| Chrome, viewport 430 px | [Mobil 430](mobile-430.png) |
| Safari, viewport 320 px, 200 % písmo | [Zväčšené písmo](text-200-safari.png) |

Overenie: automatizovaný Chromium a WebKit (Safari cez Xvfb) pri šírkach 320–1920 px, súčty zdrojov, filtre a zmena unikátneho režimu, nepriradené nákupy, neúplné a chýbajúce Meta dáta, chyba importu a zachované finančné ukazovatele. Horná sekcia používa riadky názov → pruh → počet, legendu pod grafmi a tri výsledkové karty. Zisk sa počíta raz z pôvodných centov; overený bol kladný, záporný, nulový aj nedostupný stav a skutočne nulové výdavky. Sumy v horných kartách majú jedno desatinné miesto; spodný obchodný detail zostáva zachovaný. Bez vodorovného posunu stránky. Pri 200 % písme sa výsledné finančné karty presunú pod seba; obsah môže prirodzene pokračovať zvislo.

Reklamné zobrazenia majú vlastnú mierku; webové kroky spoločný referenčný objem. Príklad môže mať viac otvorení checkoutu než návštev, pretože ide o rôzne počítadlá a kohorty. Dĺžky sa umelo neupravujú na klesajúci tvar. Minimum pruhu je vysvetlené v rozbalenom detaile metriky, pri nule sa farebný pruh nekreslí a nedostupnosť je šrafovaná. Vnútri segmentov sú iba čísla; zdroj vysvetľuje spoločná legenda a prístupný popis. Malé segmenty zobrazia presné počty po otvorení riadku. Horná vysvetľujúca veta bola na žiadosť vlastníka odstránená; definície zostávajú v detaile. Mobilné obdobia majú päť rovnako širokých tlačidiel s oddelenými dotykovými plochami a samostatným kalendárom.

Celý scenár: `tests/marketing-dashboard.test.cjs`; backend: 137 úspešných testov. Kontrola zahŕňa aj kalendár, rýchle obdobia, zdroj, kampaň, zariadenie, produkt, prepnutie unikátneho režimu a zachovanie návštevnej konverzie nad 100 %. Snímky sú z prehliadačových emulácií, nie z fyzických telefónov.

## Mobil 320 px

![Mobilný funnel s testovacími údajmi](mobile-320.png)

## Desktop

![Desktopový funnel s testovacími údajmi](desktop-1440.png)

Kontrola po spresnení vlastníkom: celý prehliadačový scenár znova prešiel v Chromium aj WebKit. Všetkých päť období funguje aj dotykom na 320 px; na mobilných šírkach boli overené neprekrývajúce sa tlačidlá s minimálne 40 × 40 px a jednoznačne vyznačeným výberom.
