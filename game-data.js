/* Pixelkovia V4. Zachované ID etáp a kompatibilita uloženého postupu. */
window.GAME = {
  "title": "Pixelkovia: Stratený signál",
  "version": 4,
  "audio": "assets/KvakMessage.mpeg",
  "video": "assets/PicoVideo.mp4",
  "stages": [
    {
      "id": "intro",
      "title": "Správa, ktorá nemala prísť",
      "label": "Úvod",
      "icon": "✉",
      "time": [
        4,
        0,
        0
      ],
      "story": [
        [
          "Po prijatí hovoru sa v strede obrazovky rozsvietia dve malé modré oči.",
          "„Haló? Počujete ma?“",
          "Ozve sa zašušťanie.",
          "„Halóóó! Ak ma počujete, skúste…“",
          "Modrá postavička sa nakloní bližšie.",
          "„Počkajte! Vy ma naozaj vidíte?“",
          "Na chvíľu zostane úplne ticho.",
          "„To je neuveriteľné. Ono to funguje!“",
          "Postavička sa rýchlo poobzerá, akoby kontrolovala, či ju niekto nesleduje.",
          "„Volám sa Piko. A… no… asi vám práve musím povedať jedno dosť veľké tajomstvo.“",
          "Nervózne sa usmeje."
        ],
        [
          "„Nie som človek. Som Pixelko.“",
          "„My Pixelkovia sme veľmi maličkí. Takí maličkí, že by ste nás nevideli ani na špičke ceruzky. Bývame v skrytých svetelných zákutiach obrazoviek. V mobiloch, počítačoch, tabletoch aj televízoroch.“",
          "Piko si povzdychne.",
          "„Áno. To znamená, že aj u vás doma.“",
          "Vtom obrazovka silno zapraská.",
          "Pikova tvár sa rozpadne na farebné štvorčeky a znovu poskladá.",
          "„Jaj! Nemáme veľa času.“",
          "Jeho hlas zrazu zvážnie."
        ],
        [
          "„Dnes ráno sa stalo niečo veľmi zvláštne. Všetko na okamih zablikalo. Naše cesty sa roztriasli a potom… zmizli.“",
          "„Pokúšal som sa zavolať svojim kamarátom, ale nikto neodpovedá.“",
          "Na okamih sklopí oči.",
          "„A ja neviem, čo sa s nimi stalo.“",
          "Niekde v pozadí zaznie slabé pípnutie.",
          "Piko sa prudko otočí.",
          "„Počkajte. To ste počuli?“",
          "Ďalšie pípnutie.",
          "„To by mohol byť Kvak! On dokáže rozoznať aj ten najslabší signál.“",
          "Piko sa priblíži k obrazovke."
        ],
        [
          "„Počúvajte ma pozorne. Váš dospelý pomocník pripravil niekoľko papierových stôp podľa našich záložných plánov. Možno nám pomôžu obnoviť spojenie.“",
          "„Prvú nájdete v kúpeľni. V suchej obálke s číslom jeden. Nič nerozoberajte ani sa nedotýkajte elektrických zariadení. Potrebujeme len papierové stopy.“",
          "Obrazovka začne blikať.",
          "„Prosím, nájdite Kvaka. On možno vie, čo sa stalo.“",
          "„A ešte jedna vec…“",
          "Piko sa odmlčí.",
          "„Pixelkovia sa ľuďom nikdy neukazujú. Nikdy.“"
        ],
        [
          "Pozrie sa priamo na hráčov.",
          "„Ale ja už neviem, koho iného požiadať o pomoc.“",
          "Spojenie zapraská.",
          "„Kúpeľňa… obálka jedna… prosím, rýchlo…“"
        ]
      ],
      "action": "Otvorte Pikovu videosprávu. Z jej horšie zrozumiteľného zvuku zistite, kde máte hľadať obálku 1.",
      "task": "Rozlúštite Pikovu videosprávu. Môžete si ju púšťať opakovane, až kým nezistíte, kde je obálka.",
      "materials": "Obálka 1 v kúpeľni; telefón s otvorenou hrou.",
      "mobile": "Celoobrazovkový displej → tri cinknutia každých pár sekúnd → otvorenie videa ťuknutím → opakované prehrávanie → Máme obálku.",
      "solution": "Kde je obálka? V kúpeľni. Odpoveď prezradí iba zvuk videosprávy; hráčsky displej ju nevypisuje.",
      "hints": [
        "Skúste si Pikovu správu vypočuť ešte raz.",
        "Počúvajte najmä to, čo hovorí tesne pred prerušením spojenia.",
        "Piko spomína kúpeľňu."
      ],
      "parent": "Obálku 1 iba s celým pracovným listom P1 ukryte v kúpeľni medzi uterákmi, do skrinky s uterákmi alebo na suchú dostupnú poličku. Nie medzi lieky a čistiace prostriedky, k elektrickým zariadeniam, do práčky ani sušičky. Miesto deťom prezradí iba zvuk Pikovej správy. Nápovedy ponúkajte postupne.",
      "transition": "Pikov signál zoslabol. Nájdite Kvaka — bez jeho sluchu ostatné linky nespojíte.",
      "dramaturgy": [
        "Úvod musí okamžite vzbudiť otázky. Piko ešte nevie, či sa Ochranné pole pokazilo, či sú jeho priatelia v nebezpečenstve ani čo presne spôsobilo veľké bliknutie.",
        "Názov Ochranné pole možno prvýkrát predstaviť až neskôr. Nie je potrebné ho vysvetľovať počas úvodného telefonátu.",
        "Piko pôsobí sympaticky, trochu nervózne, ale nie vystrašene. Deti majú cítiť, že ich pomoc je dôležitá.",
        "Prvé fyzické hľadanie začína rozlúštením videa. Bez automatického prechodu: správa ostáva na displeji a možno ju prehrávať opakovane až do nájdenia obálky."
      ],
      "incoming": [
        "Obrazovka telefónu na okamih zhasne.",
        "Ozve sa zvláštne pípnutie.",
        "Potom druhé.",
        "A tretie.",
        "Na displeji sa objaví nápis:",
        "NEZNÁME SPOJENIE"
      ],
      "resolution": [
        [
          "SPOJENIE PRERUŠENÉ",
          "Na displeji zostane jediný symbol malej modrej bodky."
        ]
      ]
    },
    {
      "id": "envelope",
      "title": "Kvakove rozhádzané signály",
      "label": "Úloha 1",
      "icon": "✉",
      "time": [
        1,
        2,
        3
      ],
      "reward": "S",
      "answer": [
        "741296"
      ],
      "placeholder": "Šesťmiestny kód",
      "story": [
        [
          "V obálke je Kvakov pracovný list. Jeho spojenie s Pikom aj ostatnými kamarátmi sa rozpadlo.",
          "Kvak dokáže zachytiť aj veľmi slabé správy. Šesť záznamov jeho signálu sa však pomiešalo. Pomôžte mu obnoviť spojenie!"
        ]
      ],
      "action": "Vyberte z obálky 1 jediný list P1. Vystrihnite všetkých šesť signálov po prerušovaných čiarach a otočte ich tak, aby ste prečítali všetky údaje.",
      "task": "Zoraďte záznamy od najstaršieho po najnovší: najskôr podľa dátumu, v rovnaký deň podľa presného času. Všetky vznikli v rovnakom roku. Prečítajte číslice v tomto poradí a zapíšte šesťmiestny kód.",
      "materials": "P1: jeden jednostranný pracovný list A4 s Kvakovým príbehom, návodom a šiestimi otočenými vystrihovacími signálmi. Ceruzka a detské nožnice.",
      "mobile": "Simulovať naskenovanie QR → fullscreen Obnova spojenia – Kvak → šesťmiestny kód 741296 → Piko a Kvak, jediná Kvakova hlasová správa z assets/KvakMessage.mpeg. Písmeno S sa uloží bez automatického pokračovania.",
      "solution": "13. 3. 20:05 → 7; 13. 3. 20:10 → 4; 13. 3. 20:15 → 1; 14. 6. 19:50 → 2; 15. 9. 08:35 → 9; 15. 12. 08:40 → 6. Kód 741296.",
      "hints": [
        "Najprv porovnajte mesiace, potom dni. Všetky záznamy vznikli v jednom roku.",
        "Tri marcové záznamy majú rovnaký dátum. O ich poradí rozhodne presný čas: od skoršieho po neskorší."
      ],
      "parent": "Obálka 1 v kúpeľni obsahuje iba celý P1. Ústrižky vystrihujú až deti. P2 patrí do samostatnej obálky 2 pri okne. Farebná tlač je odporúčaná, čiernobiela na bielom papieri je plne hrateľná.",
      "transition": "Vypočujte si Kvakov odkaz. Keď nájdete ďalšiu obálku, pokračujte na Iskrin odkaz. Vaše získané písmeno S je uložené v zápisníku.",
      "character": "kvak",
      "dramaturgy": [
        "Obnovuje sa prvý kontakt. V celej scéne hovorí iba Kvak; Piko je prítomný ako poslucháč.",
        "Príbehový objav: pred bliknutím sa opakoval zvláštny signál. Kvak ešte nerozumie jeho významu.",
        "Schopnosť: zachytávanie slabých signálov. Hráči získavajú písmeno S.",
        "Kvakov zvukový odkaz smeruje k obálke 2 pri okne. Nepreskakuje sa automaticky.",
        "Na želanie používateľa majú tri záznamy rovnaký dátum 13. 3.; o poradí rozhodujú časy 20:05, 20:10 a 20:15. Kód zostáva 741296."
      ],
      "resolution": [
        [
          "Kvak?! Kvak! Čo to je? Kto mi lezie do signálu?!",
          "Počkajte! Ja vás počujem! Vy ste obnovili moje spojenie?!",
          "Ľudia?! Naozajstní ľudia?! Kvak! Tak toto som ešte nezažil!",
          "Jééj! Už ho vidím! Piko je tu! Konečne sme zase v spojení!",
          "Ďakujem vám! Bez vás by som sa s ním nespojil!",
          "Ale niečo mi stále nejde do hlavy. Tesne predtým, ako všetko zablikalo, som zachytil zvláštny signál. Opakoval sa stále dookola. Určite to nebola náhoda.",
          "Myslím, že Iskra by nám mohla pomôcť. Ona vie nájsť aj to, čo ostatní nevidia.",
          "Zachytil som jej posledný odkaz… len sa nám roztrhal na kúsky!",
          "Nájdite ďalšiu obálku tam, kde cez deň do vášho domu prichádza svetlo!",
          "Kvak! A ešte raz ďakujem, kamaráti!"
        ]
      ]
    },
    {
      "id": "document",
      "title": "Iskrin odkaz",
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
      "story": [
        [
          "Na displeji sa objaví Kvak.",
          "„Zachytil som časti Iskrinho odkazu. Lenže signál nimi tak zatriasol, že neviem, v akom poradí majú byť.“",
          "Vedľa neho sa objaví Piko.",
          "„Iskra je naša najlepšia hľadačka skrytých značiek. Keď niekde zhasne svetlo, ona vždy nájde spôsob, ako ukázať ostatným cestu.“",
          "Kvak si povzdychne.",
          "„Len keby sme vedeli, kde ju hľadať.“"
        ]
      ],
      "action": "Nájdite obálku 2 podľa Kvakovej hlasovej indície. Vyberte iba štyri Iskrine pásiky P2 a na stole ich poskladajte podľa čísel v rohoch. Môžete ich spojiť papierovou páskou.",
      "task": "Prečítajte zloženú vetu „POD OKNOM / JE LIST / SO SYMBOLMI. / HĽADAJTE NÍZKO.“ Zadajte hlavné miesto, ku ktorému vás veta posiela.",
      "materials": "P2: štyri premiešané pásiky v obálke 2 pri okne. P3: osobitne uzavretá karta symbolov nízko pod oknom, označená Úloha 3.",
      "mobile": "Zadanie názvu miesta odomkne druhé písmeno a pokyn vyzdvihnúť kartu.",
      "solution": "OKNO; uznáva sa aj POD OKNOM.",
      "hints": [
        "Malé čísla určujú poradie pásikov.",
        "Veta sa začína slovami POD OKNOM."
      ],
      "parent": "Obálku 2 s P2 položte pri okne na bezpečné miesto na dosah detí. Okno sa neotvára a na parapet sa nelezie. P3 samostatne preložte a uzavrite do označeného obalu Úloha 3 – otvoriť po zložení odkazu; umiestnite nízko pod okno.",
      "transition": "„Moje písmeno je V!“ Iskra rozsvieti značky na ceste. „Pod oknom čakajú Šutkove symboly.“",
      "character": "iskra",
      "dramaturgy": [
        "Iskra prináša optimizmus. Deti prvýkrát začínajú pochybovať, či sa cesty skutočne zničili.",
        "Schopnosť: odhaľovanie skrytých značiek.",
        "Písmeno: V.",
        "Príbehová indícia: svetelné značky sú skryté, nie zničené.",
        "Nasledujúca aktivita: symboly, logické vzťahy a získanie kontaktu na Šutka."
      ],
      "resolution": [
        [
          "Po potvrdení miesta OKNO vezmite kartu symbolov spod okna. Práve cez túto stopu sa Iskra ozve:",
          "Po objavení miesta a nájdení ďalšej fyzickej indície sa mobil rozžiari.",
          "„Haló? Haló!“",
          "Tentoraz sa ozve živý, radostný hlas.",
          "„Vidím vás! Konečne vás vidím!“",
          "Na obrazovku vyskočí malý oranžovo-zlatý plamienok.",
          "„Ja som Iskra!“",
          "„Iskra!“ vykríkne Piko.",
          "„Piko! Kvak! Kto sú tí ďalší?“",
          "„Naši noví kamaráti,“ odpovie Kvak.",
          "Iskra sa nadšene rozžiari.",
          "„Vážne? Ľudskí kamaráti? To je fantastické!“",
          "Zasvieti tak jasne, že displej na okamih zbledne.",
          "„Ups.“",
          "Zmenší svoj plamienok."
        ],
        [
          "„Prepáčte. Keď mám radosť, trochu sa mi nedarí zostať nenápadná.“",
          "Piko sa zasmial.",
          "„Iskra, vieš nám povedať, prečo zmizli naše cesty?“",
          "Iskra na chvíľu zvážnie.",
          "„Nie celkom. Ale všimla som si niečo zvláštne.“",
          "„Čo?“",
          "„Na jednej chodbe prestali svietiť značky. Myslela som, že sú zničené. Lenže keď som sa na ne pozrela z iného uhla, stále tam boli.“",
          "„Takže nezmizli?“ spýta sa Kvak.",
          "„Presne tak. Akoby ich niečo schovalo.“",
          "Piko stíchne.",
          "„Schovalo?“",
          "Iskra prikývne."
        ],
        [
          "„A ešte niečo. Na konci chodby som videla Šutkovu značku. Myslím, že sa pokúšal niečo podoprieť.“",
          "Na obrazovke sa objaví písmeno V.",
          "„Toto je moja značka zo záložného plánu. Nezabudnite na ňu!“",
          "Iskra žmurkne.",
          "„Poďme nájsť Šutka. Ten sa len tak niečoho nezľakne.“"
        ]
      ]
    },
    {
      "id": "symbols",
      "title": "Šutkov uzavretý priechod",
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
      "story": [
        [
          "Na nájdenej karte sú zvláštne znaky.",
          "Iskra sa pozorne zahľadí na jeden z nich.",
          "„Toto poznám!“",
          "Piko sa nakloní k obrazovke.",
          "„Šutkove značky?“",
          "„Áno. Označuje nimi miesta, kde je cesta bezpečná.“",
          "Kvak si priloží krídlo k uchu.",
          "„Zachytávam niečo veľmi slabé. Znie to ako…“",
          "Ozve sa hlboké, pokojné:",
          "„Hmmmm.“",
          "Kvak sa rozžiari.",
          "„To je on!“"
        ]
      ],
      "action": "Vezmite kartu symbolov spod okna. Ceruzkou si poznačte hodnotu každého tvaru.",
      "task": "Na karte platí △ + △ = 6, ○ + △ = 5 a □ + ○ = 6. Koľko je △ + ○ + □?",
      "materials": "P3: tri rovnice a otázka. P4: dva šifrovacie kruhy a zakódovaný odkaz, pripravené na stole v obálke 3.",
      "mobile": "Overenie jedného čísla; potom pokyn otvoriť obálku 3 na stole.",
      "solution": "△ = 3, ○ = 2, □ = 4. Súčet je 9.",
      "hints": [
        "Dva rovnaké trojuholníky dávajú 6. Jeden má hodnotu 3.",
        "Kruh má hodnotu 2 a štvorec 4. Sčítajte 3 + 2 + 4."
      ],
      "parent": "Po úspešnej úlohe 2 otvorte samostatný obal P3 pod oknom. Obálka 3 na stole obsahuje P4 a osobitne uzavretý P5 s označením Úloha 5 – otvoriť po prekladači. Dovoľte deťom kresliť tvary alebo ich nahradiť predmetmi.",
      "transition": "Šutko čaká pri priechode uzavretom zvnútra. Vezmite obálku 3 zo stola; Lístkov prekladač môže vysvetliť jeho značky.",
      "character": "sutko",
      "dramaturgy": [
        "Šutko prináša prvú výraznejšiu pochybnosť.",
        "Priechod sa nespráva ako poškodená konštrukcia. Vyzerá ako zámerne uzavreté miesto.",
        "Schopnosť: spevňovanie priechodov.",
        "Písmeno: E.",
        "Atmosféra má byť pokojne tajomná. V tejto chvíli ešte nie je známe, prečo sa priechod uzavrel.",
        "Nasledujúca aktivita: zostavenie papierového šifrovacieho stroja, kontakt s Lístkom."
      ],
      "resolution": [
        [
          "Na displeji sa pomaly objaví sivá postavička pripomínajúca malý kamienok.",
          "„Dobrý deň,“ povie veľmi pokojne.",
          "„Šutko!“ zavolá Piko.",
          "„Ahoj, Piko.“",
          "„Čo sa tam deje? Si v poriadku?“",
          "„Som.“",
          "Šutko sa zamyslí.",
          "„Len je tu trochu tesno.“",
          "„Tesno?“",
          "„Priechod sa uzavrel. Skúšal som ho podoprieť, ale drží pevnejšie, než som čakal.“",
          "Kvak sa nakloní k obrazovke.",
          "„A nedá sa rozbiť?“",
          "Šutko naňho pomaly pozrie.",
          "„Kvak, ty by si najradšej rozbil všetko, čo sa nedá otvoriť.“"
        ],
        [
          "„Nie všetko,“ ohradí sa Kvak. „Len niektoré veci.“",
          "Iskra sa usmeje.",
          "„Šutko, myslíš, že je priechod poškodený?“",
          "Šutko pokrúti hlavou.",
          "„To je práve zvláštne. Keby bol zlomený, cítil by som praskliny.“",
          "„Ale necítim ich.“",
          "Piko zbystrí pozornosť.",
          "„Čo teda cítiš?“",
          "Šutko položí ruku na stenu chodby.",
          "„Je zatvorená.“",
          "„Zatvorená?“",
          "„Áno.“",
          "Odmlčí sa.",
          "„A zdá sa mi, že z našej strany.“",
          "Všetci na chvíľu stíchnu.",
          "Potom Šutko vytiahne malú značku s písmenom E."
        ],
        [
          "„Toto som našiel na našej strane uzáveru. Patrí k záložnému plánu.“",
          "Piko prikývne.",
          "„Ďakujeme. Drž tam všetko pokope. Skúsime zistiť, čo to znamená.“",
          "Šutko sa pohodlne oprie.",
          "„Ja počkám.“",
          "„A ako dlho?“ spýta sa Kvak.",
          "„Koľko bude treba.“"
        ]
      ]
    },
    {
      "id": "cipher",
      "title": "Lístkovo varovanie",
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
      "story": [
        [
          "„Potrebujeme Lístka,“ povie Piko.",
          "„On rozumie starým značkám nášho sveta. Ak niekto vie vysvetliť, čo sa stalo, je to práve on.“",
          "Na stole čakajú dva papierové kruhy.",
          "Kvak sa na ne zahľadí.",
          "„Vyzerá to ako dve koláče.“",
          "„Kvak,“ povzdychne si Iskra.",
          "„Čo? Veď som ešte nejedol.“",
          "Piko sa usmeje.",
          "„Nie sú to koláče. Je to prekladač tajných správ.“"
        ]
      ],
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
      "transition": "STÔL ukázal miesto ďalšej stopy. Lístok varuje: nič neotvárajte nasilu. Na stole otvorte samostatný obal s Kubovým plánom P5 a nájdite bezpečnú cestu.",
      "character": "listok",
      "dramaturgy": [
        "Toto je bod, kde sa mení cieľ hráčov.",
        "Doteraz verili, že opravujú pokazený systém. Teraz zistia, že jeho automatické otvorenie by mohlo byť nebezpečné.",
        "Veľmi dôležité: zvrat nesmie pôsobiť ako náhodné nové pravidlo. Predchádzajúce indície od Kvaka, Iskry a Šutka k nemu postupne smerovali.",
        "Lístok prekladá význam varovania. Hráči ho nemusia samostatne rozlúštiť ako ďalšiu šifru.",
        "Schopnosť: prekladanie správ a starých pravidiel.",
        "Písmeno: T.",
        "Nasledujúca aktivita: Kubova mapa bezpečných ciest."
      ],
      "resolution": [
        [
          "Rozlúštené slovo STÔL označuje miesto s Kubovým plánom. Skôr než ho otočíte, spojenie zachytí Lístka:",
          "Po úspešnom rozlúštení odkazu sa na obrazovke objaví zelená postavička.",
          "V ruke drží drobný zápisník.",
          "„Á, výborne,“ povie pokojne.",
          "„Už som si myslel, že niekto zabudol, ako sa tieto kruhy používajú.“",
          "„Lístok!“ vykríkne Piko.",
          "„Som rád, že ťa vidím.“",
          "„Aj ja vás. A najmä som rád, že ste našli môj prekladač.“",
          "Lístok sa zadíva na hráčov.",
          "„Vidím, že máme návštevu.“",
          "„Pomáhajú nám!“ vysvetlí Iskra.",
          "„Pozoruhodné,“ usmeje sa Lístok.",
          "Potom sa jeho výraz zmení."
        ],
        [
          "„Priatelia, musím vám niečo povedať.“",
          "Otvorí zápisník.",
          "„Keď sa naše cesty uzavreli, zachytil som správu z Ochranného poľa.“",
          "Piko sa narovná.",
          "„Takže vieme, kde je porucha?“",
          "Lístok pokrúti hlavou.",
          "„To je práve problém.“",
          "„Prečo?“",
          "Lístok otočí zápisník k ostatným.",
          "Na jeho stránke žiari krátka správa:",
          "OCHRANA AKTÍVNA.",
          "NEOTVÁRAŤ PRED NÁVRATOM VŠETKÝCH.",
          "Nastane ticho.",
          "„Počkať,“ ozve sa Piko.",
          "„Akože neotvárať? Veď sa celý čas snažíme cesty obnoviť.“",
          "Lístok prikývne.",
          "„Ja viem.“"
        ],
        [
          "Kvak sa zamračí.",
          "„Tak kto ich zatvoril?“",
          "Lístok chvíľu hľadí na správu.",
          "„Ochranné pole.“",
          "„Ale veď to nás malo chrániť!“ vykríkne Iskra.",
          "„Presne tak,“ odpovie Lístok.",
          "Piko pomaly pochopí.",
          "„Ty chceš povedať…“",
          "Lístok prikývne.",
          "„Že Ochranné pole možno vôbec nie je pokazené.“",
          "„Možno robí presne to, čo má.“",
          "Kvakovi na okamih padne zobák.",
          "„Takže my sa snažíme opraviť niečo, čo funguje?“",
          "„Možno,“ povie Lístok.",
          "„Len ešte nevieme, pred čím nás chráni.“"
        ],
        [
          "Na displeji sa objaví písmeno T.",
          "„Odložte si aj túto značku,“ povie Lístok.",
          "„A hlavne nič neotvárajte nasilu.“",
          "Piko sa obráti na hráčov.",
          "„Takže máme nový plán.“",
          "Nadýchne sa.",
          "„Nebudeme zatiaľ otvárať Ochranné pole.“",
          "„Najskôr nájdeme ostatných. A zistíme pravdu.“"
        ]
      ]
    },
    {
      "id": "maze",
      "title": "Kubova cesta domov",
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
      "story": [
        [
          "„Ak je Ochranné pole zatvorené, musíme zistiť, kadiaľ sa dá bezpečne prejsť,“ povie Piko.",
          "„Poznám niekoho, kto dokáže postaviť cestu aj tam, kde žiadna nie je.“",
          "Kvak sa usmeje.",
          "„Kubo!“",
          "Na displeji sa objaví náčrt svetelných chodbičiek. Papierový plán čaká v osobitnom obale v obálke 3 na stole.",
          "„Toto je jeho mapa,“ vysvetlí Piko.",
          "„Ak nájdeme cestu k jadru, možno sa mu dovoláme.“"
        ]
      ],
      "action": "Otvorte samostatný obal P5 z obálky 3. Prstom alebo ceruzkou nájdite cestu papierovým plánom od šípky VSTUP ku kruhu JADRO.",
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
      "character": "kubo",
      "dramaturgy": [
        "Po zvrate potrebujeme chvíľu úľavy. Deti zistia, že stratení Pixelkovia nie sú v bezprostrednom nebezpečenstve.",
        "Nové napätie: existuje bezpečná cesta, ale treba ju správne obnoviť.",
        "Schopnosť: stavanie a skladanie ciest.",
        "Písmeno: L.",
        "Nasledujúca aktivita: digitálna interakcia, nadviazanie spojenia s Ryškom."
      ],
      "resolution": [
        [
          "Na obrazovke sa ozve búchanie.",
          "„Tuk! Tuk! Tuk!“",
          "Potom sa objaví kockatá postavička s malým nástrojom v ruke.",
          "„Konečne!“",
          "Kubo sa rozhliadne.",
          "„Kto mi poskladal tú cestu?“",
          "Piko sa usmeje.",
          "„Naši noví kamaráti.“",
          "Kubo sa pozrie priamo na hráčov.",
          "„Vy?“",
          "„No teda!“",
          "Pokrúti hlavou.",
          "„Na ľudí máte celkom šikovné prsty.“",
          "„Kubo,“ preruší ho Piko. „Vieš, čo sa stalo s našimi chodbičkami?“",
          "Kubo pokrúti hlavou.",
          "„Nie sú zničené. Aspoň nie všetky.“",
          "Vytiahne plán.",
          "„Pozrite sa sem.“"
        ],
        [
          "Na mape sa rozsvieti niekoľko malých bodiek.",
          "„Toto sú bezpečné úkryty. Keď sa Ochranné pole zatvorilo, naše cesty sa rozdelili na krátke úseky.“",
          "„Takže nikto nezostal uprostred nebezpečnej cesty?“ spýta sa Iskra.",
          "„Nie. Ochranné pole nás presunulo do najbližších bezpečných miest.“",
          "Piko si úľavne vydýchne.",
          "„Takže ostatní môžu byť v bezpečí.“",
          "Kubo prikývne.",
          "„Áno. Len sa bez správnej cesty nedostaneme všetci späť.“",
          "Kvak nakloní hlavu.",
          "„A dokážeš ju postaviť?“",
          "„Dokážem.“"
        ],
        [
          "Kubo sa na chvíľu odmlčí.",
          "„Ak budem vedieť, ktorú.“",
          "Piko sa pozrie na hráčov.",
          "„A práve s tým nám pomôžete.“",
          "Kubo zdvihne malú kockatú značku s písmenom L.",
          "„Toto je moja časť záložného plánu.“",
          "„A ešte niečo,“ dodá.",
          "„Na konci cesty som našiel Ryškov znak.“",
          "Všetci spozornejú.",
          "„Ryško?“ spýta sa Piko.",
          "Kubo prikývne.",
          "„Ak niekto vie, prečo sa Ochranné pole zatvorilo, bude to on.“"
        ]
      ]
    },
    {
      "id": "digital",
      "title": "Ryškovo tajomstvo",
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
      "story": [
        [
          "Na mobile sa rozsvietia tri zvláštne svetelné symboly.",
          "Piko sa na ne zahľadí.",
          "„Ryškove značky.“",
          "Kvak prikývne.",
          "„Už ho počujem. Ale jeho signál je veľmi slabý.“",
          "Piko sa obráti na hráčov.",
          "„Pokúsme sa ho znovu spojiť.“"
        ]
      ],
      "action": "Položte pred seba poznámku z plánu P5. Teraz rieši celý tím spolu na telefóne.",
      "task": "Stlačte symboly v poradí podľa poznámky: „Nočný pokoj. Denné svetlo. Večerná hviezda.“ Potom overte sekvenciu. Výber sa dá vymazať.",
      "materials": "Poznámka na P5; nové materiály netreba.",
      "mobile": "Tri tlačidlá mesiac, slnko a hviezda; viditeľná sekvencia, vymazanie a overenie.",
      "solution": "Mesiac → slnko → hviezda. Pole sa preventívne uzavrelo, aby nikto neprezradil svet Pixelkov; treba obnoviť bezpečnú cestu pre všetkých.",
      "hints": [
        "Nočný pokoj predstavuje mesiac. Čo svieti cez deň?",
        "Poradie je mesiac, slnko, hviezda."
      ],
      "parent": "Odhalenie príčiny sa zobrazí až po správnej sekvencii. Zdôraznite, že Ochranné pole všetkých chránilo a nikto nie je zranený.",
      "transition": "Ryško pozná príčinu uzavretia Ochranného poľa. Posledný odkaz čaká v obálke 4 pod stoličkou pri stole.",
      "character": "rysko",
      "dramaturgy": [
        "Toto je druhé veľké odhalenie, tentoraz úplné vysvetlenie príčiny.",
        "Ochranné pole sa uzavrelo, aby ochránilo svet Pixelkov pred prezradením ľuďom. Nikoho nezranilo; iba ich oddelilo do bezpečných miest.",
        "Ryško sa nemusí stať vinníkom celej situácie. Je strážcom, ktorý počas nehody urobil, čo bolo v jeho silách.",
        "Jeho emocionálnym momentom je úľava, že ostatní sú v poriadku.",
        "Schopnosť: ochrana a obnovenie Ochranného poľa.",
        "Písmeno: O.",
        "Nasledujúca aktivita: objavenie spoločného sľubu."
      ],
      "resolution": [
        [
          "Obrazovka zhasne.",
          "Na niekoľko sekúnd je celkom čierna.",
          "Potom sa objavia dve oranžové oči.",
          "„Piko?“",
          "„Ryško!“",
          "Na obrazovke sa ukáže malá červená panda.",
          "„Ste v poriadku?“",
          "„Áno!“ odpovie Piko.",
          "„Našli sme Kvaka, Iskru, Šutka, Lístka aj Kuba.“",
          "Ryško na chvíľu zatvorí oči.",
          "„Tak dobre.“",
          "Jeho hlas znie trochu unavene.",
          "„Bál som sa, že zostanete oddelení dlhšie.“",
          "Piko sa k nemu nakloní.",
          "„Ryško, povedz nám pravdu.“",
          "„Čo sa stalo s Ochranným poľom?“",
          "Ryško sa odmlčí."
        ],
        [
          "„Pamätáte si na veľké bliknutie?“",
          "Všetci prikývnu.",
          "„V tej chvíli sa dve obrazovky rozžiarili v úplne rovnakom okamihu. Svetelný priechod medzi nimi sa otvoril tak široko, že by ho človek mohol zazrieť.“",
          "Iskra zadržala dych.",
          "„Celý náš svet?“",
          "„Nie celý,“ odpovie Ryško.",
          "„Ale dosť na to, aby niekto uvidel jednu z našich ciest.“",
          "Piko sa zamyslí.",
          "„A preto sa Ochranné pole uzavrelo?“",
          "Ryško prikývne.",
          "„Áno.“"
        ],
        [
          "„Pokúsil som sa chodby udržať, ale Ochranné pole už spustilo svoj najstarší ochranný režim.“",
          "„Uzavrelo otvorený priechod, rozdelilo nás do bezpečných úkrytov a čakalo.“",
          "„Na čo?“ spýta sa Kvak.",
          "„Na to, kým budeme všetci pripravení vrátiť sa domov.“",
          "Piko na chvíľu stíchne.",
          "„Takže to nebola porucha.“",
          "„Nie.“",
          "Ryško sklopí pohľad.",
          "„Len som vám to nestihol povedať.“",
          "„Myslel som, že som vás stratil.“",
          "Piko sa usmeje.",
          "„Ale nestratil.“",
          "„Pozri, sme tu.“"
        ],
        [
          "Na obrazovke sa postupne objavia Kvak, Iskra, Šutko, Lístok a Kubo.",
          "Šutko prikývne.",
          "„Čakali sme.“",
          "Iskra sa usmeje.",
          "„A teraz sme zase spolu.“",
          "Ryško si utrie oči.",
          "„Ešte nie celkom.“",
          "„Musíme sa dostať späť cez bezpečný priechod. Až potom môžem Ochranné pole znovu nastaviť do jeho bežného režimu.“",
          "Na obrazovke sa objaví posledné písmeno O.",
          "„Toto je moja značka záložného plánu,“ vysvetlí Ryško.",
          "Piko pozrie na šesť nazbieraných symbolov.",
          "„Máme všetky.“",
          "Kvak sa poteší."
        ],
        [
          "„Tak poďme domov!“",
          "Ryško však zdvihne labku.",
          "„Ešte nie.“",
          "„Stará ochrana má jedno pravidlo.“",
          "„Domov sa musí vrátiť každý.“"
        ]
      ]
    },
    {
      "id": "search",
      "title": "Sľub Pixelkov",
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
      "story": [
        [
          "Na displeji stojí všetkých sedem Pixelkov.",
          "Kubo má pripravený plán.",
          "Iskra rozsvietila značky.",
          "Šutko pevne drží oporný bod priechodu.",
          "Kvak načúva bezpečnému signálu.",
          "Lístok kontroluje staré pravidlá.",
          "Ryško sleduje Ochranné pole.",
          "A Piko drží spojenie s vami.",
          "„Sme pripravení?“ spýta sa Piko.",
          "„Takmer,“ odpovie Ryško.",
          "„Ešte nám chýba jeden odkaz.“",
          "Lístok sa usmeje.",
          "„Starý pixelkovský sľub.“",
          "„Poznám ho!“ vykríkne Iskra."
        ],
        [
          "„Samozrejme, že ho poznáš,“ povie Kvak. „Ty ho opakuješ pred každou cestou.“",
          "„Pre istotu!“",
          "Piko sa obráti k hráčom.",
          "„Poslednú obálku nájdete pod jednou zo stoličiek pri stole.“",
          "„Je tam odkaz, ktorý nám pripomenie, čo musíme urobiť.“"
        ]
      ],
      "action": "Nájdite obálku 4 pod sedadlom dostupnej stoličky pri stole. Vyberte sľub Pixelkov a kartu poradia.",
      "task": "Prečítajte prvé písmeno každého z piatich riadkov zhora nadol. Získané slovo potvrďte v telefóne. Kartu poradia si odložte na finále.",
      "materials": "P6: päť viet začínajúcich S, P, O, L, U a karta „Písmená úloh 1 → 2 → 3 → 4 → 5 → 6“; obálka 4.",
      "mobile": "Overí slovo SPOLU a uloží kartu poradia do zápisníka.",
      "solution": "Prvé písmená viet tvoria SPOLU. Karta určuje poradie šiestich nazbieraných písmen podľa úloh.",
      "hints": [
        "Piko zdôraznil začiatky. Pozrite sa na prvé písmeno každého riadka.",
        "Písmená sú S, P, O, L, U."
      ],
      "parent": "Obálku prilepte papierovou páskou na dosah. Dieťa nemá liezť pod ťažký nábytok ani ho presúvať. Pomôžte so zložením obálky.",
      "transition": "SPOLU. Domov sa vráti každý, aj Piko. Karta P6 určuje poradie písmen z úloh 1 až 6.",
      "dramaturgy": [
        "Táto scéna má byť krátkym emocionálnym vrcholom ešte pred akčným finále.",
        "Sľub SPOLU nie je len odpoveď v hlavolame. Je to najdôležitejšie pravidlo celej partie.",
        "Dôležitý detail: Piko je stále na spojení s hráčmi. Je siedmym Pixelkom a nesmie zostať zabudnutý mimo obnoveného Ochranného poľa.",
        "Nasleduje finálna metaúloha, v ktorej sa spoja nazbierané písmená."
      ],
      "resolution": [
        [
          "Po vyriešení sa na displeji rozžiari slovo:",
          "SPOLU",
          "Na chvíľu zostane úplné ticho.",
          "Potom sa ozve Šutko.",
          "„Tak je to správne.“",
          "Kvak prikývne.",
          "„Nikto nezostane sám.“",
          "Iskra sa usmeje.",
          "„A nikto nezostane vzadu.“",
          "Kubo zdvihne plán.",
          "„Cestu postavím tak, aby po nej prešiel aj posledný.“",
          "Ryško sa pozrie na Pika.",
          "„Aj ty.“",
          "Piko sa prekvapene obzrie.",
          "„Ja?“",
          "„Samozrejme,“ odpovie Ryško.",
          "„Ty predsa držíš spojenie s ľuďmi. Bez teba by sme ich nikdy nepočuli.“",
          "Piko pozrie na hráčov."
        ],
        [
          "Potom na svojich kamarátov.",
          "„Máte pravdu.“",
          "Ticho sa usmeje.",
          "„Najskôr pomôžeme všetkým dostať sa domov.“",
          "„A potom prídem aj ja.“",
          "Lístok ukáže na šesť nazbieraných písmen.",
          "„Zostáva nám ešte zostaviť spoločné heslo. To spojí naše pripravené schopnosti do jedného bezpečného návratu.“"
        ]
      ]
    },
    {
      "id": "code",
      "title": "Heslo, ktoré spája",
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
      "story": [
        [
          "Na obrazovke sa objaví šesť žiariacich znakov.",
          "Kvak pristúpi dopredu.",
          "„Môj signál je pripravený.“",
          "Iskra zdvihne malú svetelnú iskru.",
          "„Moje značky svietia.“",
          "Šutko položí obe ruky na oporný bod mosta.",
          "„Priechod drží.“",
          "Lístok otvorí svoj zápisník.",
          "„Pokyny sú preložené.“",
          "Kubo sa pozrie na plán.",
          "„Cesta je pripravená.“",
          "Ryško zdvihne hlavu.",
          "„Ochranné pole čaká.“",
          "Piko sa obráti na hráčov.",
          "„Každý z nás má jednu časť.“",
          "„Ale až vy ich dokážete spojiť.“"
        ],
        [
          "„Pamätáte si šesť znakov, ktoré ste počas nášho pátrania získali?“",
          "Na displeji sa objavia všetky nazbierané písmená.",
          "„Použite kartu poradia zo záložného plánu.“",
          "„Keď zostavíte správne heslo, odošlete spoločný signál.“"
        ]
      ],
      "action": "Rozložte kartu poradia. Každý člen tímu môže prečítať jednu zo získaných indícií. Nájdete ich aj v hernom zápisníku.",
      "task": "Usporiadajte šesť získaných písmen podľa úloh 1 až 6. Odošlite spoločný návratový signál, ktorý zosúladí pripravené schopnosti Pixelkov.",
      "materials": "Karta poradia P6 a šesť písmen v digitálnom zápisníku; voliteľne papier a ceruzka.",
      "mobile": "Heslo SVETLO zosúladí pripravené schopnosti. Po scénach návratu pokračujte do úspešného finále.",
      "solution": "Úlohy 1–6 dali S, V, E, T, L, O → SVETLO.",
      "hints": [
        "Použite len šesť písmen. Šípka a fajka nie sú súčasťou hesla.",
        "V poradí úloh čítajte S – V – E – T – L – O."
      ],
      "parent": "Nechajte heslo vysloviť celý tím. Nie je tu skutočný časový limit ani riziko straty hry.",
      "transition": "SVETLO je spoločný potvrdzovací signál. Bezpečnou cestou prejde celá partia; Piko sa vracia ako posledný.",
      "dramaturgy": [
        "Toto je akčná kulminácia celej hry.",
        "Heslo SVETLO samo osebe nie je kúzelným slovom, ktoré opraví všetko. Je to spoločný potvrdzovací signál, ktorý zosúladí šesť pripravených schopností.",
        "Piko je siedmym členom tímu: udržiaval spojenie s ľuďmi a môže sa vrátiť až po tom, čo je cesta bezpečná.",
        "Pri finálnom prechode odporúčam použiť krátku animáciu jednotlivých Pixelkov, nie dlhý textový blok. Literárna verzia opisuje celú udalosť, jej mobilné spracovanie môže byť omnoho úspornejšie."
      ],
      "resolution": [
        [
          "Hráči odošlú správne slovo.",
          "SVETLO",
          "Na displeji sa objaví jasná svetelná čiara.",
          "Piko sa nadšene usmeje.",
          "„Funguje to!“",
          "„Kvak!“",
          "„Signál čistý!“",
          "„Iskra!“",
          "„Značky pripravené!“",
          "„Šutko!“",
          "„Most drží!“",
          "„Lístok!“",
          "„Bezpečný návrat potvrdený!“",
          "„Kubo!“",
          "„Cesta vedie domov!“",
          "„Ryško!“",
          "„Ochrana pripravená!“",
          "Na obrazovke sa rozsvieti spojenie všetkých šiestich symbolov.",
          "„Tak poďme!“ vykríkne Iskra.",
          "Jeden po druhom sa Pixelkovia vydávajú na cestu.",
          "Kvak sa najskôr započúva a vykročí."
        ],
        [
          "Iskra osvetlí ďalší úsek.",
          "Šutko pridŕža most, kým cez neho prejdú ostatní.",
          "Lístok vysvetlí posledné znamenie na ceste.",
          "Kubo dokončí spojovací diel.",
          "Ryško prechádza ako predposledný.",
          "Potom sa otočí.",
          "„Piko?“",
          "Na displeji stále stojí malá modrá postavička.",
          "„Ja ešte chvíľu zostanem,“ povie Piko.",
          "„Musím predsa ukončiť naše spojenie.“",
          "Ryško pokrúti hlavou.",
          "„A čo náš sľub?“",
          "Piko sa na chvíľu odmlčí."
        ],
        [
          "Na obrazovke sa objaví svetelná nitka, ktorá ešte stále spája jeho miesto s otvoreným priechodom.",
          "Iskra podá ruku.",
          "„Piko. Poď.“",
          "Piko sa obráti k hráčom.",
          "„Ďakujem, že ste nám pomohli.“",
          "„Už len posledný krok.“",
          "Modrá bodka sa pomaly pohne po svetelnej nitke.",
          "Na chvíľu zmizne.",
          "A potom…"
        ]
      ]
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
      "story": [
        [
          "Obrazovka na okamih zhasne.",
          "Všetko stíchne.",
          "Potom sa v jej strede rozsvieti sedem maličkých bodiek.",
          "Jedna modrá.",
          "Jedna žltá.",
          "Jedna zlatá.",
          "Jedna sivá.",
          "Jedna zelená.",
          "Jedna kockatá.",
          "A jedna oranžová.",
          "Bodky sa pomaly priblížia k sebe.",
          "Znovu sa objavia všetci Pixelkovia.",
          "„Sme doma!“ vykríkne Iskra.",
          "Kvak radostne zakvaká tak hlasno, až si Lístok zakryje uši.",
          "Kubo sa zatočí okolo vlastnej osi.",
          "„Všetky mosty držia!“",
          "Šutko si spokojne sadne.",
          "„To je dobré.“"
        ],
        [
          "Ryško sa rozhliadne po priateľoch.",
          "Jeden.",
          "Dva.",
          "Tri.",
          "Štyri.",
          "Päť.",
          "Šesť.",
          "Sedem.",
          "Všetci.",
          "„Ochranné pole obnovené,“ povie ticho.",
          "Okolo partie sa rozžiari jemná priesvitná žiara.",
          "Postupne pohasne.",
          "Piko pristúpi bližšie k obrazovke.",
          "„Tak.“",
          "Na okamih sa usmeje.",
          "„Teraz už poznáte naše tajomstvo.“",
          "Pozrie na svojich kamarátov.",
          "„Viete, celý čas som si myslel, že musím zachrániť všetkých sám.“",
          "Kvak sa zasmeje.",
          "„No, to by ti veľmi nešlo.“",
          "„Ďakujem, Kvak.“",
          "„Nemáš za čo.“"
        ],
        [
          "Piko sa znovu pozrie na hráčov.",
          "„Ale potom som našiel vás.“",
          "„A vy ste mi pripomenuli niečo, na čo som skoro zabudol.“",
          "„Že nikto nemusí zvládnuť všetko sám.“",
          "Iskra sa usmeje.",
          "„Ja viem rozsvietiť značky.“",
          "Šutko prikývne.",
          "„Ja dokážem podržať cestu.“",
          "„Ja ju postavím!“ pridá sa Kubo.",
          "„A ja ju viem prečítať,“ povie Lístok.",
          "Kvak zdvihne krídlo.",
          "„A ja ju počujem ešte skôr, než ju ostatní uvidia!“",
          "Ryško pokojne doplní:",
          "„A ja sa postarám, aby sa všetci bezpečne vrátili.“"
        ],
        [
          "Piko sa usmeje.",
          "„A ja nás spojím.“",
          "Na displeji sa objaví jemne žiariaci nápis:",
          "ĎAKUJEME, ZÁCHRANCOVIA PIXELKOV!",
          "Sedem kamarátov zamáva.",
          "Potom Piko ešte raz pristúpi k obrazovke.",
          "„A teraz vám prezradím posledné tajomstvo.“",
          "Nakloní sa bližšie.",
          "„My Pixelkovia sme tu žili už dávno pred dnešným dňom.“",
          "„A budeme tu aj zajtra.“",
          "„Možno sa práve teraz niektorý z nás pozerá z malého okienka na vašu obývačku.“",
          "„Možno sa Kvak čuduje, prečo váš budík tak hlasno zvoní.“"
        ],
        [
          "„Alebo Iskra obdivuje svetlá na vašom televízore.“",
          "„A možno…“",
          "Piko sa potichu usmeje.",
          "„Možno si niekedy spomenieme, že na druhej strane obrazovky máme priateľov.“",
          "Všetci zamávajú naposledy.",
          "Potom sa obrazovka zmení na obyčajný obraz.",
          "Žiadne tajné chodby.",
          "Žiadne malé postavičky.",
          "Len váš mobil.",
          "Presne taký ako predtým."
        ]
      ],
      "action": "Dajte si tímové plácnutie. Každý môže povedať, ktorá schopnosť Pixelkov pomohla partii a čím prispel on sám.",
      "task": "Všetkých osem úloh je splnených. Pixelkovia sú spolu a ich svet je znovu ukrytý. Pomenujte svoj tím a povedzte si, čím pomohol každý z vás.",
      "materials": "Voliteľný diplom záchrancov Pixelkov na tlačovej stránke. Žiadne ďalšie pomôcky netreba.",
      "mobile": "Finále obnoví skrytý svet Pixelkov; zostáva úplná mapa, zápisník a možnosť novej hry.",
      "solution": "Úspech tímu. Hra nemá prehratý koniec.",
      "hints": [
        "Každý z vás pomohol iným spôsobom."
      ],
      "parent": "Oslávte pomoc každého člena tímu. Piko sa bezpečne vrátil ako posledný. Atlas je dobrovoľný darček na spoločné čítanie, nie ďalšia úloha.",
      "transition": "Všetkých sedem Pixelkov je doma. Ochranné pole je v bežnom režime a ich svet je opäť ukrytý.",
      "dramaturgy": [
        "Finále musí priniesť úľavu, radosť a emocionálne uzavretie. Nie je potrebné pridávať ďalšieho nepriateľa, nečakané zlyhanie ani nový hlavolam.",
        "Každý Pixelko dostáva jasný moment v záverečnej sekvencii.",
        "Detský tím je oslovovaný ako nevyhnutná súčasť úspechu, nie ako pasívny divák.",
        "Záverečný Atlas Pixelkov je bonusový materiál, nie pokračovanie hlavného príbehu. Jeho odkaz bude prístupný po dokončení hry, samotná stránka však zostane verejná a bez prihlásenia.",
        "Záverečné bliknutie modrej bodky má zanechať príjemnú neistotu: čo ak je svet Pixelkov skutočne ukrytý niekde v našej domácnosti?"
      ],
      "invitation": [
        "O niekoľko sekúnd sa v rohu obrazovky objaví maličká modrá bodka.",
        "A krátky odkaz:",
        "„Psst! Ešte niečo som vám zabudol dať.“",
        "„Ak chcete vedieť, ako vyzerá náš domov, čo robíme celý deň a prečo si Kvak nikdy nevie nájsť obe papuče, pripravil som pre vás náš Tajný atlas.“",
        "„Je to darček za pomoc. Môžete si ho prečítať dnes, zajtra alebo kedykoľvek sa k nám budete chcieť vrátiť.“",
        "[OBJAVIŤ TAJNÝ SVET PIXELKOV]",
        "Pod odkazom ešte raz blikne modré svetielko.",
        "A potom už naozaj zmizne.",
        "Alebo možno nie.",
        "Veď to najdôležitejšie tajomstvo už poznáte.",
        "Pixelkovia sú možno bližšie, než si myslíte."
      ],
      "resolution": []
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
      "description": "Strážca skrytých ciest. Pozná staré pravidlá a vždy čaká, kým sa vráti aj posledný kamarát.",
      "tile": 6
    }
  ],
  "source": "GAME STUDIO V2; úvod a Kvakova misia V4. Schválené názvoslovie Ochranné pole.",
  "atlasInvitation": "Psst! Ešte niečo som vám zabudol dať.",
  "kvakMessage": [
    "Kvak?! Kvak! Čo to je? Kto mi lezie do signálu?!",
    "Počkajte! Ja vás počujem! Vy ste obnovili moje spojenie?!",
    "Ľudia?! Naozajstní ľudia?! Kvak! Tak toto som ešte nezažil!",
    "Jééj! Už ho vidím! Piko je tu! Konečne sme zase v spojení!",
    "Ďakujem vám! Bez vás by som sa s ním nespojil!",
    "Ale niečo mi stále nejde do hlavy. Tesne predtým, ako všetko zablikalo, som zachytil zvláštny signál. Opakoval sa stále dookola. Určite to nebola náhoda.",
    "Myslím, že Iskra by nám mohla pomôcť. Ona vie nájsť aj to, čo ostatní nevidia.",
    "Zachytil som jej posledný odkaz… len sa nám roztrhal na kúsky!",
    "Nájdite ďalšiu obálku tam, kde cez deň do vášho domu prichádza svetlo!",
    "Kvak! A ešte raz ďakujem, kamaráti!"
  ],
  "signalRecords": [
    {
      "date": "14. 6.",
      "month": 6,
      "day": 14,
      "time": "19:50",
      "digit": "2",
      "rotation": 90
    },
    {
      "date": "13. 3.",
      "month": 3,
      "day": 13,
      "time": "20:10",
      "digit": "4",
      "rotation": 180
    },
    {
      "date": "15. 12.",
      "month": 12,
      "day": 15,
      "time": "08:40",
      "digit": "6",
      "rotation": -90
    },
    {
      "date": "13. 3.",
      "month": 3,
      "day": 13,
      "time": "20:15",
      "digit": "1",
      "rotation": -90
    },
    {
      "date": "15. 9.",
      "month": 9,
      "day": 15,
      "time": "08:35",
      "digit": "9",
      "rotation": 90
    },
    {
      "date": "13. 3.",
      "month": 3,
      "day": 13,
      "time": "20:05",
      "digit": "7",
      "rotation": 180
    }
  ]
};
// Telefonát používa tie isté panely ako úvodný storyboard.
window.GAME.call = window.GAME.stages[0].story;
