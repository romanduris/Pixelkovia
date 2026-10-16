# Pixelkovia: Stratený signál V4 + Tajný atlas

Slovenská rodinná hra v domácnosti a samostatná ilustrovaná miniknižka. Statické HTML/CSS/JS, bez frameworku a aplikačných účtov. Literárnym zdrojom je úplný autorský dokument GAME STUDIO V2 dodaný používateľom.

## Spustenie a build

Otvorte `index.html` alebo `atlas.html` priamo v prehliadači. Obe stránky fungujú aj bez siete. Pre HTTP náhľad spustite `python3 -m http.server 8080` v koreňovom priečinku.

Nasadzovaný výstup pripraví `node scripts/prepare-static.mjs`. Kopíruje hlavnú stránku, atlas, tlačoviny, CSS, JavaScript aj `assets/` do ignorovaného `dist/`. Upravujte koreňové zdroje, nie `dist/`.

## Predajná prezentácia, zákaznícka príprava a StoryBoard

Každé nové otvorenie a refresh `index.html` zobrazí hlavnú predajnú stránku od vrchu. Uložená hra sa nespúšťa automaticky ani pri rozpracovanej správe. Tlačidlo **Pokračovať v dobrodružstve** na hlavnej stránke alebo v Príprave hry obnoví presne uložený postup. Pôvodný kľúč localStorage, nápovedy aj ID etáp zostávajú zachované.

Tri horné taby:

- **Dobrodružstvo**: predajná prezentácia so zachovanou titulnou ilustráciou, ilustračnými zábermi rodinného riešenia, predstavením postáv, obsahom balíka, FAQ a plánovanou ponukou 14,99 € pri bežnej cene 19,99 €. Nákupné CTA otvára pravdivé oznámenie o pripravovanom predaji; platobný odkaz zatiaľ nebol dodaný.
- **Príprava hry**: návrh zákazníckej sekcie po kúpe, uložený checklist, rola dospelého, samostatné PDF P1–P6 a diplom, náhľady tlačovín, umiestnenie štyroch obálok a oddelených stôp, kontrola nahrávok a spustenie hry. P1 je hotový list; neskoršie podklady sú označené ako pracovné.
- **StoryBoard**: vývojársky priebeh všetkých desiatich etáp, odkaz na Atlas, materiály, pôvodné scény a riešenia, izolované testovanie etáp. Úvod má priamo prehrateľné Pikovo video a dostupný autorský scenár s označením, že doslovný prepis nahrávky ešte treba potvrdiť. Prvá úloha má skutočný náhľad aj text kúpeľňového listu, záznamy a Kvakovo audio s presným textom.

Pôvodné zadania pre text-to-speech neboli dodané. StoryBoard ich vedie oddelene od scenára ako **Čaká na dodanie**; žiadne pokyny, hlas ani nastavenia nie sú vymyslené.

Toto je funkčný statický prototyp týchto troch rozhraní. Platba a serverové overenie nároku po kúpe ešte nie sú pripojené; zákaznícka sekcia ani StoryBoard nemajú samostatnú ochranu prístupu. Existujúce publikum Sites sa nemení. Pred ostrým predajom treba pripojiť nákup a serverom overovaný prístup, nie iba skryť tlačidlá.

Prezentačný obsah je v `site-content.js`, samostatné štýly v `presentation.css`. Herný tok a uloženie postupu zostávajú v `app.js`. Ilustračné fotografie nevydávame za skutočné rodinné testovanie ani presné finálne materiály. Ich pôvod a úplné prompty sú v `assets/IMAGE-SOURCES.md`.

Stiahnuteľné PDF v `assets/printables/` a skutočný náhľad `assets/kvak-sheet-preview.png` možno obnoviť z koreňového HTML/CSS:

```sh
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node scripts/export-printables.cjs
```

Každý export overuje presne jednu A4. `assets/piko-video-poster.png` je náhľadový záber z existujúceho videa; samotné `PicoVideo.mp4` sa nemení.

## Príbeh a hranie

Pixelkovia potajomky žijú v každej domácnosti s mobilom, tabletom, počítačom či televízorom. Piko po veľkom bliknutí stratí spojenie s kamarátmi. Úvod nevysvetľuje príčinu. Kvak zachytí opakujúci sa signál, Iskra objaví skryté značky a Šutko rozpozná priechod uzavretý zvnútra. Lístok po úlohe 4 prečíta varovanie: Ochranné pole nie je pokazené. Kubo nájde bezpečnú návratovú cestu a Ryško po úlohe 6 vysvetlí, že sa pole automaticky preventívne uzavrelo, aby zabránilo prezradeniu ich sveta.

SPOLU je sľub celej partie. SVETLO je spoločný potvrdzovací signál šiestich pripravených schopností, nie násilné otvorenie ochrany. Piko drží spojenie s ľuďmi a vracia sa ako posledný. Vo finále je všetkých sedem doma a Ochranné pole sa vráti do bežného režimu.

Najprv v Príprave hry rozmiestnite štyri obálky a samostatne uzavretú kartu symbolov. Potom hráči otvoria prichádzajúcu videosprávu od Pika a riešia osem úloh. Príbeh sa číta po krátkych dialógových paneloch s tlačidlami Späť / Čítať ďalej. Po prečítaní scény sa zobrazí existujúca úloha; odhalenia a dialógy po vyriešení zostávajú skryté do správnej odpovede. Čas nie je limitovaný. Návrhových 60 minút ostáva pracovným odhadom, dlhší literárny text môže hranie predĺžiť.

Úvod sa po spustení hry otvorí cez celý displej. Každých 4,8 sekundy zaznejú tri jemné cinknutia vytvorené Web Audio API; pri otvorení správy alebo jej zavretí sa zastavia. Zvuk sa nespúšťa na pozadí. Po obnovení stránky môže byť potrebné ťuknúť na „Zapnúť zvuk“. Fullscreen API sa pri ťuknutí používa na celý dokument, aby sa v podporovaných prehliadačoch skryl aj adresný riadok. Režim zostáva zapnutý počas hry. Po obnovení stránky alebo jeho opustení sa dá zapnúť tlačidlom „Celá obrazovka“ na displeji správy. Ostatné zariadenia dostanú dialóg cez celú plochu stránky.

Dodané Pikovo video je v **`assets/PicoVideo.mp4`**; cestu určuje `GAME.video`. Po doplnení súboru treba znovu pripraviť a publikovať statický web. Ťuknutím na notifikáciu sa prehrá video so zvukom, bez prepisu či titulkov prezrádzajúcich úkryt. Prvý hlavolam je porozumieť správe: **Kde je obálka? V kúpeľni.** Túto odpoveď obsahuje len rodičovský návod a Game Master. Video má na telefóne prioritu, prispôsobuje sa dostupnej ploche so zachovaním pomeru strán a jedného rámu. Po prehratí ostane na displeji s označením „Správa od Pika“ a šípkou na opätovné prehratie priamo na obraze. Ťuknutím kdekoľvek na obraz sa prehrá znova; samostatné tlačidlo zostáva dostupné pod videom. Pokračuje sa ručne tlačidlom „Máme obálku“. Počas úloh možno video znova otvoriť cez „Pikova správa“ bez straty postupu. Chýbajúce alebo neprehrateľné video zobrazí chybu bez odhalenia odpovede; pred hrou overte obraz aj zvuk dodaného videa.

Pôvodný úplný autorský scenár úvodného hovoru ostáva v Game Masterovi ako podklad, v hráčskom úvode sa nečíta.

## Kvakova záchranná misia V4

Obálka 1 obsahuje iba celý P1. Deti vystrihnú šesť signálov, otočia ich a zoradia podľa dátumu a presného času. Všetky záznamy sú z rovnakého roka. Po potvrdení používateľom majú tri záznamy spoločný dátum, aby bolo nutné porovnať aj čas:

| Dátum | Čas | Číslica |
| --- | --- | --- |
| 13. 3. | 20:05 | 7 |
| 13. 3. | 20:10 | 4 |
| 13. 3. | 20:15 | 1 |
| 14. 6. | 19:50 | 2 |
| 15. 9. | 08:35 | 9 |
| 15. 12. | 08:40 | 6 |

Na hárku sú premiešané a otočené o 90°, 180° a −90°. Riešenie **741296** je iba tu a v Game Masterovi. Hráčsky list obsahuje príbeh, schopnosti a problém Kvaka, päť krokov, šesť ústrižkov, prázdne políčka na kód a miesto pre budúci QR. Skutočný QR sa nevytvára.

Tlačidlo **Simulovať naskenovanie QR** otvorí samostatnú mobilnú obrazovku obnovy. Má numerickú klávesnicu, kontrolu presne šiestich číslic, opakovateľné pokusy a pôvodné nápovedy. Prechod je oddelený od overenia a možno naň neskôr napojiť QR navigáciu. Správny kód uloží S a zobrazí oficiálneho Pika a Kvaka. Hovorí iba Kvak. Súbor **`assets/KvakMessage.mpeg`** je dodané MPEG audio; `GAME.audio` určuje cestu a `GAME.kvakMessage` presný prepis. Hlas sa spúšťa ručne, možno ho pozastaviť aj neobmedzene opakovať. Pri nedostupnom alebo nepodporovanom audiu sa automaticky otvorí celý prepis. Audio nikdy samo nepresunie hru do ďalšej úlohy.

Príprava pre rodiča:

| Miesto | Obsah |
| --- | --- |
| Kúpeľňa, suchá dostupná polička alebo uteráky | Obálka 1: iba celý P1. Nikdy lieky, čistiace prostriedky, elektrické zariadenia, práčka či sušička. |
| Pri okne na dosah detí | Obálka 2: iba štyri vopred rozstrihané pásiky P2. Okno sa neotvára, na parapet sa nelezie. |
| Nízko pod oknom | Samostatne uzavretý P3: „Úloha 3 – otvoriť po zložení odkazu“. |
| Stôl | Obálka 3: P4 a samostatne uzavretý P5 označený „Úloha 5 – otvoriť po prekladači“. |
| Pod sedadlom dostupnej stoličky | Obálka 4: P6. |

Iskrine pásiky stále skladajú „POD OKNOM / JE LIST / SO SYMBOLMI. / HĽADAJTE NÍZKO.“ Odpoveď OKNO/POD OKNOM zostáva. Oddelené obaly zabránia predčasnému získaniu neskorších stôp. Úlohy 3–8 majú pôvodné riešenia; menia sa iba čísla následných obálok.

## Príbehový model a súbory

- `game-data.js`: jediný zdroj scén. `stages[].story` sú panely pred úlohou, `resolution` sú panely po správnej odpovedi. Panel je pole autorských riadkov, ktoré rozhranie rozlíši na rozprávača, dialóg a svetelný odkaz. `GAME.call` odkazuje na tie isté panely úvodu, neduplikuje samostatný skrátený telefonát. `dramaturgy` je viditeľná iba v Game Masterovi. Finále má samostatnú Pikovu `invitation`.
- `app.js`: displej s videosprávou, čítačka scén, validácia ôsmich úloh, zápisník, mapa, lokálny postup, príprava a kompletný Game Master.
- `atlas.html` + `atlas.css`: samostatná miniknižka. Všetkých 143 odsekov kapitoly Tajný svet Pixelkov a dva úplné literárne odseky každého zo siedmich profilov sú priamo v HTML; na čítanie netreba JavaScript ani uložený postup. Názvoslovie a súvisiaca gramatika boli prispôsobené schválenému názvu Ochranné pole.
- `printables.html` + `signal-print.css`: finálny jednostranný Kvakov P1 vo formáte A4, pôvodné hlavolamy P2–P6 a diplom. Biele/svetlé plochy, tmavomodrý text, obrysy, oficiálny výrez Kvaka a malé akcenty šetria atrament. Význam nespolieha na farbu. Hráčsky odkaz `?sheet=p1` zobrazí a vytlačí iba daný list bez neskorších indícií.
- `styles.css` + `adventure.css`: základné rozloženie a existujúci pixel-art vzhľad vrátane V2 čítačky.
- `assets/pixelkovia-atlas.png`: oficiálny obrazový atlas 4 × 2 políčka, Piko / Kvak / Iskra / Šutko, Lístok / Kubo / Ryško / priechod. Rovnaké CSS výrezy slúžia hre aj literárnym profilom. `assets/pixelkovia-room.png` tvorí titulnú ilustráciu. Nové postavy ani externé referenčné obrázky nepribudli. Podrobnosti sú v `assets/IMAGE-SOURCES.md`.

## Bonusový atlas a Game Master

Hráč dostane CTA **OBJAVIŤ TAJNÝ SVET PIXELKOV** až na úspešnej obrazovke finále. Úvod, hráčska navigácia ani bežné úlohy atlas neodkazujú. Game Master má odkaz kedykoľvek ako zámernú rodičovskú výnimku. Samotné `atlas.html` nie je uzamknuté hrou a dá sa priamo otvoriť alebo zdieľať bez hrania.

Game Master obsahuje úplné autorské scény pred aj po úlohách, úvodnú videosprávu aj pôvodný scenár hovoru, pozvánku, dramaturgiu, odpovede, dve nápovedy ku každej úlohe, tri úvodné rodičovské nápovedy, bezpečnostné pokyny a prechody. Testovanie etapy je dočasné a nemení rodinný postup. Je to interná obrazovka s riešeniami, bez vlastného zabezpečenia.

## Kompatibilita postupu

ID etáp, odpovede úloh 2–8, odmeny S–V–E–T–L–O, SPOLU, SVETLO a kľúč `zahada-v1-progress` zostali zachované. Prvá odpoveď je teraz šesťmiestny kód 741296. Existujúci postup sa obnoví bez vymazania; už splnená stará prvá úloha zostáva splnená a pri návrate zobrazí novú Kvakovu scénu. Rozpracovaná prvá úloha používa nový list P1. Voliteľné `kvakScan` obnoví otvorenú obrazovku zadania kódu. Voliteľné `messageOpened` a `messageWatched` obnovujú úvodnú správu po načítaní stránky; staré uloženia ostávajú použiteľné. Voliteľné `scenePages` si pamätá aktuálny panel; staré uloženia bez tohto poľa začnú aktuálnu scénu od prvého panela. Splnená úloha po obnovení stránky znovu zobrazí svoj dialóg po vyriešení. Zaškrtnutá príprava zostáva uložená samostatne. Bez localStorage hra funguje v pamäti.

## Overenie

Voliteľné testy používajú Playwright mimo projektu:

```sh
npm install --prefix /tmp/pixelkovia-qa playwright
/tmp/pixelkovia-qa/node_modules/.bin/playwright install --with-deps chromium
# V inom termináli: python3 -m http.server 8080
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/prototype.test.cjs
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/presentation.test.cjs
node tests/mission-data.test.cjs
```

Testujú tiež šesťmiestny kód a nesprávne pokusy, simulovaný QR prechod, oficiálnu dvojicu postáv, prehratie/pauzu/opakovanie MPEG aj chýbajúce audio, starú splnenú prvú úlohu, mobilný fullscreen a samostatnú A4 s úspornou farebnou aj čiernobielou tlačou. Testujú celoobrazovkovú prichádzajúcu správu, opakovanie a zastavenie cinkania, dodané video, jeho opakované prehrávanie aj obnovu úvodu, úplný priechod dialógmi aj ôsmimi úlohami, načasovanie zvratu, zlé odpovede, nápovedy, obnovu V1 postupu aj stránkovania, izoláciu GM testov, reset, mobil/desktop, tlačoviny, offline otvorenie a nedostupné úložisko. Atlas sa testuje priamym otvorením bez postupu, aj bez JavaScriptu, vrátane úplnosti textu, siedmich výrezov a dostupnosti CTA až vo finále alebo v GM. Screenshoty a skúšobná tlač smerujú do `/tmp`.

## Publikovanie

Existujúci Site: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site

Atlas: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site/atlas.html

ID zostáva v `.openai/hosting.json`. Trvalý hosting nezávisí od Codespace. Platformové nastavenie prístupu Sites sa vzťahuje na celý web; verejná dostupnosť atlasu bez prihlasovania vyžaduje verejný prístup existujúcej Site. Zmena publika sa vykonáva iba podľa používateľovho rozhodnutia.

Po dokončení zmien sa zdroje commitnú a pushnú výlučne do `origin/main` vrátane commitov vytvorených Sites helperom. Nepoužíva sa force-push.
