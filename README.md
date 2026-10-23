# Pixelkovia V5 / Etapa 1 – funnel, rodičovský portál a storyboard

Slovenská rodinná hra v domácnosti a samostatná ilustrovaná miniknižka. Statické HTML/CSS/JS, bez frameworku a aplikačných účtov. Literárnym zdrojom je úplný autorský dokument GAME STUDIO V2 dodaný používateľom.

## V5 / Etapa 2 – administrácia a Cloudflare

Nový [TreasureQuest Admin](admin/README.md) má dashboard, zákazníkov/detail, objednávky, hernú analytiku, e-mailové koncepty, Worker API a samostatné D1 migrácie. [Ukážka](admin/docs/dashboard-preview.png) obsahuje iba fiktívne lokálne dáta. [Inventúra a schvaľovací plán](admin/docs/DEPLOYMENT.md) zaznamenávajú oddelenie od existujúcich Cloudflare projektov.

[Produkčný TreasureQuest Admin](https://treasurequest-admin.livingstones-romanduris.workers.dev) je na samostatnom Workeri a D1. Prihlásenie vyžaduje iba heslo; ochrana HTML, assetov a API sa overuje na serveri. Používateľ schválil nové zdroje aj presné D1 UUID pred migráciami. Na neskoršiu výslovnú žiadosť používateľa produkcia obsahuje 15 označených FAKE zákazníkov (5 zakúpených, 5 rozhraných, 5 dokončených); admin upozorňuje, že metriky zahŕňajú simulované údaje. Oddelený preview zostáva prázdny. Pôvodné dva Cloudflare projekty sa nemenili.

`admin/` sa **nekopíruje do `dist/`**. Existujúca hra, lokálny postup a `.openai/hosting.json` zostávajú zachované. Interný storyboard umožňuje návrat na chránenú administráciu. Verejný funnel a rodičovský portál na admin neodkazujú.

## Spustenie a build

Otvorte `index.html` (predajná stránka), `parent.html` (rodičovský testovací náhľad), `storyboard.html` (interný vývojový náhľad) alebo `atlas.html` priamo v prehliadači. Hra a atlas fungujú aj bez siete; lokálne HTML nemusia medzi jednotlivými súbormi zdieľať úložisko. Pre HTTP náhľad spustite `python3 -m http.server 8080` v koreňovom priečinku.

Nasadzovaný výstup pripraví `node scripts/prepare-static.mjs`. Kopíruje hlavnú stránku, atlas, tlačoviny, CSS, JavaScript aj `assets/` do ignorovaného `dist/`. Upravujte koreňové zdroje, nie `dist/`.

## Oddelené prostredia V5 / Etapa 1

- **`index.html` – predajný funnel.** Hero s hodnotou produktu, cenou a CTA nad prvým mobilným posunom; pôvodné zábery aktivít, tri kroky, rodinné benefity, Pixelkovia, obsah balíka, cena, FAQ a záverečné CTA. Žiadna navigácia na prípravu, materiály, Atlas, storyboard, administráciu ani testovaciu hru. Ani rozpracovaný postup nezobrazí verejné tlačidlo na hranie. Všetky nákupné CTA používajú jedinú integračnú akciu `purchase` a otvárajú oznámenie **Predaj pripravujeme**, bez platby, objednávky či odomknutia hry. Cena základnej hry je 14,99 €; nie je zobrazená zľava ani predchádzajúca cena.
- **`parent.html` – rodičovský testovací portál.** Uvítanie, stiahnutie všetkých aj jednotlivých materiálov, povinný checklist, presné rozmiestnenie stôp, pomoc rodičovi, upozornenie na telefón a testovací štart. Neodkazuje na funnel, storyboard ani administráciu. Pripravované rozšírenia: rozprávková knižka 4,99 €, Piko/Lístok/Kvak po 2,99 €, pracovný kompletný balík 19,99 €. Ich obsah ani nákup sa nepredstierajú a tlačidlá sú deaktivované. Existujúci Atlas zostáva bonusom po finále.
- **`storyboard.html` – interný vývojový náhľad.** Hlavička Pixelkovia / Záhada u vás doma obsahuje Digital Product Administration a Funnel; pod úvodom sú Customer page, Atlas Pixelkov a Tlačové materiály. Deväť etáp je predvolene zbalených a používa spoločnú šablónu podľa úlohy Kúpeľňa: tlačový list s rovnakým textom zadania, kompaktné ovládanie obsahu a jeden svetlý blok inštrukcií pre Game mastra s nápovedou aj riešením. Pod ním zostáva iba kontrola tlačeného dokumentu. Pikovo video otvára tlačidlo s ikonou videa v existujúcom prehrávacom dialógu; prepis aj TTS sú predvolene skryté rovnako ako pri Kvakovi. Šutko má rovnako ako Kvak zbalené Text správy a Zadanie do TTS; prehráva sa dodaná Šutkova nahrávka `assets/Sutko.mp3`. Ostatné etapy majú zbalený Text príbehu. Vývojárske podklady sú odstránené. Tlačidlo Test je priamo v hlavičke hráčskych etáp vrátane úvodu, Kúpeľne a finále; funguje aj bez rozbalenia. Čisto papierová Iskrina úloha ho nemá.
- **`game.html` – adresa existujúceho herného rozhrania.** Štart z pripraveného portálu zachová používateľské gesto pre video/zvuk/fullscreen. Návrat do prehľadu vedie do rodičovského portálu. Nové načítanie tejto adresy otvorí prípravu; hra ani video sa nespúšťajú automaticky. Tlačidlo Pokračovať obnoví existujúci postup v rovnakom prehliadači. Herný kľúč `zahada-v1-progress`, ID etáp, odpovede, médiá a nápovedy zostávajú kompatibilné.

### Checklist a rozhrania pre ďalšiu etapu

`prep-store.js` definuje trinásť povinných krokov podľa aktuálnej logistiky štyroch obálok a samostatných P3/P5. Progress zobrazuje počet splnených krokov. Štart aj reštart sa odblokujú až po všetkých krokoch **a** samostatnom potvrdení o telefóne. Kontrola je aj v obsluhe akcie, nielen v atribúte `disabled`. Odškrtnutie kroku štart znovu blokuje.

Kľúče `zahada-prep-v5-*` zachovávajú hotový herný postup a nezmenené prípravné kroky. Po výmene Iskrinej a Lístkovej mechaniky treba znovu potvrdiť tlač a dotknuté obálky s revíziou `party-chair-v1`; znovu sa potvrdí aj rozstrihanie P4 s priložením hornej časti a označenie poslednej obálky pod inou stoličkou. Staré potvrdenie rozstrihania P2 sa nepovažuje za prípravu P4. Pôvodný všeobecný krok rozmiestnenia automaticky nepotvrdzuje všetky nové jednotlivé úkryty. Staré kľúče ani herný postup sa nemažú. Pri nedostupnom localStorage funguje príprava v pamäti do opustenia stránky. API `read`, `write`, `snapshot`, `ready`, `scope` a `useAdapter` umožňuje neskôr pridať synchronizačný adaptér; teraz ide výlučne o lokálne dáta, bez synchronizácie medzi zariadeniami.

`site-config.js` je spoločný katalóg cien, návrhov produktov a nákupného CTA. Má aj nezobrazovanú zamýšľanú budúcu cenu 29,99 €, nulovú referenčnú cenu/kampaň a rozhranie stavov `not-purchased`, `purchased`, `available`, `coming-soon`. Aktuálne doplnky sú vždy `coming-soon`; nič sa nepredáva ani neoznačuje za zakúpené. Budúci server musí dodať overené oprávnenia; aktuálny klient ich nevyrába.

`SITE_CONFIG.access.mode` je `test`. Pri zmene na `production` sa portál, storyboard a herný vstup zastavia pred vykreslením obsahu a vyžadujú budúce serverové overenie. **Nie je to zabezpečenie statických súborov:** všetky publikované HTML, JS a PDF možno otvoriť priamou známou cestou v rámci prístupu k celej Site. Skryté odkazy, `noindex` ani klientsky režim nie sú autentifikácia. Pred skutočným predajom treba zaviesť serverové overenie a doručovanie súkromných dát/materiálov. Publikovanie zachováva pôvodné publikum Site a nemení ho na verejné.

Etapa 1 neimplementuje dashboard, Cloudflare D1, platby, zákaznícke účty, Magic Link, cookies, priradenie telefónu ani e-mailové automatizácie. QR na P1 otvára existujúci Site na `game.html?signal=kvak` a priamo zobrazí Kvakov signál. Vzorová kúpeľňová úloha v storyboarde nemá tlačidlo na simulovanie QR.

Pôvodné zadania pre **ElevenLabs v3** sú uložené v `GAME.voiceScripts` a zobrazené doslova v StoryBoarde, oddelene od hovoreného textu. Obsahujú emočné pokyny v hranatých zátvorkách aj charakter hlasov. Piko má krátku správu s piatimi replikami (cca 7 sekúnd), Kvak desať replík (cca 45–60 sekúnd). Prepisy `GAME.pikoMessage`, `GAME.kvakMessage` a Kvakova scéna vychádzajú z týchto podkladov. Pôvodné TTS zadania zostávajú zachované; aktuálne video bolo na žiadosť používateľa nahradené novým WhatsApp súborom. MPEG audio zostáva nezmenené.

Toto je funkčný statický prototyp týchto troch rozhraní. Platba a serverové overenie nároku po kúpe ešte nie sú pripojené; zákaznícka sekcia ani StoryBoard nemajú samostatnú ochranu prístupu. Existujúce publikum Sites sa nemení. Pred ostrým predajom treba pripojiť nákup a serverom overovaný prístup, nie iba skryť tlačidlá.

Prezentačný obsah je v `site-content.js`, samostatné štýly v `presentation.css`. Herný tok a uloženie postupu zostávajú v `app.js`. Ilustračné fotografie nevydávame za skutočné rodinné testovanie ani presné finálne materiály. Ich pôvod a úplné prompty sú v `assets/IMAGE-SOURCES.md`.

Stiahnuteľné PDF v `assets/printables/` a náhľady listov možno obnoviť z koreňového HTML/CSS/JS. Spoločný zdroj `print-materials.js` dodáva text aj do storyboardu; pokyny a nápovedy ku každej etape sa zhodujú s úvodným návodom pre Game mastra:

```sh
python3 -m pip install --target /tmp/pixelkovia-pdf pypdf
PYTHONPATH=/tmp/pixelkovia-pdf PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node scripts/export-printables.cjs
```

Každý export overuje presne jednu A4 a následne zloží spoločné `assets/printables/vsetky-materialy.pdf` z tých istých ôsmich individuálnych PDF (prvá strana s inštrukciami pre Game mastra ku všetkým úlohám, P1–P6 a diplom) cez `scripts/bundle-printables.py`. Balík tak nemá samostatný zdroj obsahu. Samotné opätovné zloženie: `PYTHONPATH=/tmp/pixelkovia-pdf python3 scripts/bundle-printables.py`. Autorovacie závislosti sú mimo projektu; nasadená hra ich nepotrebuje. Voliteľný argument `p1` exportuje iba prvý list a jeho náhľad, bez prepisovania ostatných PDF. `assets/piko-video-poster.png` je náhľadový záber z existujúceho videa; aktuálne `PicoVideo.mp4` je nové používateľom dodané WhatsApp video (približne 15 sekúnd), uložené pod pôvodnou hernou cestou.

## Príbeh a hranie

Pixelkovia potajomky žijú v každej domácnosti s mobilom, tabletom, počítačom či televízorom. Piko po veľkom bliknutí stratí spojenie s kamarátmi. Úvod nevysvetľuje príčinu. Postavičky hovoria v prvej osobe a cez domčeky z farebných bodiek, svietiace cestičky a malé mosty opisujú svoj svet. Deti ich postupne nájdu: Kvak počúva, Iskra svieti, Šutko drží most, Lístok prečíta značky, Kubo opraví cestu a Ryško stráži tajomstvo. Každý potrebuje pomoc ostatných. Lístok odhalí, že zatvorená svetelná brána ich chráni; Ryško neskôr vysvetlí, že sa zatvorila pri rannom bliknutí. Spoločne sa pripravia na návrat domov.

SPOLU je sľub celej partie. SVETLO je spoločný potvrdzovací signál šiestich pripravených schopností, nie násilné otvorenie ochrany. Piko drží spojenie s ľuďmi a vracia sa ako posledný. Vo finále je všetkých sedem doma a Ochranné pole sa vráti do bežného režimu.

Najprv v Príprave hry rozmiestnite štyri obálky a samostatne uzavreté listy P3 a P5. Potom hráči otvoria Pikovo video, nájdu prvú obálku a naskenujú QR kód z P1, aby otvorili prvú zo siedmich úloh. Etapy sú označené číslom a miestom stopy, napríklad „Úloha 1 – Kúpeľňa“; úvod sa označuje „Úvod – Telefón“. V tejto fáze sa zadania, príprava, literárne scény a riešenia kontrolujú v StoryBoarde. Video v úvode otvára samostatné tlačidlo. Test v hlavičke otvára úvodnú správu, zadanie kúpeľňového kódu, priamu interakciu úloh 3–7 alebo finále. Testovanie používa dočasný postup a nemení uloženú rodinnú hru. Pôvodné vysvetľujúce hráčske stránky s príbehom, návodom a bočnou záchrannou linkou sú odstránené. Na pracovných listoch a pri úlohách 3–8 je písaný príbeh: predstavenie Pixelka, jeho problém a dôvod pomôcť. Po správnej odpovedi nasleduje poďakovanie, získaná indícia, ďalší objav a cesta k nasledujúcej stope. Zápletka sa postupne rozvinie až po bezpečný návrat celej partie. Rovnaké odseky zadania sú aj na tlačových listoch a v storyboarde. Kvak má kompaktný terminál, stručné potvrdenie a hlasovú správu. Záver má vlastné finále. Čas nie je limitovaný. Súčet časov siedmich úloh s úvodom a finále je 53 minút a ostáva pracovným odhadom, dlhší literárny text môže hranie predĺžiť.

Úvod sa po spustení hry otvorí cez celý displej. Každých 4,8 sekundy zaznejú tri jemné cinknutia vytvorené Web Audio API; pri otvorení správy alebo jej zavretí sa zastavia. Zvuk sa nespúšťa na pozadí. Po obnovení stránky môže byť potrebné ťuknúť na „Zapnúť zvuk“. Fullscreen API sa pri ťuknutí používa na celý dokument, aby sa v podporovaných prehliadačoch skryl aj adresný riadok. Režim zostáva zapnutý počas hry. Po obnovení stránky alebo jeho opustení sa dá zapnúť tlačidlom „Celá obrazovka“ na displeji správy. Ostatné zariadenia dostanú dialóg cez celú plochu stránky.

Dodané Pikovo video je v **`assets/PicoVideo.mp4`**; cestu určuje `GAME.video`. Prvé miesto majú deti zistiť iba z videa. Hráčsky úvod neponúka prepis ani „Máme obálku“. Pod videom sú iba „Prehrať znova“ a „Späť k správe“; druhé tlačidlo zastaví video a vráti predchádzajúci úvodný text. Dohratie ani návrat nemenia etapu. Úvod sa tu končí. Pokračovanie spustí až naskenovanie QR kódu na P1. QR otvára priamo `game.html?signal=kvak`, označí úvod za dokončený a otvorí prvú úlohu; opakované skenovanie zachová pokročilejší uložený postup. Staré uloženia s `messageRead` zostávajú kompatibilné a otvoria video. Pôvodný doslovný prepis `GAME.pikoMessage` a TTS zadanie zostávajú internými podkladmi StoryBoardu. Úvod aj ovládanie sa zmestia na mobil bez posúvania. Počas úloh možno video znovu otvoriť bez straty postupu. Chýbajúce video zobrazí chybu a odporučí opakované prehratie alebo pomoc dospelého. Tlačové pokyny pre rodiča obsahujú riešenia.

Úvodný čitateľný scenár je zosúladený s novým rozprávaním v prvej osobe; dodané nahrávky a pôvodné TTS zadania sa nemenia. StoryBoard pri Pikovi a Kvakovi zobrazuje kompaktné ovládanie aktuálnych médií, zbalené prepisy a voliteľné TTS zadania; duplicitné kompletné scenáre sú z týchto dvoch sekcií odstránené.

## Kvakova záchranná misia V4

Obálka Kúpeľňa obsahuje iba celý P1. Deti vystrihnú šesť signálov, otočia ich a zoradia podľa dátumu a presného času. Všetky záznamy sú z rovnakého roka. Po potvrdení používateľom majú tri záznamy spoločný dátum, aby bolo nutné porovnať aj čas:

| Dátum | Čas | Číslica |
| --- | --- | --- |
| 13. 3. | 20:05 | 7 |
| 13. 3. | 20:10 | 4 |
| 13. 3. | 20:15 | 1 |
| 14. 6. | 19:50 | 2 |
| 15. 9. | 08:35 | 9 |
| 15. 12. | 08:40 | 6 |

Na hárku sú premiešané a otočené o 90°, 180° a −90°. Riešenie **741296** je v internom storyboarde, v Game Masterovi a na prvej rodičovskej strane; hráčsky P1 ho neobsahuje. Hráčsky list obsahuje príbeh, schopnosti a problém Kvaka, päť krokov, šesť ústrižkov, prázdne políčka na kód a funkčný QR. Zadanie, políčka aj QR panel sú nad vyznačenou deliacou čiarou, takže po odstrihnutí spodných signálov zostanú spolu hore. QR `assets/kvak-qr.svg` obsahuje trvalý odkaz z `GAME.kvakQr` na prvú úlohu existujúceho Site. Má biely okraj a neobsahuje odpoveď na hlavolam. Obnoviť ho možno autorským helperom `scripts/generate-kvak-qr.cjs` s externou závislosťou `qrcode` cez `QRCODE_MODULE`; helper obnoví aj QR na P3.

Kúpeľňová úloha v StoryBoarde zobrazuje pracovný list a rodičovské pokyny bez simulácie QR. Hráč sa po naskenovaní QR na P1 dostane priamo na obnovu spojenia. Na obrazovke sú rovnako veľké postavičky Pika a Kvaka, názov úlohy a terminál bez opakovania papierového príbehu. Má numerickú klávesnicu, kontrolu presne šiestich číslic a opakovateľné pokusy. Na úvodnej obrazovke kódu sa nápovedy nezobrazujú. Pri zaostrení sa vstup vycentruje približne do stredu viditeľnej plochy nad mobilnou klávesnicou a sleduje zmeny `visualViewport`. Na nižších displejoch ponechá miesto aj pre potvrdzovacie tlačidlo. QR navigácia otvorí vstup; samotný šesťmiestny kód stále riešia deti. Správny kód uloží S a zobrazí oficiálneho Pika a Kvaka, krátke poďakovanie a pripomienku, že písmeno S si treba zapamätať na neskôr. Obe obrazovky sa zmestia na malý telefón bez posúvania. Výsledok nemá tlačidlo na ďalšiu obálku ani odkaz na zápisník; pokračuje sa papierovým P2 pri okne a potom QR kódom z P3 pod stoličkou. Hovorí iba Kvak. Súbor **`assets/KvakMessage.mp3`** je bajtovo totožná kópia dodanej nahrávky `assets/KvakMessage.mpeg`, so správnou príponou a HTTP typom `audio/mpeg` pre mobilné prehliadače; `GAME.audio` určuje cestu a `GAME.kvakMessage` presný prepis. Nahrávka sa potichu načítava už pri otvorení terminálu prvej úlohy. Po prijatí správneho kódu sa ten istý prehrávač s načítanými dátami zachová a hlas sa spustí priamo v rámci odoslania odpovede. Pred správnym kódom sa zvuk neprehráva; odchod z úlohy prehrávač zastaví a uvoľní. Jedno veľké tlačidlo prepína medzi pozastavením, pokračovaním a „↻ Prehrať znova“ po dohraní. Pri načítavaní sa zobrazí stav „Načítavam Kvakovu správu…“; postava hovorí až po skutočnom rozbehnutí zvuku. Pri návrate do už vyriešenej úlohy sa prehrávanie spúšťa ručne. Ak prehliadač automatické spustenie zablokuje, ostane dostupné to isté tlačidlo na spustenie. Pri nedostupnom alebo nepodporovanom audiu sa automaticky otvorí celý prepis v samostatnom dialógu. Ten možno otvoriť aj odkazom „Čítať Kvakovu správu“. Po chybe sa prehrávač pozastaví a ďalšie ťuknutie znova načíta nahrávku aj v prehliadačoch, ktoré pri zlyhaní samy nezmenia stav prehrávania. Audio nikdy samo nepresunie hru do ďalšej úlohy.

Príprava pre rodiča:

| Miesto | Obsah |
| --- | --- |
| Kúpeľňa, suchá dostupná polička alebo uteráky | Obálka Kúpeľňa: iba celý P1. Nikdy lieky, čistiace prostriedky, elektrické zariadenia, práčka či sušička. |
| Pri okne na dosah detí | Obálka 2: celý P2 s Iskriným dekódovacím strojom; dva kruhy vystrihujú až deti. Okno sa neotvára, na parapet sa nelezie. |
| Pod sedadlom stoličky | Samostatná obálka „Úloha 3“ s P3, prilepená zo spodnej strany sedadla. |
| Pri topánkach | Obálka (indícia) 3 s pripraveným P4 je ukrytá vo vnútri čistej suchej topánky. |
| Stôl | Samostatne uzavretý P5 označený „Úloha 5 – otvoriť po zložení odkazu“. |
| Pod inou stoličkou než P3 | Obálka 4 s P6 označená „Úloha 6 – otvoriť po opravení Kubovej cesty“. Pri skoršom nájdení sa neotvára. |

Iskrina úloha 2 je iba na papieri (`paperOnly`): P2 nemá QR kód ani pokyny k telefónu. Nemá hráčsku stránku, tlačidlo na potvrdenie, webový test ani text po vyriešení. Deti nastavia vonkajšie D oproti vnútornému A, preložia `KODGDM SRG VWROLFNDPL` na `HĽADAJ POD STOLIČKAMI` a zapíšu ho do veľkých vycentrovaných políčok po slovách (6, 3 a 10 písmen). Pod stoličkou nájdu P3; až jeho QR (`assets/sutko-qr.svg`, `GAME.sutkoQr`) otvára `game.html?signal=sutko`, teda Šutkovu úlohu 3. Po splnení Kvakovej úlohy sa pri tomto vstupe zachová papierový krok 2 aj písmeno V bez ďalšieho ťukania. Staré uloženia na kroku 2 pokračujú priamo krokom 3; opakované skenovanie zachová pokročilejší postup. Lístok v úlohe 4 má namiesto stroja pásiky P4: `STÔL / SKRÝVA / KUBOV PLÁN. / TERAZ HO OTVORTE.` Odpovede STÔL/STOL zostávajú platné. ID etáp, získavané písmená, ostatné kódy aj uložené splnené úlohy zostávajú kompatibilné. Staré rozhrané úlohy 2 pokračujú priamo Šutkovou úlohou; už splnená úloha sa neopakuje. Príbeh, checklist, návod, jednotlivé PDF a spoločný balík používajú nové mechaniky. Dodané video a Kvakova nahrávka sa nemenia; jeho kúsky odkazu predstavujú časti Iskrinho stroja.

## Príbehový model a súbory

- `game-data.js`: jediný zdroj herných dát, označení etáp a písaného príbehu v `stages[].narrative.before/after`. `story-text.js` vykresľuje rovnaké odseky aj rastúcu partiu do hry, storyboardu a tlačových listov; `party.css` používa výrezy existujúceho oficiálneho atlasu. Pri novej postavičke sa obrázok zvýrazní, od siedmej úlohy zostáva spolu všetkých sedem Pixelkov. Čítačka scén aj vývojárske podklady používajú rovnaké priame rozprávanie postavičiek v prvej osobe. `stages[].story` sú panely pred úlohou, `resolution` sú panely po správnej odpovedi. Panel je pole autorských riadkov, ktoré rozhranie rozlíši na rozprávača, dialóg a svetelný odkaz. `GAME.call` odkazuje na tie isté panely úvodu, neduplikuje samostatný skrátený telefonát. `dramaturgy` je viditeľná iba v Game Masterovi. Finále má samostatnú Pikovu `invitation`.
- `site-config.js` a `prep-store.js`: spoločný produktový katalóg, nákupný integračný bod a lokálny adaptér prípravy.
- `app.js`: oddelenie prostredí, kontrola spustenia, displej s videosprávou, čítačka scén, validácia siedmich úloh, zápisník, mapa, lokálny postup, príprava a kompletný Game Master.
- `atlas.html` + `atlas.css`: samostatná miniknižka. Všetkých 143 odsekov kapitoly Tajný svet Pixelkov a dva úplné literárne odseky každého zo siedmich profilov sú priamo v HTML; na čítanie netreba JavaScript ani uložený postup. Názvoslovie a súvisiaca gramatika boli prispôsobené schválenému názvu Ochranné pole.
- `printables.html` + `print-materials.js` + `signal-print.css`: finálny jednostranný Kvakov P1 vo formáte A4, aktuálne hlavolamy P2–P6, diplom a úvodný jednostranový návod pre Game mastra. Návod obsahuje odporúčanie farebnej aj čiernobielej tlače, balenie stôp a spoločné pokyny s nápovedou ku každej etape. Biele/svetlé plochy, tmavomodrý text, obrysy, oficiálny výrez Kvaka a malé akcenty šetria atrament. Význam nespolieha na farbu. Hráčsky odkaz `?sheet=p1` zobrazí a vytlačí iba daný list bez neskorších indícií a rodičovského riešenia. Interný odkaz `?internalPreview=1#p1` ponechá všetkých osem strán a posunie na vybraný list. Návrat vedie do storyboardu.
- `styles.css` + `adventure.css`: základné rozloženie a existujúci pixel-art vzhľad vrátane V2 čítačky.
- `assets/pixelkovia-atlas.png`: oficiálny obrazový atlas 4 × 2 políčka, Piko / Kvak / Iskra / Šutko, Lístok / Kubo / Ryško / priechod. Rovnaké CSS výrezy slúžia hre aj literárnym profilom. `assets/pixelkovia-room.png` tvorí titulnú ilustráciu. Nové postavy ani externé referenčné obrázky nepribudli. Podrobnosti sú v `assets/IMAGE-SOURCES.md`.

## Bonusový atlas a Game Master

Hráč dostane CTA **OBJAVIŤ TAJNÝ SVET PIXELKOV** až na úspešnej obrazovke finále. Úvod, hráčska navigácia ani bežné úlohy atlas neodkazujú. Storyboard má interný odkaz na Atlas; rodičovská výnimka sa v tejto etape nerozširuje do predajnej navigácie. Samotné `atlas.html` nie je uzamknuté hrou a dá sa priamo otvoriť alebo zdieľať bez hrania.

StoryBoard zachováva aktuálne nahrávky, ich doslovné prepisy a pôvodné zadania ElevenLabs s priamym odkazom na editor. Šutkova etapa má samostatný text správy po odomknutí a TTS; ostatné nahrávkou nepokryté etapy majú autorské scény a pozvánku pod tlačidlom Text príbehu. Vývojárske podklady sú odstránené; izolované testovanie je dostupné z hlavičky hráčskych etáp. Ryško vedie sľub SPOLU na P6 a za jeho potvrdenie odovzdáva O. Samostatný symbolový pozdrav ani digitálny panel už v hre nie sú. Pri spoločnom hesle sa zobrazuje karta poradia z P6. Každá etapa má pokyny a riešenie v jednom bloku zo spoločného zdroja s tlačovým návodom. Celé bloky sa zbaľujú ovládačom +/−; vnútorné nastavenie rozbalení zostáva zachované a médiá sa pri zbalení pozastavia. Ide o internú obrazovku s riešeniami bez vlastnej autentifikácie.

## Kompatibilita postupu

Identifikátory zachovaných etáp, odpovede ostatných hlavolamov, písmená S–V–E–T–L–O, heslá SPOLU a SVETLO aj kľúč `zahada-v1-progress` zostávajú zachované. Odstránená etapa `digital` sa vynechá pri prevode starého postupu opísanom nižšie. Prvá odpoveď je teraz šesťmiestny kód 741296. Existujúci postup sa obnoví bez vymazania; už splnená stará prvá úloha zostáva splnená a pri návrate zobrazí novú Kvakovu scénu. Rozpracovaná prvá úloha používa nový list P1. Staré uloženia s `kvakScan` aj bez neho otvoria pri pokračovaní prvej úlohy priamo obrazovku zadania kódu. Voliteľné `messageOpened` a `messageWatched` obnovujú úvodnú správu po načítaní stránky; staré uloženia ostávajú použiteľné. Staré `scenePages` zostáva v uloženiach kompatibilné a používa sa pri finále. Rozpracovaná úloha 3–8 otvorí priamo odpoveď; splnená zobrazí potvrdenie a uloženú indíciu. Zaškrtnutá príprava zostáva uložená samostatne. Bez localStorage hra funguje v pamäti.

## Overenie

Voliteľné testy používajú Playwright mimo projektu:

```sh
npm install --prefix /tmp/pixelkovia-qa playwright qrcode jsqr
/tmp/pixelkovia-qa/node_modules/.bin/playwright install --with-deps chromium
# V inom termináli: python3 -m http.server 8080
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/prototype.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/presentation.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/stage1.test.cjs
node tests/mission-data.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/storyboard-print.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/narrative.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright JSQR_MODULE=/tmp/pixelkovia-qa/node_modules/jsqr node tests/intro-qr.test.cjs
```

Kontrola storyboardu porovnáva presný text zadania, rodičovských pokynov a riešenia s tlačovinami, overuje odkazy na všetkých šesť listov, posun na príslušnú stranu, zbalené prepisy/TTS a izoláciu rodičovského riešenia od hráčskeho P1. Testy hry overujú tiež šesťmiestny kód a nesprávne pokusy, prechod cez tlačený QR, oficiálnu dvojicu postáv, automatické prehratie po správnom kóde, pauzu/pokračovanie/opakovanie MPEG jedným tlačidlom, chýbajúce audio a simulované zmenšenie viditeľnej plochy mobilnou klávesnicou, starú splnenú prvú úlohu, mobilný fullscreen a samostatnú A4 s úspornou farebnou aj čiernobielou tlačou. Testujú celoobrazovkovú prichádzajúcu správu, opakovanie a zastavenie cinkania, dodané video, jeho opakované prehrávanie aj obnovu úvodu, úplný priechod ôsmimi priamymi interakciami, zachovanie scenára a zvratu v StoryBoarde, zlé odpovede, nápovedy, obnovu V1 postupu aj stránkovania, izoláciu GM testov, reset, mobil/desktop, tlačoviny, offline otvorenie a nedostupné úložisko. Atlas sa testuje priamym otvorením bez postupu, aj bez JavaScriptu, vrátane úplnosti textu, siedmich výrezov a dostupnosti CTA až vo finále alebo v GM. Samostatná kontrola `narrative.test.cjs` zablokuje všetky nahrávky a prejde úvod aj osem úloh až po finále; overuje odseky pred riešením a po ňom, odhalenia zápletky, staršie uložené hry a zhodu textov s tlačovinami aj storyboardom. Test `intro-qr.test.cjs` dekóduje skutočný QR z tlačového SVG, otvorí jeho cieľ, overí koniec úvodu, návrat z videa, staré uloženia a zachovanie pokročilejšieho postupu po opakovanom skenovaní. Screenshoty a skúšobná tlač smerujú do `/tmp`.

## Publikovanie

Existujúci Site: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site

Atlas: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site/atlas.html

ID zostáva v `.openai/hosting.json`. Trvalý hosting nezávisí od Codespace. Platformové nastavenie prístupu Sites sa vzťahuje na celý web; verejná dostupnosť atlasu bez prihlasovania vyžaduje verejný prístup existujúcej Site. Zmena publika sa vykonáva iba podľa používateľovho rozhodnutia.

Po dokončení zmien sa zdroje commitnú a pushnú výlučne do `origin/main` vrátane commitov vytvorených Sites helperom. Nepoužíva sa force-push.

Mobilné prehrávanie Kvakovej správy overuje `tests/kvak-audio.test.cjs` v dotykovom režime Chromu a WebKitu. Používa skutočnú MP3 nahrávku a kontroluje správny HTTP typ, načítanie počas riešenia úlohy, zachovanie bufferu a rýchly štart po simulovanom pomalom sťahovaní, spustenie po kóde, pauzu, pokračovanie, opakovanie, návrat k uloženej úlohe, blokované automatické prehrávanie a opakovanie po chybe siete. Vyžaduje externý Playwright s prehliadačmi Chromium a WebKit (`playwright install --with-deps chromium webkit`); `AUDIO_BROWSERS=chromium` umožní samostatnú kontrolu Chromu. Spustenie: `PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/kvak-audio.test.cjs` proti lokálnemu serveru alebo `BASE_URL` nastavenému na nasadený web.


### Šutkov kamenný zámok (úloha 3)

Na P3 deti dopočítajú hodnoty △ = 3, ○ = 2, □ = 4. QR v spodnom paneli pod rovnicami otvorí `game.html?signal=sutko`; Vaša misia deti nasmeruje k jeho načítaniu až po zistení všetkých troch hodnôt. V tabuľke 5 stĺpcov × 7 riadkov označia jednotlivé políčka s 2, 3 alebo 4; ďalšie ťuknutie výber zruší. Až presný výber bez ďalších políčok odhalí číslicu 9: zvolené políčka 2,5 sekundy blikajú v pôvodnej tabuľke a potom sa zobrazí odomknutý most. Objav sa uloží ihneď; odchod zo stránky alebo testu zruší čakajúci prechod. Pri obmedzení animácií ostane deviatka svietiť bez blikania. Výber sa priebežne ukladá; staré dokončenia úlohy aj finálne písmená zostávajú platné. Presun P4 používa prípravné kroky `shoes` a uloženie P5 na stole (`shoe-clue-v1`). Po doplnení QR na P4 sa znovu potvrdzuje tlač (`listok-qr-v1`); postup hry zostáva zachovaný.

Po odomknutí je viditeľná ilustrácia Pika, Kvaka, Iskry a Šutka, prehrávač a indícia E s výslovným pokynom zapamätať si ju na neskôr. Správa ani miesto ďalšej stopy sa na hlavnej obrazovke nevypisujú. Prepis je dostupný iba cez Čítať Šutkovu správu a pri chybe zvuku sa sám neotvorí. Hovorený odkaz poďakuje deťom, zachytí Lístkov šepot a ponúkne hádanku o dvojiciach cestovateľov s jazykom, ktoré vyrážajú iba s detskými nohami. Nespomína písmeno E, topánky priamo ani mechaniku nasledujúcej úlohy. Rodičovské pokyny určujú úkryt P4 v topánke; P5 zostáva oddelene na stole. Skrátený text a zadanie na nahratie sú v StoryBoarde aj v `GAME.sutkoMessage` / `GAME.voiceScripts.sutko`. Dodaná Šutkova nahrávka je v `assets/Sutko.mp3` (približne 28,84 sekundy); `GAME.sutkoAudio` ukazuje na tento súbor a `GAME.sutkoAudioPlaceholder: false` vypína označenie náhrady. StoryBoard používa tú istú nahrávku. Používateľovo nové TTS zadanie je uložené doslova vrátane ôsmich hlasových pokynov a interpunkcie. Herný prepis zostáva podľa potvrdenia zachovaný; TTS je samostatná autorská verzia. Pri `sutkoAudio: null` zostáva k dispozícii tlačidlo na zobrazenie prepisu. Prehrávač potichu prednačíta nahrávku pri riešení. Posledné správne ťuknutie odomkne Web Audio a spustí ten istý prehrávač cez gain 0. Počas 2,5-sekundového odhalenia zostáva nahrávka nepočuteľná a prehrávač sa pri prekreslení nezastaví. Pri zobrazení mosta sa vráti na začiatok, obnoví sa pôvodné nastavenie opakovania a gain 1 pustí celú správu automaticky bez ďalšieho dotyku. Pri zamietnutí zvuku zostáva veľké tlačidlo na ručné prehratie; pri návrate k už vyriešenej úlohe sa zvuk sám nezapína. Odchod počas odhalenia aj správy prehrávač zastaví a zatvorí jeho zvukový kontext. Ovládanie umožní pozastavenie, pokračovanie, opakovanie aj čítanie pri chybe. Výsledok zoskupuje nadpis so znakom 9, ilustráciu s poďakovaním, prehrávač a indíciu E do jednotne zarovnaných celkov. Rovnaký súbor sa použije aj v StoryBoarde.

Overenie zámku a mobilného prehrávača: `PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/sutko.test.cjs`. Zvukové testy používajú skutočnú dodávanú MP3 v dotykovom Chrome (Pixel 7) aj WebKite (iPhone 13). Overujú ticho počas riešenia aj odhalenia, odomknutie pri poslednom správnom dotyku, automatické prehratie od začiatku po odhalení, zachovaný buffer, pauzu, pokračovanie, opakovanie a zotavenie po zamietnutí prehrávania alebo chybe siete.


V detských textoch, pracovných listoch a textových/TTS verziách správ sa používa **indícia**. Názov **obálka (indícia)** patrí do rodičovskej prípravy, kde vysvetľuje fyzické balenie. Pôvodné video Pika a audio Kvaka zostávajú nezmenené; StoryBoard pri ich aktualizovaných textoch upozorňuje na staršie znenie nahrávok. Šutko používa vlastnú dodanú nahrávku `assets/Sutko.mp3`. Presun Lístkovej indície nemení existujúcu mechaniku P4 ani odpovede a finálne písmená.


Po Šutkovom odomknutí sa pod spoločným obrázkom zobrazí krátke poďakovanie (`GAME.sutkoThanks`); zostáva prehrávač, skrytý prepis a E. Tlačidlo Pokračovať tu nie je. Deti pokračujú nájdením indície v topánke: spodný QR na P4 (`assets/listok-qr.svg`, `GAME.listokQr`) otvorí `game.html?signal=listok`. Táto adresa otvorí úlohu 4 iba po dokončení Šutka; skoré skenovanie ani opakovaný vstup nepreskočia úlohy a nemenia pokročilejší postup.


## Sedem úloh a uložený postup

Samostatná pôvodná úloha 6 (Ryškova sekvencia mesiac–slnko–hviezda) je odstránená. Po Kubovej ceste (5, kód 246, L) deti otvoria poslednú indíciu pod inou stoličkou. Sľub SPOLU je nová úloha 6: Ryško vysvetlí ochranné uzavretie brány a za sľub odovzdá O. Úloha 7 skladá SVETLO z písmen úloh 1–6. Zostáva všetkých sedem postavičiek, šesť pracovných listov aj poradie S, V, E, T, L, O. Na P5 je už iba smerovanie k poslednej indícii; P6 obsahuje sľub a kartu finále. Novú tlač a označenie poslednej indície musí rodič znova potvrdiť.

Kľúč `zahada-v1-progress` zostáva zachovaný. Uloženia bez `progressVersion` sa pri načítaní prevedú na verziu 2: pôvodný krok 6 sa vynechá, kroky 7–9 sa posunú na 6–8 a rovnakým spôsobom sa prečíslujú dokončenia a nápovedy. Rozhraná odstránená úloha pokračuje pri sľube; staré finále zostáva dokončené. Nové uloženia sa už druhýkrát neprečíslujú.
