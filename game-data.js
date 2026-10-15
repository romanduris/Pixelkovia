/* Príbeh Pixelkov. ID etáp, odpovede a odmeny zachovávajú postup V1. */
window.GAME = {
  "title": "Pixelkovia: Stratený signál",
  "version": 1,
  "audio": null,
  "call": [
    "Haló? Haló! Vidíte ma? Som Piko. Áno, tá modrá postavička na displeji! Som Pixelko. Doteraz ste o nás nevedeli. Dnes potrebujeme váš tím.",
    "Pixelkovia žijú v každej domácnosti, kde je mobil, tablet, počítač alebo televízor. Aj u vás! Máme svoj malý svet medzi svetelnými bodkami obrazoviek. Tichý závoj ho ukrýva, preto nás pri bežnom používaní zariadení nikto nevidí.",
    "Dnes prišlo veľké bliknutie. Tichý závoj prestal fungovať a moji šiesti kamaráti uviazli v chodbičkách medzi signálmi. Sú v bezpečí, ale bez ich schopností náš svet znovu neschováme. Potrebujeme pomoc každého z nich — aj vás.",
    "Kvak pozná signály, Iskra rozsvieti značky, Šutko spevní priechod, Lístok preloží jeho reč, Kubo poskladá cestu a Ryško zapne závoj. Každý má aj jedno písmeno hesla. Papierové stopy som poslal vášmu dospelému pomocníkovi. Začnite v kúpeľni, v suchej obálke 1. Ničoho elektrického sa nedotýkajte.",
    "Počkajte… zachytil som Kvakovo pípnutie! Kód má tri čísla. Spojenie slabne. Nájdite celú partiu a pomôžte nám vrátiť sa do úkrytu. Náš svet sa môže znova schovať, iba keď budeme spo—"
  ],
  "stages": [
    {
      "id": "intro",
      "title": "Volá vám Piko",
      "label": "Úvod",
      "icon": "☎",
      "time": [
        4,
        0,
        0
      ],
      "story": "Na displeji zabliká modrá tvár. „Som Piko, jeden z Pixelkov. Žijeme v každej domácnosti s mobilom, tabletom, počítačom či televízorom. Aj v tej vašej. Len ste o nás nevedeli… až do dnes.“ Ich svet medzi svetelnými bodkami obrazoviek ukrýva Tichý závoj. Pri veľkom bliknutí sa pokazil a šiesti kamaráti uviazli v chodbičkách medzi signálmi. Každý ovláda inú schopnosť, bez ktorej závoj neobnovia. Piko sa preto po prvý raz ukáže ľudskému tímu. Dospelý pomocník už rozmiestnil jeho papierové stopy. Spojenie zapraská. Zostane správa: „Kúpeľňa. Obálka 1. Nájdite Kvaka.“",
      "action": "Spoločne prijmite simulovaný hovor od Pika. Po prerušení spojenia vezmite suchú obálku 1 v kúpeľni.",
      "task": "Prečítajte celý telefonát. Zapamätajte si prvé miesto: kúpeľňa. Skutočné telefónne číslo nepotrebujete.",
      "materials": "Obálka 1 v kúpeľni; telefón s otvorenou hrou.",
      "mobile": "Prijať hovor → textový rozhovor po častiach → prerušené spojenie → prvá úloha.",
      "solution": "Kúpeľňa. Úvod nepotrebuje kód.",
      "hints": [
        "Piko pomenoval miestnosť s umývadlom."
      ],
      "parent": "Hovor spustite až po rozmiestnení materiálov. Zobrazí sa len simulácia; nikto skutočne nevolá. Audio je voliteľné a zatiaľ nie je dodané.",
      "transition": "Pikov signál zoslabol. Nájdite Kvaka — bez jeho sluchu ostatné linky nespojíte."
    },
    {
      "id": "envelope",
      "title": "Kvakovo stratené pípnutie",
      "label": "Úloha 1",
      "icon": "✉",
      "time": [
        1,
        2,
        3
      ],
      "reward": "S",
      "answer": [
        "314"
      ],
      "placeholder": "Trojmiestny kód",
      "story": "Na obálke je malá pixelová hviezda. Vnútri je Pikov list: „Za vašimi obrazovkami býva naša partia už dávno. Kvak rozozná správny signál aj v najväčšom šume. Bez neho nedokážeme spojiť ostatných.“ Tri jeho pípnutia sa pri veľkom bliknutí premiešali. Zoraďte ich podľa času a obnovíte prvý kontakt. Pod listom sú štyri pásiky odkazu; odložte si ich. Kvak čaká na správny signál.",
      "action": "Vezmite obálku 1 v kúpeľni. Vyberte tri záznamy pípnutí a štyri pásiky; tie budete potrebovať v ďalšej úlohe.",
      "task": "Usporiadajte tri záznamy podľa času od najskoršieho. Číslice pri nich vytvoria trojmiestny kód Kvakovho kontaktu.",
      "materials": "P1: Pikov list a záznamy „09:20 → 4“, „09:00 → 3“, „09:10 → 1“. P2: štyri vopred rozstrihané pásiky.",
      "mobile": "Kód 314 obnoví kontakt s Kvakom a uloží jeho písmeno S. Kvak čaká na spoločný návrat vo finále.",
      "solution": "09:00, 09:10, 09:20 → 3, 1, 4 → 314.",
      "hints": [
        "Začnite najskorším časom, nie prvým riadkom.",
        "Najprv 09:00, potom 09:10 a nakoniec 09:20."
      ],
      "parent": "Obálku položte na suchú dostupnú poličku. Neumiestňujte ju pri liekoch, čistiacich prostriedkoch ani vode.",
      "transition": "Píp! „Som tu! Moje písmeno je S,“ ozve sa Kvak. „Zachytil som Iskru. Jej adresu nájdete na pásikoch!“",
      "character": "kvak"
    },
    {
      "id": "document",
      "title": "Iskrin roztrhaný odkaz",
      "label": "Úloha 2",
      "icon": "▤",
      "time": [
        1,
        2,
        4
      ],
      "reward": "V",
      "answer": [
        "OKNO",
        "POD OKNOM"
      ],
      "placeholder": "Miesto z dokumentu",
      "story": "V prvom okienku sa ozve Kvak. „Počujem Iskru! Keď sa v našich skrytých chodbičkách stratí svetlo, vie rozsvietiť orientačné značky. Teraz ich budeme potrebovať všetky.“ Jej adresu zachytil na štyroch papierových pásikoch. Papier totiž veľké bliknutie nepomieša. Čísla v rohoch určujú poradie. Keď odkaz zložíte, Kvak pošle vaše volanie na správne miesto a Iskra môže rozžiariť prvý úsek cesty.",
      "action": "Na stole poskladajte štyri pásiky z obálky 1 podľa čísiel v ich rohoch. Môžete ich spojiť papierovou páskou.",
      "task": "Prečítajte zloženú vetu „POD OKNOM / JE LIST / SO SYMBOLMI. / HĽADAJTE NÍZKO.“ Zadajte hlavné miesto, ku ktorému vás veta posiela.",
      "materials": "P2: pásiky 1–4, pripravené rodičom. P3: karta symbolov prilepená zvnútra pod parapetom.",
      "mobile": "Zadanie názvu miesta odomkne druhé písmeno a pokyn vyzdvihnúť kartu.",
      "solution": "OKNO; uznáva sa aj POD OKNOM.",
      "hints": [
        "Malé čísla určujú poradie pásikov.",
        "Veta sa začína slovami POD OKNOM."
      ],
      "parent": "Kartu dajte nízko a na dosah. Okno sa neotvára a na parapet sa nelezie. Ak je miesto nevhodné, kartu položte na podlahu pod okno.",
      "transition": "„Moje písmeno je V!“ Iskra rozsvieti značky na ceste. „Pod oknom čakajú Šutkove symboly.“",
      "character": "iskra"
    },
    {
      "id": "symbols",
      "title": "Šutkove kamenné symboly",
      "label": "Úloha 3",
      "icon": "△",
      "time": [
        1,
        2,
        4
      ],
      "reward": "E",
      "answer": [
        "9"
      ],
      "placeholder": "Výsledné číslo",
      "story": "Pod oknom čaká karta s tromi tvarmi. Iskra na ne posvieti cez obnovenú linku. „Šutko značkami označuje pevné body priechodu,“ vysvetľuje Piko. „Namiesto čísiel používa tvary. Každý má vždy rovnakú hodnotu.“ Šutko dokáže udržať priechod pevný, aby po ňom mohla prejsť celá partia. Jeho kontakt však odomkne iba správny súčet. Na spodku karty je aj poznámka o papierovom prekladači a nastavení D → A. Tú budete potrebovať ďalej.",
      "action": "Vezmite kartu symbolov spod okna. Ceruzkou si poznačte hodnotu každého tvaru.",
      "task": "Na karte platí △ + △ = 6, ○ + △ = 5 a □ + ○ = 6. Koľko je △ + ○ + □?",
      "materials": "P3: tri rovnice a otázka. P4: dva šifrovacie kruhy a zakódovaný odkaz, pripravené na stole v obálke 2.",
      "mobile": "Overenie jedného čísla; potom pokyn otvoriť obálku 2 na stole.",
      "solution": "△ = 3, ○ = 2, □ = 4. Súčet je 9.",
      "hints": [
        "Dva rovnaké trojuholníky dávajú 6. Jeden má hodnotu 3.",
        "Kruh má hodnotu 2 a štvorec 4. Sčítajte 3 + 2 + 4."
      ],
      "parent": "Dovoľte deťom kresliť si tvary alebo nahradiť ich predmetmi. Obálka 2 na stole obsahuje P4 a P5, bludisko zatiaľ nechajte otočené.",
      "transition": "„Moje písmeno je E.“ Šutko spevní priechod. „Teraz potrebujeme Lístka a jeho preklad signálov.“",
      "character": "sutko"
    },
    {
      "id": "cipher",
      "title": "Lístkov šifrovací kruh",
      "label": "Úloha 4",
      "icon": "◉",
      "time": [
        1,
        2,
        5
      ],
      "reward": "T",
      "answer": [
        "STOL",
        "STÔL"
      ],
      "placeholder": "Rozlúštené slovo",
      "story": "Šutko už drží spojenie pevne. V obálke 2 na stole sú dva papierové kruhy. „Lístok rozumie reči signálov,“ povie Piko. „Bez jeho prekladu by sme nevedeli, čo od nás Tichý závoj žiada. Teraz vysiela v posunutej abecede.“ Na vonkajšom kruhu je správa, na vnútornom jej význam. Nastavte vonkajšie D oproti vnútornému A a prečítajte VWRO. Ktoré miesto ukrýva ďalšie spojenie?",
      "action": "Vystrihnite oba kruhy P4. Položte menší na väčší a nastavte D nad A. Otáčajte ich okolo spoločného stredu; stačí ich pridržať prstom.",
      "task": "Použite abecedu A–Z bez diakritiky. Každé vonkajšie písmeno VWRO prečítajte ako zodpovedajúce vnútorné písmeno. Kam vás odkaz posiela?",
      "materials": "P4: kruhy s 26 písmenami A–Z, značka D → A a odkaz VWRO. Detské nožnice; spinka je voliteľná.",
      "mobile": "Slovná odpoveď. Po úspechu sprístupní Kubov plán signálu na stole.",
      "solution": "Posun −3: V → S, W → T, R → O, O → L. Výsledok STOL.",
      "hints": [
        "Vonkajšie D musí byť oproti vnútornému A. Vonkajšie písmená teda posuňte o tri dozadu.",
        "V sa prečíta ako S, W ako T. Pokračujte rovnako."
      ],
      "parent": "Vystrihujú deti pod dohľadom. Nie je nutné prepichovať papier. Tlačené kruhy majú rovnaké uhly, aby sa dali skutočne použiť.",
      "transition": "„Moje písmeno je T!“ Lístok preloží pokyn k jadru. „Na stole otočte Kubov plán. Bez staviteľa sa ďalej nedostaneme.“",
      "character": "listok"
    },
    {
      "id": "maze",
      "title": "Kubova cesta signálom",
      "label": "Úloha 5",
      "icon": "⌁",
      "time": [
        1,
        1,
        4
      ],
      "reward": "L",
      "answer": [
        "246"
      ],
      "placeholder": "Tri číslice z cesty",
      "story": "Lístok preložil prvý pokyn: „Spojte cestu k jadru.“ Tú vie postaviť iba Kubo. Na liste P5 zanechal plán siete, ktorou putujú Pixelkovia medzi obrazovkami vašej domácnosti. Niektoré odbočky sú slepé, jedna vedie k jadru spojenia. „Nič netreba rozoberať,“ uistí vás Piko. „Choďte len prstom po papieri.“ Kubo po obnovení kontaktu podľa plánu poskladá návratovú cestu. Pod ním je aj odkaz pre Ryška: „Nočný pokoj. Denné svetlo. Večerná hviezda.“",
      "action": "Otočte P5 z obálky 2. Prstom alebo ceruzkou nájdite cestu papierovým plánom od šípky VSTUP ku kruhu JADRO.",
      "task": "Sledujte spojité potrubie až k jadru. Odbočky končia bez výstupu. Prečítajte tri čísla na úspešnej ceste v poradí od vstupu.",
      "materials": "P5: vetviaci sa plán s číslami 2, 4, 6 na hlavnej trase a 8, 1 v slepých vetvách; poznámka o noci, dni a hviezde.",
      "mobile": "Trojmiestny kód otvorí digitálny ovládací panel.",
      "solution": "Jediná cesta k jadru vedie cez 2 → 4 → 6, teda 246.",
      "hints": [
        "Slepé odbočky nepatria do kódu. Môžete začať aj pri jadre a ísť naspäť.",
        "Na správnej ceste sú čísla 2, 4 a 6."
      ],
      "parent": "Ide o jednoduchý pracovný potrubný plán, nie finálne ilustrované bludisko. Mechanika aj tlač sú funkčné; obtiažnosť treba otestovať.",
      "transition": "„Moje písmeno je L!“ Kubo poskladá návratovú cestu. „Zostáva Ryško. Jeho pozdrav nájdete pod plánom.“",
      "character": "kubo"
    },
    {
      "id": "digital",
      "title": "Ryškove tri svetielka",
      "label": "Úloha 6",
      "icon": "☾",
      "time": [
        2,
        0,
        5
      ],
      "reward": "O",
      "answer": [
        "moon,sun,star"
      ],
      "digital": true,
      "story": "Kubo postavil cestu a na telefóne sa rozsvietia tri symboly. Za nimi prebleskne oranžový chvost. „Ryško stráži Tichý závoj,“ vysvetlí Piko. „Vie ho znovu zapnúť, aby sme sa mohli ukryť medzi svetelnými bodkami a ostatní ľudia nás nevideli. Musíme mu však poslať správny pozdrav.“ Použite poznámku z Kubovho plánu. Celá partia čaká na posledný kontakt.",
      "action": "Položte pred seba poznámku z plánu P5. Teraz rieši celý tím spolu na telefóne.",
      "task": "Stlačte symboly v poradí podľa poznámky: „Nočný pokoj. Denné svetlo. Večerná hviezda.“ Potom overte sekvenciu. Výber sa dá vymazať.",
      "materials": "Poznámka na P5; nové materiály netreba.",
      "mobile": "Tri tlačidlá mesiac, slnko a hviezda; viditeľná sekvencia, vymazanie a overenie.",
      "solution": "Mesiac → slnko → hviezda. Ryško odhalí ochranný režim: na návrat a obnovu Tichého závoja potrebujú celú partiu.",
      "hints": [
        "Nočný pokoj predstavuje mesiac. Čo svieti cez deň?",
        "Poradie je mesiac, slnko, hviezda."
      ],
      "parent": "Po úspechu prečítajte Ryškovo odhalenie. Všetci kamaráti sú v bezpečí; na cestu domov čakajú až do finále.",
      "transition": "Ryško odovzdáva O. Všetky schopnosti sú pripravené. Obnovte ich úkryt spoločne.",
      "character": "rysko",
      "reveal": "Ryško sa objaví na paneli. „Moje písmeno je O! Už tomu rozumiem. Pri veľkom bliknutí sa priechod prepol do ochranného režimu. Cesta nás pustí späť, až keď budú pripravení všetci. Potom zapnem Tichý závoj a ostatní ľudia náš svet znovu neuvidia.“ Piko prikývne. „Kvak našiel signál, Iskra rozsvietila značky, Šutko drží priechod, Lístok preložil pokyny a Kubo postavil cestu. Ryško nás ukryje. Zostáva náš spoločný sľub a heslo. Posledná obálka je pod stoličkou pri stole.“"
    },
    {
      "id": "search",
      "title": "Správa pre celú partiu",
      "label": "Úloha 7",
      "icon": "⌕",
      "time": [
        1,
        4,
        2
      ],
      "reward": "↗",
      "answer": [
        "SPOLU"
      ],
      "placeholder": "Slovo z piatich riadkov",
      "story": "Všetkých šesť tvárí je už na displeji. Kvak počúva, Iskra svieti na značky, Šutko drží priechod, Lístok prekladá, Kubo stavia a Ryško chystá závoj. Ešte im chýba spoločný pokyn. „Náš domov zostane skrytý iba vtedy, keď nikto neostane na druhej strane,“ povie Piko. „Pod sedadlom jednej zo stoličiek pri stole je obálka 3 s naším sľubom. Začiatky riadkov vám prezradia, ako sa vraciame do úkrytu.“ Kartu so šípkou si nechajte na finále.",
      "action": "Nájdite obálku 3 pod sedadlom dostupnej stoličky pri stole. Vyberte sľub Pixelkov a kartu poradia.",
      "task": "Prečítajte prvé písmeno každého z piatich riadkov zhora nadol. Získané slovo potvrďte v telefóne. Kartu poradia si odložte na finále.",
      "materials": "P6: päť viet začínajúcich S, P, O, L, U a karta „Písmená úloh 1 → 2 → 3 → 4 → 5 → 6“; obálka 3.",
      "mobile": "Overí slovo SPOLU a uloží kartu poradia do zápisníka.",
      "solution": "Prvé písmená viet tvoria SPOLU. Karta určuje poradie šiestich nazbieraných písmen podľa úloh.",
      "hints": [
        "Piko zdôraznil začiatky. Pozrite sa na prvé písmeno každého riadka.",
        "Písmená sú S, P, O, L, U."
      ],
      "parent": "Obálku prilepte papierovou páskou na dosah. Dieťa nemá liezť pod ťažký nábytok ani ho presúvať. Pomôžte so zložením obálky.",
      "transition": "SPOLU. Len tak sa všetci vrátia a Tichý závoj môže znovu ukryť ich svet."
    },
    {
      "id": "code",
      "title": "Heslo k návratu domov",
      "label": "Úloha 8",
      "icon": "⚡",
      "time": [
        1,
        0,
        4
      ],
      "reward": "✓",
      "answer": [
        "SVETLO"
      ],
      "placeholder": "Šesťpísmenové heslo",
      "story": "Svetelný priechod aj Tichý závoj čakajú na spoločné heslo. „Teraz potrebuje partia každého z nás,“ povie Piko. Kvak odovzdá S, Iskra V, Šutko E, Lístok T, Kubo L a Ryško O. Karta z poslednej obálky určuje poradie. Vaše heslo spojí ich schopnosti: otvorí cestu domov a umožní Ryškovi za posledným kamarátom znovu ukryť ich svet. Šesť písmen, šesť nenahraditeľných pomocníkov. Ktoré slovo rozžiari priechod?",
      "action": "Rozložte kartu poradia. Každý člen tímu môže prečítať jednu zo získaných indícií. Nájdete ich aj v hernom zápisníku.",
      "task": "Usporiadajte šesť písmen podľa úloh 1 až 6. Odošlite návratové heslo, ktoré spojí schopnosti celej partie a obnoví ich úkryt.",
      "materials": "Karta poradia P6 a šesť písmen v digitálnom zápisníku; voliteľne papier a ceruzka.",
      "mobile": "Heslo SVETLO spojí schopnosti Pixelkov, otvorí cestu domov a spustí obnovu Tichého závoja vo finále.",
      "solution": "Úlohy 1–6 dali S, V, E, T, L, O → SVETLO.",
      "hints": [
        "Použite len šesť písmen. Šípka a fajka nie sú súčasťou hesla.",
        "V poradí úloh čítajte S – V – E – T – L – O."
      ],
      "parent": "Nechajte heslo vysloviť celý tím. Nie je tu skutočný časový limit ani riziko straty hry.",
      "transition": "SVETLO! Každý Pixelko sa púšťa do svojej časti úlohy. Priechod sa otvára a ich úkryt sa obnovuje."
    },
    {
      "id": "finale",
      "title": "Tajomstvo zostáva doma",
      "label": "Finále",
      "icon": "✧",
      "time": [
        3,
        0,
        0
      ],
      "story": "Kvak v šume rozozná domáci signál. Iskra rozsvieti značky, Šutko spevní priechod, Lístok prečíta jeho pokyny a Kubo poskladá posledný diel cesty. Jeden po druhom prejdú späť. Ryško počká na posledného kamaráta a zapne Tichý závoj. Piko spojí všetky linky. Hotovo! Na displeji zostane obyčajná obrazovka. „Bez jediného z nás by to nešlo. A bez vás tiež nie,“ ozve sa ešte Piko. „Žili sme u vás už pred dneškom. A budeme tu aj zajtra — schovaní medzi svetelnými bodkami, tak ako Pixelkovia v každej domácnosti s mobilom, tabletom, počítačom či televízorom.“ Šesť kamarátov zamáva a posledné svetielko zhasne. Ich svet je opäť ukrytý pred ostatnými. Váš tím teraz pozná jeho tajomstvo: aj ten najmenší Pixelko má schopnosť, ktorú nikto iný nenahradí.",
      "action": "Dajte si tímové plácnutie. Každý môže povedať, ktorá schopnosť Pixelkov pomohla partii a čím prispel on sám.",
      "task": "Všetkých osem úloh je splnených. Pixelkovia sú spolu a ich svet je znovu ukrytý. Pomenujte svoj tím a povedzte si, čím pomohol každý z vás.",
      "materials": "Voliteľný diplom záchrancov Pixelkov na tlačovej stránke. Žiadne ďalšie pomôcky netreba.",
      "mobile": "Finále obnoví skrytý svet Pixelkov; zostáva úplná mapa, zápisník a možnosť novej hry.",
      "solution": "Úspech tímu. Hra nemá prehratý koniec.",
      "hints": [
        "Každý z vás pomohol iným spôsobom."
      ],
      "parent": "Nechajte každého pomenovať svoj prínos. Tajomstvo sa týka rozprávkového sveta Pixelkov; hra sa končí spoločne s dospelým pomocníkom.",
      "transition": "Obrazovky vyzerajú ako vždy. Vy už však viete, kto sa za ich svetielkami ukrýva."
    }
  ],
  "characters": [
    {
      "id": "piko",
      "name": "Piko",
      "role": "Váš sprievodca",
      "description": "Modrý spojár vášho skrytého sveta. Drží linku a spojí schopnosti celej partie.",
      "tile": 0
    },
    {
      "id": "kvak",
      "name": "Kvak",
      "role": "Kačací prieskumník",
      "description": "Rozozná správny signál aj v najväčšom šume. Bez neho sa partia nepočuje.",
      "tile": 1
    },
    {
      "id": "iskra",
      "name": "Iskra",
      "role": "Malý plamienok",
      "description": "Rozsvieti zhasnuté značky v chodbičkách. Ukáže ostatným, kadiaľ ísť.",
      "tile": 2
    },
    {
      "id": "sutko",
      "name": "Šutko",
      "role": "Pokojný kamienok",
      "description": "Udrží priechod pevný, aby ním bezpečne prešiel aj posledný kamarát.",
      "tile": 3
    },
    {
      "id": "listok",
      "name": "Lístok",
      "role": "Zelený objaviteľ",
      "description": "Rozumie reči signálov. Preloží pokyny, ktorým ostatní nerozumejú.",
      "tile": 4
    },
    {
      "id": "kubo",
      "name": "Kubo",
      "role": "Kockatý staviteľ",
      "description": "Z roztrúsených dielikov poskladá cestu medzi obrazovkami. Aj cestu domov.",
      "tile": 5
    },
    {
      "id": "rysko",
      "name": "Ryško",
      "role": "Odvážna červená panda",
      "description": "Stráži Tichý závoj. Keď sa vrátia všetci, znovu ukryje ich svet pred ľuďmi.",
      "tile": 6
    }
  ]
};
