# Pixelkovia: Stratený signál V2 + Tajný atlas

Slovenská rodinná hra v domácnosti a samostatná ilustrovaná miniknižka. Statické HTML/CSS/JS, bez frameworku a aplikačných účtov. Literárnym zdrojom je úplný autorský dokument GAME STUDIO V2 dodaný používateľom.

## Spustenie a build

Otvorte `index.html` alebo `atlas.html` priamo v prehliadači. Obe stránky fungujú aj bez siete. Pre HTTP náhľad spustite `python3 -m http.server 8080` v koreňovom priečinku.

Nasadzovaný výstup pripraví `node scripts/prepare-static.mjs`. Kopíruje hlavnú stránku, atlas, tlačoviny, CSS, JavaScript aj `assets/` do ignorovaného `dist/`. Upravujte koreňové zdroje, nie `dist/`.

## Príbeh a hranie

Pixelkovia potajomky žijú v každej domácnosti s mobilom, tabletom, počítačom či televízorom. Piko po veľkom bliknutí stratí spojenie s kamarátmi. Úvod nevysvetľuje príčinu. Kvak zachytí opakujúci sa signál, Iskra objaví skryté značky a Šutko rozpozná priechod uzavretý zvnútra. Lístok po úlohe 4 prečíta varovanie: Ochranné pole nie je pokazené. Kubo nájde bezpečnú návratovú cestu a Ryško po úlohe 6 vysvetlí, že sa pole automaticky preventívne uzavrelo, aby zabránilo prezradeniu ich sveta.

SPOLU je sľub celej partie. SVETLO je spoločný potvrdzovací signál šiestich pripravených schopností, nie násilné otvorenie ochrany. Piko drží spojenie s ľuďmi a vracia sa ako posledný. Vo finále je všetkých sedem doma a Ochranné pole sa vráti do bežného režimu.

Najprv v Príprave hry rozmiestnite tri obálky a kartu symbolov. Potom hráči otvoria prichádzajúcu videosprávu od Pika a riešia osem úloh. Príbeh sa číta po krátkych dialógových paneloch s tlačidlami Späť / Čítať ďalej. Po prečítaní scény sa zobrazí existujúca úloha; odhalenia a dialógy po vyriešení zostávajú skryté do správnej odpovede. Čas nie je limitovaný. Návrhových 60 minút ostáva pracovným odhadom, dlhší literárny text môže hranie predĺžiť.

Úvod sa po spustení hry otvorí cez celý displej. Každých 4,8 sekundy zaznejú tri jemné cinknutia vytvorené Web Audio API; pri otvorení správy alebo jej zavretí sa zastavia. Zvuk sa nespúšťa na pozadí. Po obnovení stránky môže byť potrebné ťuknúť na „Zapnúť zvuk“. Fullscreen API sa pri ťuknutí používa na celý dokument, aby sa v podporovaných prehliadačoch skryl aj adresný riadok. Režim zostáva zapnutý počas hry. Po obnovení stránky alebo jeho opustení sa dá zapnúť tlačidlom „Celá obrazovka“ na displeji správy. Ostatné zariadenia dostanú dialóg cez celú plochu stránky.

Dodané Pikovo video je v **`assets/PicoVideo.mp4`**; cestu určuje `GAME.video`. Po doplnení súboru treba znovu pripraviť a publikovať statický web. Ťuknutím na notifikáciu sa prehrá video so zvukom, bez prepisu či titulkov prezrádzajúcich úkryt. Prvý hlavolam je porozumieť správe: **Kde je obálka? V kúpeľni.** Túto odpoveď obsahuje len rodičovský návod a Game Master. Video má na telefóne prioritu, prispôsobuje sa dostupnej ploche so zachovaním pomeru strán a jedného rámu. Po prehratí ostane na displeji s označením „Správa od Pika“ a šípkou na opätovné prehratie priamo na obraze. Ťuknutím kdekoľvek na obraz sa prehrá znova; samostatné tlačidlo zostáva dostupné pod videom. Pokračuje sa ručne tlačidlom „Máme obálku“. Počas úloh možno video znova otvoriť cez „Pikova správa“ bez straty postupu. Chýbajúce alebo neprehrateľné video zobrazí chybu bez odhalenia odpovede; pred hrou overte obraz aj zvuk dodaného videa.

Pôvodný úplný autorský scenár úvodného hovoru ostáva v Game Masterovi ako podklad, v hráčskom úvode sa nečíta.

## Príbehový model a súbory

- `game-data.js`: jediný zdroj scén. `stages[].story` sú panely pred úlohou, `resolution` sú panely po správnej odpovedi. Panel je pole autorských riadkov, ktoré rozhranie rozlíši na rozprávača, dialóg a svetelný odkaz. `GAME.call` odkazuje na tie isté panely úvodu, neduplikuje samostatný skrátený telefonát. `dramaturgy` je viditeľná iba v Game Masterovi. Finále má samostatnú Pikovu `invitation`.
- `app.js`: displej s videosprávou, čítačka scén, validácia ôsmich úloh, zápisník, mapa, lokálny postup, príprava a kompletný Game Master.
- `atlas.html` + `atlas.css`: samostatná miniknižka. Všetkých 143 odsekov kapitoly Tajný svet Pixelkov a dva úplné literárne odseky každého zo siedmich profilov sú priamo v HTML; na čítanie netreba JavaScript ani uložený postup. Názvoslovie a súvisiaca gramatika boli prispôsobené schválenému názvu Ochranné pole.
- `printables.html`: pôvodné P1–P6 a diplom. Polohy, číselné záznamy, papierové pásiky, rovnice, šifrovacie kruhy, bludisko a akrostich zostávajú hrateľné; sprievodné texty už neprezrádzajú starú príčinu.
- `styles.css` + `adventure.css`: základné rozloženie a existujúci pixel-art vzhľad vrátane V2 čítačky.
- `assets/pixelkovia-atlas.png`: oficiálny obrazový atlas 4 × 2 políčka, Piko / Kvak / Iskra / Šutko, Lístok / Kubo / Ryško / priechod. Rovnaké CSS výrezy slúžia hre aj literárnym profilom. `assets/pixelkovia-room.png` tvorí titulnú ilustráciu. Nové postavy ani externé referenčné obrázky nepribudli. Podrobnosti sú v `assets/IMAGE-SOURCES.md`.

## Bonusový atlas a Game Master

Hráč dostane CTA **OBJAVIŤ TAJNÝ SVET PIXELKOV** až na úspešnej obrazovke finále. Úvod, hráčska navigácia ani bežné úlohy atlas neodkazujú. Game Master má odkaz kedykoľvek ako zámernú rodičovskú výnimku. Samotné `atlas.html` nie je uzamknuté hrou a dá sa priamo otvoriť alebo zdieľať bez hrania.

Game Master obsahuje úplné autorské scény pred aj po úlohách, úvodnú videosprávu aj pôvodný scenár hovoru, pozvánku, dramaturgiu, odpovede, dve nápovedy ku každej úlohe, bezpečnostné pokyny a prechody. Testovanie etapy je dočasné a nemení rodinný postup. Je to interná obrazovka s riešeniami, bez vlastného zabezpečenia.

## Kompatibilita postupu

ID etáp, osem odpovedí, odmeny S–V–E–T–L–O, SPOLU, SVETLO a kľúč `zahada-v1-progress` zostali zachované. Existujúci postup sa obnoví bez migrácie alebo vymazania. Voliteľné `messageOpened` a `messageWatched` obnovujú úvodnú správu po načítaní stránky; staré uloženia ostávajú použiteľné. Voliteľné `scenePages` si pamätá aktuálny panel; staré uloženia bez tohto poľa začnú aktuálnu scénu od prvého panela. Splnená úloha po obnovení stránky znovu zobrazí svoj dialóg po vyriešení. Zaškrtnutá príprava zostáva uložená samostatne. Bez localStorage hra funguje v pamäti.

## Overenie

Voliteľné testy používajú Playwright mimo projektu:

```sh
npm install --prefix /tmp/pixelkovia-qa playwright
/tmp/pixelkovia-qa/node_modules/.bin/playwright install --with-deps chromium
# V inom termináli: python3 -m http.server 8080
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node tests/prototype.test.cjs
```

Testujú celoobrazovkovú prichádzajúcu správu, opakovanie a zastavenie cinkania, dodané video, jeho opakované prehrávanie aj obnovu úvodu, úplný priechod dialógmi aj ôsmimi úlohami, načasovanie zvratu, zlé odpovede, nápovedy, obnovu V1 postupu aj stránkovania, izoláciu GM testov, reset, mobil/desktop, tlačoviny, offline otvorenie a nedostupné úložisko. Atlas sa testuje priamym otvorením bez postupu, aj bez JavaScriptu, vrátane úplnosti textu, siedmich výrezov a dostupnosti CTA až vo finále alebo v GM. Screenshoty a skúšobná tlač smerujú do `/tmp`.

## Publikovanie

Existujúci Site: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site

Atlas: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site/atlas.html

ID zostáva v `.openai/hosting.json`. Trvalý hosting nezávisí od Codespace. Platformové nastavenie prístupu Sites sa vzťahuje na celý web; verejná dostupnosť atlasu bez prihlasovania vyžaduje verejný prístup existujúcej Site. Zmena publika sa vykonáva iba podľa používateľovho rozhodnutia.

Po dokončení zmien sa zdroje commitnú a pushnú výlučne do `origin/main` vrátane commitov vytvorených Sites helperom. Nepoužíva sa force-push.
