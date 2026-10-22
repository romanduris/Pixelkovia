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
- **`storyboard.html` – interný vývojový náhľad.** Hlavička Pixelkovia / Záhada u vás doma obsahuje Digital Product Administration a Funnel; pod úvodom sú Customer page, Atlas Pixelkov a Tlačové materiály. Desať etáp je predvolene zbalených a používa spoločnú šablónu podľa úlohy Kúpeľňa: tlačový list s rovnakým textom zadania, kompaktné ovládanie obsahu a jeden svetlý blok inštrukcií pre Game mastra s nápovedou aj riešením. Pod ním zostáva iba kontrola tlačeného dokumentu. Pikovo video otvára tlačidlo s ikonou videa v existujúcom prehrávacom dialógu; prepis aj TTS sú predvolene skryté rovnako ako pri Kvakovi. Ostatné etapy majú zbalený Text príbehu a Vývojárske podklady so zachovanými scénami a dramaturgiou. Tlačidlo Otestovať je priamo v hlavičke každej etapy vrátane úvodu, Kúpeľne a finále; funguje aj bez rozbalenia.
- **`game.html` – adresa existujúceho herného rozhrania.** Štart z pripraveného portálu zachová používateľské gesto pre video/zvuk/fullscreen. Návrat do prehľadu vedie do rodičovského portálu. Nové načítanie tejto adresy otvorí prípravu; hra ani video sa nespúšťajú automaticky. Tlačidlo Pokračovať obnoví existujúci postup v rovnakom prehliadači. Herný kľúč `zahada-v1-progress`, ID etáp, odpovede, médiá a nápovedy zostávajú kompatibilné.

### Checklist a rozhrania pre ďalšiu etapu

`prep-store.js` definuje dvanásť povinných krokov podľa aktuálnej logistiky štyroch obálok a samostatných P3/P5. Progress zobrazuje počet splnených krokov. Štart aj reštart sa odblokujú až po všetkých krokoch **a** samostatnom potvrdení o telefóne. Kontrola je aj v obsluhe akcie, nielen v atribúte `disabled`. Odškrtnutie kroku štart znovu blokuje.

Kľúče `zahada-prep-v5-*` zachovávajú hotový herný postup a nezmenené prípravné kroky. Po výmene Iskrinej a Lístkovej mechaniky treba znovu potvrdiť tlač a dotknuté obálky s revíziou `iskra-decoder`; rozstrihanie P4 má nový samostatný krok. Staré potvrdenie rozstrihania P2 sa nepovažuje za prípravu P4. Pôvodný všeobecný krok rozmiestnenia automaticky nepotvrdzuje všetky nové jednotlivé úkryty. Staré kľúče ani herný postup sa nemažú. Pri nedostupnom localStorage funguje príprava v pamäti do opustenia stránky. API `read`, `write`, `snapshot`, `ready`, `scope` a `useAdapter` umožňuje neskôr pridať synchronizačný adaptér; teraz ide výlučne o lokálne dáta, bez synchronizácie medzi zariadeniami.

`site-config.js` je spoločný katalóg cien, návrhov produktov a nákupného CTA. Má aj nezobrazovanú zamýšľanú budúcu cenu 29,99 €, nulovú referenčnú cenu/kampaň a rozhranie stavov `not-purchased`, `purchased`, `available`, `coming-soon`. Aktuálne doplnky sú vždy `coming-soon`; nič sa nepredáva ani neoznačuje za zakúpené. Budúci server musí dodať overené oprávnenia; aktuálny klient ich nevyrába.

`SITE_CONFIG.access.mode` je `test`. Pri zmene na `production` sa portál, storyboard a herný vstup zastavia pred vykreslením obsahu a vyžadujú budúce serverové overenie. **Nie je to zabezpečenie statických súborov:** všetky publikované HTML, JS a PDF možno otvoriť priamou známou cestou v rámci prístupu k celej Site. Skryté odkazy, `noindex` ani klientsky režim nie sú autentifikácia. Pred skutočným predajom treba zaviesť serverové overenie a doručovanie súkromných dát/materiálov. Publikovanie zachováva pôvodné publikum Site a nemení ho na verejné.

Etapa 1 neimplementuje dashboard, Cloudflare D1, platby, zákaznícke účty, Magic Link, cookies, priradenie telefónu ani e-mailové automatizácie. QR na P1 zostáva priznanou nefunkčnou maketou; funguje existujúci herný prechod na zadanie kódu. Vzorová kúpeľňová úloha v storyboarde nemá tlačidlo na simulovanie QR.

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

Pixelkovia potajomky žijú v každej domácnosti s mobilom, tabletom, počítačom či televízorom. Piko po veľkom bliknutí stratí spojenie s kamarátmi. Úvod nevysvetľuje príčinu. Kvak zachytí opakujúci sa signál, Iskra objaví skryté značky a Šutko rozpozná priechod uzavretý zvnútra. Lístok po úlohe 4 prečíta varovanie: Ochranné pole nie je pokazené. Kubo nájde bezpečnú návratovú cestu a Ryško po úlohe 6 vysvetlí, že sa pole automaticky preventívne uzavrelo, aby zabránilo prezradeniu ich sveta.

SPOLU je sľub celej partie. SVETLO je spoločný potvrdzovací signál šiestich pripravených schopností, nie násilné otvorenie ochrany. Piko drží spojenie s ľuďmi a vracia sa ako posledný. Vo finále je všetkých sedem doma a Ochranné pole sa vráti do bežného režimu.

Najprv v Príprave hry rozmiestnite štyri obálky a samostatne uzavretú kartu symbolov. Potom hráči otvoria Pikovo video alebo písanú správu a riešia osem úloh. Etapy sú označené číslom a miestom stopy, napríklad „Úloha 1 – Kúpeľňa“; úvod sa označuje „Úvod – Telefón“. V tejto fáze sa zadania, príprava, literárne scény a riešenia kontrolujú v StoryBoarde. Video v úvode otvára samostatné tlačidlo. Otestovať v hlavičke otvára úvodnú správu, zadanie kúpeľňového kódu, priamu interakciu úloh 2–8 alebo finále. Testovanie používa dočasný postup a nemení uloženú rodinnú hru. Pôvodné vysvetľujúce hráčske stránky s príbehom, návodom a bočnou záchrannou linkou sú odstránené. Pri každom zadaní je písaný príbeh: predstavenie Pixelka, jeho problém a dôvod pomôcť. Po správnej odpovedi nasleduje poďakovanie, získaná indícia, ďalší objav a cesta k nasledujúcej stope. Zápletka sa postupne rozvinie až po bezpečný návrat celej partie. Rovnaké odseky zadania sú aj na tlačových listoch a v storyboarde. Kvak má navyše voliteľnú hlasovú správu a záver vlastné finále. Čas nie je limitovaný. Návrhových 60 minút ostáva pracovným odhadom, dlhší literárny text môže hranie predĺžiť.

Úvod sa po spustení hry otvorí cez celý displej. Každých 4,8 sekundy zaznejú tri jemné cinknutia vytvorené Web Audio API; pri otvorení správy alebo jej zavretí sa zastavia. Zvuk sa nespúšťa na pozadí. Po obnovení stránky môže byť potrebné ťuknúť na „Zapnúť zvuk“. Fullscreen API sa pri ťuknutí používa na celý dokument, aby sa v podporovaných prehliadačoch skryl aj adresný riadok. Režim zostáva zapnutý počas hry. Po obnovení stránky alebo jeho opustení sa dá zapnúť tlačidlom „Celá obrazovka“ na displeji správy. Ostatné zariadenia dostanú dialóg cez celú plochu stránky.

Dodané Pikovo video je v **`assets/PicoVideo.mp4`**; cestu určuje `GAME.video`. Po doplnení súboru treba znovu pripraviť a publikovať statický web. Ťuknutím na notifikáciu sa prehrá video so zvukom, bez prepisu či titulkov prezrádzajúcich úkryt. Prvý hlavolam je porozumieť správe: **Kde je obálka? V kúpeľni.** Pred otvorením správy zostáva úkryt skrytý. Po ťuknutí na „Prečítať správu“ ho prezradí aj písaná alternatíva; hra je priechodná bez videa a zvuku. Video má na telefóne prioritu, prispôsobuje sa dostupnej ploche so zachovaním pomeru strán a jedného rámu. Po prehratí ostane na displeji s označením „Správa od Pika“ a šípkou na opätovné prehratie priamo na obraze. Ťuknutím kdekoľvek na obraz sa prehrá znova; samostatné tlačidlo zostáva dostupné pod videom. Pokračuje sa ručne tlačidlom „Máme obálku“. Počas úloh možno video znova otvoriť cez „Pikova správa“ bez straty postupu. Chýbajúce alebo neprehrateľné video zobrazí chybu a deti môžu pokračovať cez „Prečítať správu“. Prečítanie sa uloží aj pri návrate do hry; video zostáva dostupné ako voliteľný doplnok.

Pôvodný úplný autorský scenár úvodného hovoru zostáva v herných dátach. StoryBoard pri Pikovi a Kvakovi zobrazuje kompaktné ovládanie aktuálnych médií, zbalené prepisy a voliteľné TTS zadania; duplicitné kompletné scenáre sú z týchto dvoch sekcií odstránené.

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

Na hárku sú premiešané a otočené o 90°, 180° a −90°. Riešenie **741296** je v internom storyboarde, v Game Masterovi a na prvej rodičovskej strane; hráčsky P1 ho neobsahuje. Hráčsky list obsahuje príbeh, schopnosti a problém Kvaka, päť krokov, šesť ústrižkov, prázdne políčka na kód a nefunkčnú maketu QR. Zadanie, políčka aj QR panel sú nad vyznačenou deliacou čiarou, takže po odstrihnutí spodných signálov zostanú spolu hore. Maketa `assets/kvak-qr-dummy.svg` neobsahuje zakódované dáta ani navigáciu; je označená DEMO / NEFUNKČNÁ. Skutočný QR sa nevytvára.

Kúpeľňová úloha v StoryBoarde zobrazuje pracovný list a rodičovské pokyny bez simulácie QR. Hráč sa po „Máme obálku“ dostane priamo na obnovu spojenia. Má numerickú klávesnicu, kontrolu presne šiestich číslic a opakovateľné pokusy. Na úvodnej obrazovke kódu sa nápovedy nezobrazujú. Pri zaostrení sa vstup vycentruje približne do stredu viditeľnej plochy nad mobilnou klávesnicou a sleduje zmeny `visualViewport`. Na nižších displejoch ponechá miesto aj pre potvrdzovacie tlačidlo. Prechod je oddelený od overenia a možno naň neskôr napojiť QR navigáciu. Správny kód uloží S a zobrazí oficiálneho Pika a Kvaka. Hovorí iba Kvak. Súbor **`assets/KvakMessage.mpeg`** je dodané MPEG audio; `GAME.audio` určuje cestu a `GAME.kvakMessage` presný prepis. Po prijatí správneho kódu sa hlas spustí automaticky v rámci odoslania odpovede. Jedno veľké tlačidlo prepína medzi pozastavením, pokračovaním a „↻ Prehrať znova“ po dohraní. Pri návrate do už vyriešenej úlohy sa prehrávanie spúšťa ručne. Ak prehliadač automatické spustenie zablokuje, ostane dostupné to isté tlačidlo na spustenie. Pri nedostupnom alebo nepodporovanom audiu sa automaticky otvorí celý prepis. Audio nikdy samo nepresunie hru do ďalšej úlohy.

Príprava pre rodiča:

| Miesto | Obsah |
| --- | --- |
| Kúpeľňa, suchá dostupná polička alebo uteráky | Obálka Kúpeľňa: iba celý P1. Nikdy lieky, čistiace prostriedky, elektrické zariadenia, práčka či sušička. |
| Pri okne na dosah detí | Obálka 2: celý P2 s Iskriným dekódovacím strojom; dva kruhy vystrihujú až deti. Okno sa neotvára, na parapet sa nelezie. |
| Nízko pod oknom | Samostatne uzavretý P3: „Úloha 3 – otvoriť po dekódovaní odkazu“. |
| Stôl | Obálka 3: štyri vopred rozstrihané pásiky P4 a samostatne uzavretý P5 označený „Úloha 5 – otvoriť po zložení odkazu“. |
| Pod sedadlom dostupnej stoličky | Obálka 4: P6. |

Iskra v úlohe 2 skladá dekódovací stroj P2 a nastavuje vonkajšie D oproti vnútornému A. Posun −3 preloží `SRG RNQRP` na `POD OKNOM`; odpovede OKNO/POD OKNOM zostávajú platné. Lístok v úlohe 4 má namiesto stroja pásiky P4: `STÔL / SKRÝVA / KUBOV PLÁN. / TERAZ HO OTVORTE.` Odpovede STÔL/STOL zostávajú platné. Preto sa nemenia úkryty, ID etáp, získavané písmená ani uložené splnené úlohy. Príbeh, checklist, návod, jednotlivé PDF a spoločný balík používajú nové mechaniky. Dodané video a Kvakova nahrávka sa nemenia; jeho kúsky odkazu predstavujú časti Iskrinho stroja.

## Príbehový model a súbory

- `game-data.js`: jediný zdroj herných dát, označení etáp a písaného príbehu v `stages[].narrative.before/after`. `story-text.js` vykresľuje rovnaké odseky do hry, storyboardu a tlačových listov. Pôvodné autorské scény zostávajú zachované pre vývojárske podklady. `stages[].story` sú panely pred úlohou, `resolution` sú panely po správnej odpovedi. Panel je pole autorských riadkov, ktoré rozhranie rozlíši na rozprávača, dialóg a svetelný odkaz. `GAME.call` odkazuje na tie isté panely úvodu, neduplikuje samostatný skrátený telefonát. `dramaturgy` je viditeľná iba v Game Masterovi. Finále má samostatnú Pikovu `invitation`.
- `site-config.js` a `prep-store.js`: spoločný produktový katalóg, nákupný integračný bod a lokálny adaptér prípravy.
- `app.js`: oddelenie prostredí, kontrola spustenia, displej s videosprávou, čítačka scén, validácia ôsmich úloh, zápisník, mapa, lokálny postup, príprava a kompletný Game Master.
- `atlas.html` + `atlas.css`: samostatná miniknižka. Všetkých 143 odsekov kapitoly Tajný svet Pixelkov a dva úplné literárne odseky každého zo siedmich profilov sú priamo v HTML; na čítanie netreba JavaScript ani uložený postup. Názvoslovie a súvisiaca gramatika boli prispôsobené schválenému názvu Ochranné pole.
- `printables.html` + `print-materials.js` + `signal-print.css`: finálny jednostranný Kvakov P1 vo formáte A4, aktuálne hlavolamy P2–P6, diplom a úvodný jednostranový návod pre Game mastra. Návod obsahuje odporúčanie farebnej aj čiernobielej tlače, balenie stôp a spoločné pokyny s nápovedou ku každej etape. Biele/svetlé plochy, tmavomodrý text, obrysy, oficiálny výrez Kvaka a malé akcenty šetria atrament. Význam nespolieha na farbu. Hráčsky odkaz `?sheet=p1` zobrazí a vytlačí iba daný list bez neskorších indícií a rodičovského riešenia. Interný odkaz `?internalPreview=1#p1` ponechá všetkých osem strán a posunie na vybraný list. Návrat vedie do storyboardu.
- `styles.css` + `adventure.css`: základné rozloženie a existujúci pixel-art vzhľad vrátane V2 čítačky.
- `assets/pixelkovia-atlas.png`: oficiálny obrazový atlas 4 × 2 políčka, Piko / Kvak / Iskra / Šutko, Lístok / Kubo / Ryško / priechod. Rovnaké CSS výrezy slúžia hre aj literárnym profilom. `assets/pixelkovia-room.png` tvorí titulnú ilustráciu. Nové postavy ani externé referenčné obrázky nepribudli. Podrobnosti sú v `assets/IMAGE-SOURCES.md`.

## Bonusový atlas a Game Master

Hráč dostane CTA **OBJAVIŤ TAJNÝ SVET PIXELKOV** až na úspešnej obrazovke finále. Úvod, hráčska navigácia ani bežné úlohy atlas neodkazujú. Storyboard má interný odkaz na Atlas; rodičovská výnimka sa v tejto etape nerozširuje do predajnej navigácie. Samotné `atlas.html` nie je uzamknuté hrou a dá sa priamo otvoriť alebo zdieľať bez hrania.

StoryBoard zachováva aktuálne nahrávky, ich doslovné prepisy a pôvodné zadania ElevenLabs s priamym odkazom na editor. Od Iskrinej etapy sú úplné autorské scény pred aj po úlohách a pozvánka pod tlačidlom Text príbehu. Vývojárske podklady obsahujú pravidlá, postupné nápovedy, prechody a dramaturgiu; izolované testovanie je dostupné z hlavičky každej etapy. Pri Ryškovi sa vedľa P5 zobrazuje jeho pozdrav, pri spoločnom hesle karta poradia z P6. Každá etapa má pokyny a riešenie v jednom bloku zo spoločného zdroja s tlačovým návodom. Celé bloky sa zbaľujú ovládačom +/−; vnútorné nastavenie rozbalení zostáva zachované a médiá sa pri zbalení pozastavia. Ide o internú obrazovku s riešeniami bez vlastnej autentifikácie.

## Kompatibilita postupu

ID etáp, odpovede úloh 2–8, odmeny S–V–E–T–L–O, SPOLU, SVETLO a kľúč `zahada-v1-progress` zostali zachované. Prvá odpoveď je teraz šesťmiestny kód 741296. Existujúci postup sa obnoví bez vymazania; už splnená stará prvá úloha zostáva splnená a pri návrate zobrazí novú Kvakovu scénu. Rozpracovaná prvá úloha používa nový list P1. Staré uloženia s `kvakScan` aj bez neho otvoria pri pokračovaní prvej úlohy priamo obrazovku zadania kódu. Voliteľné `messageOpened` a `messageWatched` obnovujú úvodnú správu po načítaní stránky; staré uloženia ostávajú použiteľné. Staré `scenePages` zostáva v uloženiach kompatibilné a používa sa pri finále. Rozpracovaná úloha 2–8 otvorí priamo odpoveď; splnená zobrazí potvrdenie a uloženú indíciu. Zaškrtnutá príprava zostáva uložená samostatne. Bez localStorage hra funguje v pamäti.

## Overenie

Voliteľné testy používajú Playwright mimo projektu:

```sh
npm install --prefix /tmp/pixelkovia-qa playwright
/tmp/pixelkovia-qa/node_modules/.bin/playwright install --with-deps chromium
# V inom termináli: python3 -m http.server 8080
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/prototype.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/presentation.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/stage1.test.cjs
node tests/mission-data.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/storyboard-print.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/narrative.test.cjs
```

Kontrola storyboardu porovnáva presný text zadania, rodičovských pokynov a riešenia s tlačovinami, overuje odkazy na všetkých šesť listov, posun na príslušnú stranu, zbalené prepisy/TTS a izoláciu rodičovského riešenia od hráčskeho P1. Testy hry overujú tiež šesťmiestny kód a nesprávne pokusy, simulovaný QR prechod, oficiálnu dvojicu postáv, automatické prehratie po správnom kóde, pauzu/pokračovanie/opakovanie MPEG jedným tlačidlom, chýbajúce audio a simulované zmenšenie viditeľnej plochy mobilnou klávesnicou, starú splnenú prvú úlohu, mobilný fullscreen a samostatnú A4 s úspornou farebnou aj čiernobielou tlačou. Testujú celoobrazovkovú prichádzajúcu správu, opakovanie a zastavenie cinkania, dodané video, jeho opakované prehrávanie aj obnovu úvodu, úplný priechod ôsmimi priamymi interakciami, zachovanie scenára a zvratu v StoryBoarde, zlé odpovede, nápovedy, obnovu V1 postupu aj stránkovania, izoláciu GM testov, reset, mobil/desktop, tlačoviny, offline otvorenie a nedostupné úložisko. Atlas sa testuje priamym otvorením bez postupu, aj bez JavaScriptu, vrátane úplnosti textu, siedmich výrezov a dostupnosti CTA až vo finále alebo v GM. Samostatná kontrola `narrative.test.cjs` zablokuje všetky nahrávky a prejde úvod aj osem úloh až po finále; overuje odseky pred riešením a po ňom, odhalenia zápletky, staršie uložené hry a zhodu textov s tlačovinami aj storyboardom. Screenshoty a skúšobná tlač smerujú do `/tmp`.

## Publikovanie

Existujúci Site: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site

Atlas: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site/atlas.html

ID zostáva v `.openai/hosting.json`. Trvalý hosting nezávisí od Codespace. Platformové nastavenie prístupu Sites sa vzťahuje na celý web; verejná dostupnosť atlasu bez prihlasovania vyžaduje verejný prístup existujúcej Site. Zmena publika sa vykonáva iba podľa používateľovho rozhodnutia.

Po dokončení zmien sa zdroje commitnú a pushnú výlučne do `origin/main` vrátane commitov vytvorených Sites helperom. Nepoužíva sa force-push.
