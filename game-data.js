/* Príbeh Pixelkov. ID etáp, odpovede a odmeny zachovávajú postup V1. */
window.GAME = {
  "title": "Pixelkovia: Stratený signál",
  "version": 1,
  "audio": null,
  "call": [
    "Haló? Haló! Vidíte ma? Som Piko. Áno, tá modrá postavička na displeji! Som Pixelko a potrebujem váš tím.",
    "Bývame v malom svete medzi svetielkami obrazoviek. Dnes sme chceli otvoriť svetelný priechod k vám domov. Lenže prišiel výpadok a moji šiesti kamaráti sa roztratili medzi signálmi!",
    "Kvak, Iskra, Šutko, Lístok, Kubo aj Ryško… počujem len útržky ich hlasov. Nie sú zranení, ale sami cestu späť nenájdu. Každý z nich stráži jedno písmeno návratového hesla.",
    "Našťastie som stihol poslať papierové stopy vášmu dospelému pomocníkovi. Sú u vás doma! Začnite v kúpeľni. V suchej obálke s číslom 1 nájdete môj list a prvý kontakt. Ničoho elektrického sa nedotýkajte.",
    "Počkajte… zachytil som Kvakovo pípnutie! Kód má tri čísla. Spojenie zase slabne. Ak ma nebudete počuť, sledujte stopy. Len spolu ich dostaneme do—"
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
      "story": "Na displeji zabliká modrá tvár. „Som Piko, jeden z Pixelkov!“ Pri otváraní svetelného priechodu nastal výpadok a jeho šiesti kamaráti uviazli medzi signálmi. Piko sa dovolal práve vám. Dospelý pomocník už podľa jeho správy rozmiestnil papierové stopy po vašom dome. Cez šifry môžete obnoviť šesť kontaktov, získať šesť písmen a otvoriť cestu domov. Spojenie zapraská. Zostane správa: „Kúpeľňa. Obálka 1. Nájdite Kvaka.“",
      "action": "Spoločne prijmite simulovaný hovor od Pika. Po prerušení spojenia vezmite suchú obálku 1 v kúpeľni.",
      "task": "Prečítajte celý telefonát. Zapamätajte si prvé miesto: kúpeľňa. Skutočné telefónne číslo nepotrebujete.",
      "materials": "Obálka 1 v kúpeľni; telefón s otvorenou hrou.",
      "mobile": "Prijať hovor → textový rozhovor po častiach → prerušené spojenie → prvá úloha.",
      "solution": "Kúpeľňa. Úvod nepotrebuje kód.",
      "hints": [
        "Piko pomenoval miestnosť s umývadlom."
      ],
      "parent": "Hovor spustite až po rozmiestnení materiálov. Zobrazí sa len simulácia; nikto skutočne nevolá. Audio je voliteľné a zatiaľ nie je dodané.",
      "transition": "Pikov signál zoslabol. Prvá stopa vedie ku Kvakovi."
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
      "story": "Na obálke je malá pixelová hviezda. Vnútri je Pikov list: „Kvak posielal tri pípnutia, každé v inom čase. Výpadok ich premiešal. Zoraďte ich od najskoršieho a získate kód jeho kontaktu.“ Pod listom sú štyri pásiky roztrhaného odkazu. Odložte si ich. Na displeji zatiaľ svieti len prázdne okienko s kačacím zobáčikom. Kvak čaká na správny signál.",
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
      "transition": "Píp! Kvak je na linke. „Moje písmeno je S. Odkaz pre Iskru máte na pásikoch!“",
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
      "story": "V prvom okienku už žiari Kvak. „Iskra bola pri mne, ale výpadok nás rozdelil. Zanechala vám adresu na papieri. Ten sa pri výpadku nestratí!“ Štyri pásiky z obálky tvoria jeden odkaz. V rohoch vidno malé čísla a na okraji oranžový plamienok. Keď ich správne zoradíte, zistíte, odkiaľ sa Iskra pokúša vysielať.",
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
      "transition": "Iskra sa rozžiarila na linke! „Moje písmeno je V. Pod oknom nájdete Šutkove symboly.“",
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
      "story": "Pod oknom čaká karta s trojuholníkom, kruhom a štvorcom. „To je Šutko,“ povie Piko. „Namiesto čísiel rád kreslí tvary. Každý má vždy rovnakú hodnotu.“ Z displeja sa ozve pomalé zaklopkanie. Kamenný kamarát je blízko, no jeho kontakt je zamknutý číselnou hádankou. Na spodku karty je poznámka o papierovom prekladači a nastavení D → A. Tú budete potrebovať pri ďalšom kamarátovi.",
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
      "transition": "Ťuk-ťuk! Šutko je na linke. „Moje písmeno je E. Lístok čaká pri papierovom prekladači.“",
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
      "story": "V obálke 2 na stole sú dva papierové kruhy. Na ich okrajoch vyrástli nakreslené lístky. „Lístok vysiela v posunutej abecede,“ vysvetľuje Piko. „Na vonkajšom kruhu je jeho správa, na vnútornom jej význam. Nastavte vonkajšie D oproti vnútornému A. Potom prečítajte VWRO.“ Zo šumu sa na chvíľu vynorí zelený úsmev. Ktoré miesto ukrýva ďalšie spojenie?",
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
      "transition": "Lístok máva oboma lístkami! „Moje písmeno je T. Na stole otočte Kubov plán ciest.“",
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
      "story": "Kubo miluje stavanie. Na liste P5 preto nakreslil sieť ciest, ktorou putuje jeho signál. Niektoré odbočky sú slepé, iba jedna vedie od vstupu k jadru spojenia. „Nemusíte nič rozoberať,“ uisťuje vás Piko. „Choďte len prstom po papieri a zapisujte čísla na správnej ceste.“ Pod plánom je ďalšia správa: „Nočný pokoj. Denné svetlo. Večerná hviezda.“ Kubo ju nechal pre Ryška.",
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
      "transition": "Kocky do seba zapadli. Kubo je na linke! „Moje písmeno je L. Ryško počúva v poradí noc, deň, hviezda.“",
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
      "story": "Na telefóne sa rozsvietia tri symboly. Za nimi prebleskne oranžový chvost. „To je Ryško!“ zvolá Piko. „Pozná heslo zo svetielok. Použite poznámku z Kubovho plánu.“ Celá partia už drží linku a čaká na posledný kontakt. Vyberte správne poradie a pošlite Ryškovi signál.",
      "action": "Položte pred seba poznámku z plánu P5. Teraz rieši celý tím spolu na telefóne.",
      "task": "Stlačte symboly v poradí podľa poznámky: „Nočný pokoj. Denné svetlo. Večerná hviezda.“ Potom overte sekvenciu. Výber sa dá vymazať.",
      "materials": "Poznámka na P5; nové materiály netreba.",
      "mobile": "Tri tlačidlá mesiac, slnko a hviezda; viditeľná sekvencia, vymazanie a overenie.",
      "solution": "Mesiac → slnko → hviezda. Ryško odhalí, že priechod je v ochrannom režime po výpadku.",
      "hints": [
        "Nočný pokoj predstavuje mesiac. Čo svieti cez deň?",
        "Poradie je mesiac, slnko, hviezda."
      ],
      "parent": "Po úspechu prečítajte Ryškovo odhalenie. Všetci kamaráti sú v bezpečí; na cestu domov čakajú až do finále.",
      "transition": "Ryško je na linke a odovzdáva O. Všetkých šesť kontaktov svieti. Teraz ich priveďte domov.",
      "character": "rysko",
      "reveal": "Na paneli sa objaví Ryško. „Moje písmeno je O! Už viem, čo sa stalo. Pri výpadku sa priechod prepol do ochranného režimu. Nerozdelil nás navždy, len čaká, kým obnovíme všetkých šesť kontaktov naraz.“ Piko si vydýchne. „Teraz sme všetci na linke. Aby sme ich dostali domov, potrebujeme ešte spoločné slovo a návratové heslo. Poslednú obálku hľadajte pod stoličkou pri stole.“"
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
      "story": "Všetkých šesť tvárí je už na displeji, ale ešte stále sú na druhej strane priechodu. Piko ukáže na poslednú stopu: „Pod sedadlom jednej zo stoličiek pri stole čaká obálka 3 s pixelovou hviezdou. Vnútri je náš sľub. Každý kamarát k nemu pridal kúsok. Začiatky riadkov vám povedia, ako sa vraciame domov.“ V obálke nájdete aj kartu so šípkou cez šesť políčok. Tú si nechajte na finále.",
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
      "transition": "SPOLU. Presne tak sa Pixelkovia vracajú domov. Zostáva otvoriť priechod."
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
      "story": "Svetelný priechod čaká na posledné heslo. „Kontakty sme našli. Teraz ich spojíme,“ povie Piko. Kvak drží S, Iskra V, Šutko E, Lístok T, Kubo L a Ryško O. Karta z poslednej obálky ukazuje ich poradie podľa úloh. Šesť kamarátov, šesť písmen, jedna cesta domov. V izbe je na okamih ticho. Ktoré slovo rozžiari priechod?",
      "action": "Rozložte kartu poradia. Každý člen tímu môže prečítať jednu zo získaných indícií. Nájdete ich aj v hernom zápisníku.",
      "task": "Usporiadajte šesť písmen podľa úloh 1 až 6. Vytvorte jedno slovo a odošlite návratové heslo.",
      "materials": "Karta poradia P6 a šesť písmen v digitálnom zápisníku; voliteľne papier a ceruzka.",
      "mobile": "Finálny vstup overí SVETLO a otvorí spoločný návrat Pixelkov. Nápovedy sú dostupné aj tu.",
      "solution": "Úlohy 1–6 dali S, V, E, T, L, O → SVETLO.",
      "hints": [
        "Použite len šesť písmen. Šípka a fajka nie sú súčasťou hesla.",
        "V poradí úloh čítajte S – V – E – T – L – O."
      ],
      "parent": "Nechajte heslo vysloviť celý tím. Nie je tu skutočný časový limit ani riziko straty hry.",
      "transition": "SVETLO! Priechod sa otvára. Všetci šiesti Pixelkovia sa môžu vrátiť k Pikovi."
    },
    {
      "id": "finale",
      "title": "Celá partia je doma",
      "label": "Finále",
      "icon": "✧",
      "time": [
        3,
        0,
        0
      ],
      "story": "Z displeja vyletí šesť svetelných bodiek. Jedna za druhou prejdú otvoreným priechodom: Kvak, Iskra, Šutko, Lístok, Kubo a napokon Ryško. Piko ich prepočíta. „Jeden, dva… šiesti! Sme všetci!“ Iskra sa od radosti rozžiari, Lístok zamáva a Šutko sa spokojne usmeje. „Myslel som si, že potrebujeme silnejší signál,“ povie Piko. „Ale potrebovali sme vás. Ďakujeme, že ste nenechali nikoho strateného.“ Na obrazovke sa objaví spoločná správa: „Aj ten najmenší Pixelko patrí do partie.“ Dnes ste neotvorili iba priechod. Našli ste nových kamarátov.",
      "action": "Dajte si tímové plácnutie. Každý môže povedať jeden povzbudivý odkaz niekomu v miestnosti.",
      "task": "Všetkých osem úloh je splnených a šiesti Pixelkovia sú doma. Pomenujte svoj záchranný tím a oslávte spoločnú výpravu.",
      "materials": "Voliteľný diplom záchrancov Pixelkov na tlačovej stránke. Žiadne ďalšie pomôcky netreba.",
      "mobile": "Slávnostné finále, celá zachránená partia, zápisník a možnosť začať novú hru.",
      "solution": "Úspech tímu. Hra nemá prehratý koniec.",
      "hints": [
        "Každý z vás pomohol iným spôsobom."
      ],
      "parent": "Dajte priestor aj mladšiemu dieťaťu povedať, čím prispelo. Spýtajte sa, ktorá stopa ho najviac prekvapila.",
      "transition": "Malé postavičky. Veľké priateľstvo. Vďaka vám sú opäť spolu."
    }
  ],
  "characters": [
    {
      "id": "piko",
      "name": "Piko",
      "role": "Váš sprievodca",
      "description": "Modrý Pixelko s komunikátorom. Drží linku, kým vy hľadáte jeho partiu.",
      "tile": 0
    },
    {
      "id": "kvak",
      "name": "Kvak",
      "role": "Kačací prieskumník",
      "description": "Zvedavý zobáčik. Vždy sa ozve prvý, aj keď iba pípnutím.",
      "tile": 1
    },
    {
      "id": "iskra",
      "name": "Iskra",
      "role": "Malý plamienok",
      "description": "Zohreje každú partiu a ani vo výpadku nestratí iskru.",
      "tile": 2
    },
    {
      "id": "sutko",
      "name": "Šutko",
      "role": "Pokojný kamienok",
      "description": "Nikam sa neponáhľa. Tvrdí, že každá hádanka má pevný základ.",
      "tile": 3
    },
    {
      "id": "listok",
      "name": "Lístok",
      "role": "Zelený objaviteľ",
      "description": "Za dobrým nápadom sa natiahne ako jeho dva lístky za svetlom.",
      "tile": 4
    },
    {
      "id": "kubo",
      "name": "Kubo",
      "role": "Kockatý staviteľ",
      "description": "Zo všetkého poskladá cestu. Občas aj zo slepej uličky.",
      "tile": 5
    },
    {
      "id": "rysko",
      "name": "Ryško",
      "role": "Odvážna červená panda",
      "description": "Svoju partiu nikdy neopustí. Aj tentoraz čaká na ostatných.",
      "tile": 6
    }
  ]
};
