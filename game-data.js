window.GAME = {
  "title": "Pixelkovia: Stratený signál",
  "version": 4,
  "audio": "assets/KvakMessage.mpeg",
  "video": "assets/PicoVideo.mp4",
  "stages": [
    {
      "id": "intro",
      "title": "Správa, ktorá nemala prísť",
      "label": "Úvod – Telefón",
      "icon": "✉",
      "time": [
        4,
        0,
        0
      ],
      "action": "Otvorte Pikovu správu a zistite, čo ďalej.",
      "task": "Otvorte Pikovu správu a zistite, čo ďalej. Správu môžete otvoriť opakovane.",
      "materials": "Obálka 1 v kúpeľni; telefón s otvorenou hrou.",
      "mobile": "Celoobrazovkový displej → prichádzajúca správa → video alebo Prečítať správu → opakované otvorenie → Máme obálku.",
      "solution": "Prvá obálka čaká v kúpeľni. Miesto prezradí Pikova videospráva aj jej písaná alternatíva po otvorení správy.",
      "hints": [
        "Skúste si Pikovu správu vypočuť alebo prečítať ešte raz.",
        "Všimnite si najmä záver správy, kde Piko spomína prvú obálku.",
        "Piko spomína kúpeľňu."
      ],
      "parent": "Obálku 1 iba s celým pracovným listom P1 ukryte v kúpeľni medzi uterákmi, do skrinky s uterákmi alebo na suchú dostupnú poličku. Nie medzi lieky a čistiace prostriedky, k elektrickým zariadeniam, do práčky ani sušičky. Miesto deťom prezradí Pikova videospráva alebo jej písaná alternatíva. Nápovedy ponúkajte postupne.",
      "transition": "Pikov signál zoslabol. Nájdite Kvaka — bez jeho sluchu ostatné linky nespojíte.",
      "dramaturgy": [
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "incoming": [
        "Obrazovka telefónu na okamih zhasne.",
        "Ozve sa zvláštne pípnutie.",
        "Potom druhé.",
        "A tretie.",
        "Na displeji sa objaví nápis:",
        "NEZNÁME SPOJENIE"
      ],
      "narrative": {
        "before": [
          "Ahojte, ja som Piko! Som malý modrý Pixelko zo sveta za svetielkami vašich obrazoviek. Máme domčeky z farebných bodiek a svietiace cestičky. Po nich chodím za šiestimi kamarátmi. Každý vie niečo iné a spolu si poradíme.",
          "Dnes ráno cestičky zhasli a kamaráti sa odmlčali. Sám nezachytím slabé signály, nerozsvietim tmu ani nepostavím most medzi obrazovkami. Potrebujem zistiť, čo sa stalo, a všetkých nájsť.",
          "Nahral som vám krátku správu. Skúste sa spojiť s Kvakom, mohol by nám pomôcť!"
        ],
        "after": [
          "Ďakujem, že mi chcete pomôcť! Ja zatiaľ počúvam pri telefóne. Vy sa pozrite do kúpeľne po prvej obálke; možno už čoskoro začujem svojho kamaráta Kvaka."
        ]
      }
    },
    {
      "id": "envelope",
      "title": "Kvakove rozhádzané signály",
      "label": "Úloha 1 – Kúpeľňa",
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
      "transition": "Prečítajte si pokračovanie Kvakovho príbehu alebo si vypočujte jeho odkaz. Ďalšia obálka čaká pri okne; získané S je uložené v zápisníku.",
      "character": "kvak",
      "dramaturgy": [
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "narrative": {
        "before": [
          "Ahojte, ja som Kvak! Som žltý Pixelko s motýlikom a mám výborný sluch. V našom svete počúvam drobné pípnutia, ktoré putujú po svetelných cestičkách medzi domčekmi. Podľa nich spoznám, kto sa blíži a ktorý kamarát potrebuje pomoc. Aj úplne tiché pípnutie mi vie povedať veľa!",
          "Dnes mi však všetko zapraskalo v ušiach a správa pre Pika sa rozsypala na šesť kúskov. Piko ma nepočuje a ja nepočujem ostatných. Zostal som pri zhasnutej ceste a sám neviem zistiť, kadiaľ ísť. Potrebujem vašu pomoc, aby som sa mohol pridať k Pikovi a pomôcť hľadať ostatných.",
          "Na každom kúsku zostal dátum, čas a jedna číslica. Vystrihnite ich, otočte a zoraďte od najstaršieho po najnovší. Najprv porovnajte dátumy, pri rovnakom dátume presné časy. Číslice potom vytvoria kód môjho spojenia. Keď ho zadáte do telefónu, konečne sa budem môcť ozvať!"
        ],
        "after": [
          "Kvak! Ja vás počujem! Ďakujem za pomoc. Už som na spojení s Pikom a do vášho zápisníka posielam písmeno S. Teraz sme na hľadanie dvaja Pixelkovia a váš ľudský tím. To je oveľa lepšie, než keď som tu počúval celkom sám!",
          "Zachytil som ešte jedno tiché volanie. Myslím, že je to Iskra. Ona dokáže rozsvietiť aj tú najtmavšiu cestičku, lenže moje uši jej svetlo nenahradia. Potrebujeme ju nájsť. Ďalšia obálka čaká pri okne, tam, kde cez deň prichádza do vášho domu svetlo. Ja budem zatiaľ počúvať, či sa ozve aj niekto ďalší."
        ]
      }
    },
    {
      "id": "document",
      "title": "Iskrin dekódovací stroj",
      "label": "Úloha 2 – Pri okne",
      "icon": "◉",
      "time": [
        1,
        2,
        5
      ],
      "reward": "V",
      "answer": [
        "HLADAJ POD STOLICKAMI"
      ],
      "placeholder": "Rozlúštené miesto",
      "action": "Nájdite obálku 2 pri okne. Vyberte celý P2, vystrihnite oba kruhy a menší položte na väčší. Nastavte vonkajšie D oproti vnútornému A; stred stačí pridržať prstom.",
      "task": "Na papierovom stroji nastavte vonkajšie D oproti vnútornému A. Písmená odkazu KODGDM SRG VWROLFNDPL čítajte z vonkajšieho kruhu na vnútornom. Rozlúštite celú vetu a choďte podľa nej hľadať obálku označenú Úloha 3.",
      "materials": "P2: Iskrin dekódovací stroj s dvoma kruhmi A–Z a zašifrovanou vetou, celý v obálke 2 pri okne. P3: samostatná obálka Úloha 3 prilepená zo spodnej strany sedadla stoličky. Detské nožnice.",
      "mobile": "Papierová úloha bez zadávania a overovania odpovede. Až po nájdení obálky Úloha 3 deti ťuknú Máme obálku Úloha 3. Tým sa uloží V a sprístupní Šutko.",
      "solution": "Posun −3: KODGDM SRG VWROLFNDPL → HĽADAJ POD STOLIČKAMI. Deti hľadajú obálku Úloha 3 prilepenú zospodu sedadla. V telefóne sa neoveruje odpoveď.",
      "hints": [
        "Nastavte vonkajšie D oproti vnútornému A. Každé písmeno na vonkajšom kruhu prečítajte na vnútornom kruhu.",
        "K sa prečíta ako H, O ako L a D ako A. Prvé slovo je HĽADAJ."
      ],
      "parent": "Obálku 2 s celým P2 položte pri okne na bezpečné miesto na dosah detí. Oba kruhy vystrihujú až deti. Okno sa neotvára a na parapet sa nelezie. P3 vložte do samostatnej obálky Úloha 3 a prilepte pod sedadlo stoličky. P6 je pod inou stoličkou v uzavretej obálke 4 označenej Úloha 7 – otvoriť až po Ryškovom pozdrave.",
      "transition": "Ďakujem, že ste rozlúštili môj odkaz a našli obálku Úloha 3 pod stoličkou! Moje V si odložte. Ja sa pridávam k Pikovi a Kvakovi; teraz spoločne pomôžeme Šutkovi.",
      "character": "iskra",
      "dramaturgy": [
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu.",
        "Iskrina úloha sa rieši na papieri. Šutkova obálka Úloha 3 je pod sedadlom stoličky; obálka 4 s P6 patrí pod inú stoličku a zostáva uzavretá do záveru."
      ],
      "narrative": {
        "before": [
          "Ahojte, ja som Iskra! Som malý veselý plamienok. V našom svete rozsvecujem cestičky a malé svetielka nad dverami domčekov, aby kamaráti v tme nezablúdili. Kvak ma už začul a priviedol vás ku mne. Konečne viem, že ma niekto hľadá! Rada sa pridám k nemu aj k Pikovi.",
          "Rozsvietila som kúsok cesty a našla som na nej odkaz od Šutka. Je to náš pevný kamenný kamarát. Vie podržať most, po ktorom sa potrebujeme vrátiť domov. Ja vám môžem svietiť, ale most sama neudržím. Najprv teda musíme zistiť, kde na nás Šutko čaká.",
          "Písmená jeho odkazu sa pri rannom bliknutí posunuli. Pomôže nám môj dekódovací stroj z dvoch papierových kruhov. Vystrihnite ich a nastavte vonkajšie D oproti vnútornému A. Potom preložte celú správu. Odkaz vám sám povie, kam máte ísť hľadať ďalšiu obálku!"
        ],
        "after": [
          "Ďakujem! Rozlúštili ste môj odkaz a našli Šutkovu obálku pod stoličkou. Do zápisníka vám posielam V a pridávam sa k Pikovi a Kvakovi. Kvak nás dokáže počuť, ja nám zase posvietim. Už sa nám bude hľadať oveľa ľahšie!",
          "Keď svietim na našu cestičku, vidím, že nezmizla celá. Niektoré kúsky sa ešte slabo ligocú ako drobné farebné koráliky. Možno ich spolu opravíme. Teraz otvorte obálku označenú Úloha 3, ktorú ste našli pod stoličkou. Pomôžme Šutkovi, aby sa mohol pridať aj on."
        ]
      },
      "paperOnly": true,
      "ciphertext": "KODGDM SRG VWROLFNDPL",
      "paperAnswer": "HĽADAJ POD STOLIČKAMI"
    },
    {
      "id": "symbols",
      "title": "Šutkov uzavretý priechod",
      "label": "Úloha 3 – Pod stoličkou",
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
      "action": "Nájdite obálku označenú Úloha 3 prilepenú zo spodnej strany sedadla stoličky. Vyberte Šutkov list P3 a ceruzkou si poznačte hodnotu každého tvaru.",
      "task": "Na karte platí △ + △ = 6, ○ + △ = 5 a □ + ○ = 6. Koľko je △ + ○ + □?",
      "materials": "P3: tri rovnice a otázka. P4: štyri premiešané pásiky Lístkovho odkazu, pripravené na stole v obálke 3.",
      "mobile": "Overenie jedného čísla; potom pokyn otvoriť obálku 3 na stole.",
      "solution": "△ = 3, ○ = 2, □ = 4. Súčet je 9.",
      "hints": [
        "Dva rovnaké trojuholníky dávajú 6. Jeden má hodnotu 3.",
        "Kruh má hodnotu 2 a štvorec 4. Sčítajte 3 + 2 + 4."
      ],
      "parent": "Po rozlúštení Iskrinho odkazu otvorte samostatnú obálku Úloha 3 s P3 pod sedadlom stoličky. Obálka 3 na stole obsahuje P4 a osobitne uzavretý P5 s označením Úloha 5 – otvoriť po zložení odkazu. P6 zostáva pod inou stoličkou v obálke 4 označenej Úloha 7. Pomôžte deťom odlepiť obálku; nábytok sa nepresúva.",
      "transition": "Ďakujem! Už môžem podržať most pre vás aj pre kamarátov. Kvak počúva, Iskra nám svieti a ja udržím cestu pevnú. Lístkov odkaz nájdete v obálke 3 na stole; otvorte zatiaľ iba P4.",
      "character": "sutko",
      "dramaturgy": [
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu.",
        "Iskrina úloha sa rieši na papieri. Šutkova obálka Úloha 3 je pod sedadlom stoličky; obálka 4 s P6 patrí pod inú stoličku a zostáva uzavretá do záveru."
      ],
      "narrative": {
        "before": [
          "Ahojte, ja som Šutko! Som kamenný Pixelko. Mám silné ruky a najradšej dávam pozor, aby sa moji kamaráti dostali bezpečne cez naše malé mosty. Pod nimi sa trbliecu tisíce svetelných bodiek. Vyzerajú ako hviezdy, ale ja sa pri prechádzaní radšej držím pevného zábradlia!",
          "Vďaka vám ku mne už dolieha Kvakovo volanie a vidím Iskrino svetlo. Teraz viem, kde čakajú moji kamaráti. Chcem sa k nim pridať a podržať most pre celú partiu, lenže jeho zámok mi zatiaľ nedovolí pohnúť závorou. Rozsvietili sa na ňom tri tvary: trojuholník, kruh a štvorec.",
          "Každý tvar má vlastné číslo. V ďalšom riadku si ho stále pamätá, takže sa jeho hodnota nemení. Pomôžte mi zistiť čísla a spočítať poslednú trojicu. Výsledok zadajte do telefónu. Potom môžem skontrolovať závoru a udržať cestu pevnú, kým budeme hľadať ďalších kamarátov."
        ],
        "after": [
          "Deväť, presne tak! Ďakujem, už môžem podržať most. Pridávam sa k Pikovi, Kvakovi a Iskre a posielam vám písmeno E. Kvak počúva, Iskra svieti a ja držím cestu. Každý robíme niečo iné, ale spolu sa už dostaneme ďalej.",
          "Na konci mosta som našiel zatvorenú svetelnú bránu. Nie je rozbitá; svieti na nej starý nápis, ktorý ja neviem prečítať. Náš kamarát Lístok pozná takéto značky. Jeho odkaz čaká v obálke 3 na stole. Otvorte iba jeho pásiky P4. Kubov plán P5 si nechajte zatvorený na neskôr."
        ]
      }
    },
    {
      "id": "cipher",
      "title": "Lístkov roztrhaný odkaz",
      "label": "Úloha 4 – Stôl",
      "icon": "▤",
      "time": [
        1,
        2,
        4
      ],
      "reward": "T",
      "answer": [
        "STOL",
        "STÔL"
      ],
      "placeholder": "Miesto zo zloženého odkazu",
      "action": "Z obálky 3 na stole vyberte hornú časť listu s príbehom a štyri vopred rozstrihané pásiky P4. Zoraďte ich podľa čísiel v rohoch od 1 po 4. Môžete ich spojiť papierovou páskou.",
      "task": "Zoraďte štyri pásiky podľa čísiel v rohoch. Prečítajte zložený odkaz a do telefónu zadajte miesto, kde čaká Kubov plán. Až potom otvorte jeho samostatný obal.",
      "materials": "P4: štyri premiešané pásiky Lístkovho odkazu. P5: Kubov plán zostáva v osobitne uzavretom obale na stole až do vyriešenia úlohy 4.",
      "mobile": "Slovná odpoveď STÔL odomkne písmeno T a sprístupní Kubov plán P5 na stole.",
      "solution": "Pásiky v poradí 1–4 vytvoria STÔL / SKRÝVA / KUBOV PLÁN. / TERAZ HO OTVORTE. Odpoveď je STÔL; uznáva sa aj STOL.",
      "hints": [
        "Malé čísla v rohoch určujú poradie štyroch pásikov.",
        "Začnite pásikom s číslom 1. Veta sa začína slovom STÔL."
      ],
      "parent": "Z P4 vystrihnite štyri pásiky, premiešajte a spolu s hornou časťou listu s príbehom a obrázkami vložte do obálky 3 na stole. P5 nechajte osobitne uzavretý s označením Úloha 5 – otvoriť po zložení odkazu.",
      "transition": "STÔL ukázal miesto ďalšej stopy. Lístok varuje: nič neotvárajte nasilu. Na stole otvorte samostatný obal s Kubovým plánom P5 a nájdite bezpečnú cestu.",
      "character": "listok",
      "dramaturgy": [
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "narrative": {
        "before": [
          "Ahojte, ja som Lístok! Som zelený Pixelko a zbieram príbehy a staré značky nášho sveta. Mám knižku s drobnými svietiacimi písmenami. Keď sa v nej otvorí správna stránka, písmenká jemne zašumia ako listy vo vetre. Šutko mi poslal nápis zo zatvorenej brány a ja ho skúsim prečítať.",
          "Aby sme sa dostali domov, potrebujeme aj Kuba, nášho staviteľa. Vedel som, kde nechal svoj plán, a napísal som vám odkaz. Pri rannom bliknutí sa mi však papier roztrhol na štyri pásiky! Teraz sa mi slová poprehadzovali a veta vyzerá ako moja polička po veľkom kýchnutí.",
          "Našťastie zostali v rohoch malé čísla. Usporiadajte pásiky od jednotky po štvorku a prečítajte moju správu. Do telefónu napíšte miesto, kde čaká Kubov plán. Ja zatiaľ nájdem správnu stránku v knižke. Vy mi opravíte odkaz a ja pomôžem kamarátom pochopiť, prečo je brána zatvorená."
        ],
        "after": [
          "Ďakujem! Môj odkaz už zase dáva zmysel a vám patrí písmeno T. Teraz som s Pikom, Kvakom, Iskrou a Šutkom. Našli sme sa vďaka vašej pomoci! A ja už viem, čo nám brána oznamuje: OCHRANA AKTÍVNA. Znamená to, že nás chráni a máme sa najprv všetci pripraviť na návrat.",
          "Nemusíme ju búrať ani sa jej báť. Potrebujeme pevnú cestu až k nej, aby po nej prešiel každý kamarát. Otvorte teraz samostatný obal s Kubovým plánom P5 na stole. Kubo vie spájať aj také diely, s ktorými si moje papierové stránky vôbec neporadia!"
        ]
      }
    },
    {
      "id": "maze",
      "title": "Kubova cesta domov",
      "label": "Úloha 5 – Stôl",
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
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "narrative": {
        "before": [
          "Ahojte, ja som Kubo! Som fialový Pixelko a staviam naše cestičky. Moje diely do seba pekne zapadajú: klik, klak a máme mostík! V našom svete sú niektoré cesty tenké ako nitka a iné vyzerajú ako svietiace tunely. Po rannom bliknutí sa ich časti rozpojili a kamaráti zostali ďaleko od seba.",
          "Vy ste ma našli cez Lístkov odkaz a ja sa teraz môžem pridať k ostatným. Kvak počúva, Iskra svieti, Šutko drží most a Lístok už prečítal pravidlá brány. Ja by som rád opravil posledný kúsok cesty, lenže musím nájsť správne spojenie. Nemôžem poslať kamarátov do slepej uličky!",
          "Pomôžte mi s papierovým plánom. Potrubie na obrázku ukazuje našu cestu: sledujte ho od vstupu až k jadru. Niektoré odbočky sa končia naslepo, tie preskočte. Tri čísla na správnej trase zadajte do telefónu. Ja podľa nich spojím diely tak, aby sme sa po ceste mohli vrátiť všetci."
        ],
        "after": [
          "Dva, štyri, šesť! Klik, klak, posledné diely držia. Ďakujem, stavitelia! Do zápisníka vám pridávam L. Teraz už máme spoločnú cestu a sme na nej spolu s Pikom, Kvakom, Iskrou, Šutkom a Lístkom. Bez ich pomoci by som svoje diely nemal kam pripevniť.",
          "Chýba nám ešte Ryško. Pri bráne vidím jeho malé oranžové svetielko. Ryško stráži naše tajomstvo a potrebuje spoznať, že sa blížia priatelia. Pod plán som vám napísal náš pozdrav. Zostaňte pri stole a použite ho pri ďalšej úlohe v telefóne; novú obálku teraz nehľadajte."
        ]
      }
    },
    {
      "id": "digital",
      "title": "Ryškovo tajomstvo",
      "label": "Úloha 6 – Stôl",
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
      "transition": "Ďakujem za pozdrav! Teraz sme všetci na spojení. Posledný odkaz nájdete v obálke 4 označenej Úloha 7 pod inou stoličkou pri stole.",
      "character": "rysko",
      "dramaturgy": [
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "narrative": {
        "before": [
          "Ahojte, ja som Ryško! Som oranžový líščí Pixelko a strážim tajomstvo nášho sveta. Z našej strany obrazovky vidím drobné svetielka, ale z vašej strany vyzerajú len ako obyčajný obraz. Tak je to správne: naše domčeky a cestičky zostávajú bezpečne ukryté a my sa môžeme pokojne hrať.",
          "Dnes ráno som videl, ako svetielka zablikali a kamaráti sa mi stratili z dohľadu. Teraz ku mne prichádza svetlo po ceste, ktorú Kubo opravil. Možno ste to vy s Pikom a ostatnými! Ešte vás dobre nepočujem. Potrebujem náš známy pozdrav, aby som vedel, že na druhej strane čakajú moji priatelia.",
          "Kubo vám ho nechal pod svojím plánom. Prečítajte tri krátke vety a ku každej vyberte jeden symbol v telefóne. Dodržte poradie a odošlite mi pozdrav. Potom sa budem môcť pridať aj ja a vysvetlím vám, prečo sa naša brána zatvorila. Už mi chýbajú kamarátove hlasy!"
        ],
        "after": [
          "To ste vy! Ďakujem za pozdrav, už vás počujem a konečne sa môžem pridať. Posielam vám O. Teraz sme tu všetci: ja, Piko, Kvak, Iskra, Šutko, Lístok aj Kubo. Vy ste nám pomohli znovu sa nájsť a každý kamarát pridal niečo, čo ostatní sami nedokážu.",
          "Prezradím vám, čo sa stalo: keď ráno cesty zablikali, naša svetelná brána sa automaticky uzavrela. Chránila naše domčeky, aby ich nikto zvonku nezbadal. Teraz ju môžeme pripraviť na návrat. Najprv si však pripomenieme náš spoločný sľub. Obálka 4 označená Úloha 7 čaká pod inou stoličkou pri stole; túto stopu sme si nechali na záver."
        ]
      }
    },
    {
      "id": "search",
      "title": "Sľub Pixelkov",
      "label": "Úloha 7 – Pod stoličkou",
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
      "action": "Nájdite obálku 4 pod sedadlom inej dostupnej stoličky pri stole než pri úlohe 3. Má označenie Úloha 7 – otvoriť až po Ryškovom pozdrave. Vyberte sľub Pixelkov a kartu poradia.",
      "task": "Prečítajte prvé písmeno každého z piatich riadkov zhora nadol. Získané slovo potvrďte v telefóne. Kartu poradia si odložte na finále.",
      "materials": "P6: päť viet začínajúcich S, P, O, L, U a karta „Písmená úloh 1 → 2 → 3 → 4 → 5 → 6“; obálka 4.",
      "mobile": "Overí slovo SPOLU a uloží kartu poradia do zápisníka.",
      "solution": "Prvé písmená viet tvoria SPOLU. Karta určuje poradie šiestich nazbieraných písmen podľa úloh.",
      "hints": [
        "Piko zdôraznil začiatky. Pozrite sa na prvé písmeno každého riadka.",
        "Písmená sú S, P, O, L, U."
      ],
      "parent": "Obálku 4 s P6 prilepte pod inú stoličku než P3. Označte ju Úloha 7 – otvoriť až po Ryškovom pozdrave. Ak ju deti nájdu počas úlohy 2, nechajte ju zatvorenú. Dieťa nemá presúvať ťažký nábytok; pomôžte s odlepením obálky.",
      "transition": "SPOLU. Domov sa vráti každý, aj Piko. Karta P6 určuje poradie písmen z úloh 1 až 6.",
      "dramaturgy": [
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "narrative": {
        "before": [
          "Ahojte, tu som zase ja, Piko! Pozrite, koľko nás už stojí spolu na svietiacej ceste. Na začiatku som pri telefóne čakal celkom sám. Teraz počujem Kvaka, vidím Iskrino svetlo a vedľa mňa sú Šutko, Lístok, Kubo aj Ryško. Vy ste nás postupne našli a pomohli každému, kto niečo sám nezvládol.",
          "K domčeku už je to len cez poslednú bránu. Ja však neviem svietiť ako Iskra, podržať most ako Šutko ani opravovať spoje ako Kubo. Každý z nás potrebuje ostatných. Aj preto máme v našom svete jeden starý sľub: keď sa niekto stratí, kamaráti ho nenechajú samého.",
          "Ten sľub nájdete na papieri z poslednej obálky. Prečítajte prvé písmeno každého z piatich riadkov, pekne zhora nadol. Vytvoria slovo, ktoré nám pripomenie, ako sa vrátime domov. Potvrďte ho v telefóne a kartu zo spodnej časti listu si odložte. Ešte nám pri poslednom kroku pomôže!"
        ],
        "after": [
          "SPOLU! Presne tak, ďakujem. Sám by som kamarátov nenašiel, ale s vami sme to dokázali. Teraz sa o návrat postaráme všetci. Každý si nájde svoje miesto pri ceste a ja skontrolujem, či nikto nechýba. Nikam sa neponáhľame; dôležité je, aby sme prešli celá partia.",
          "Zostáva nám posledná spoločná správa pre bránu. Šesť kamarátov vám za pomoc poslalo šesť písmen. Na spodnej časti P6 je karta, podľa ktorej ich zoradíte. Zostaňte pri poslednom liste a pripravte si aj tímový zápisník v telefóne. Už sme naozaj blízko domova!"
        ]
      }
    },
    {
      "id": "code",
      "title": "Heslo, ktoré spája",
      "label": "Úloha 8 – Pod stoličkou",
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
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "narrative": {
        "before": [
          "Ahojte, stále som tu ja, Piko. Už vidím svetielka našich domčekov na druhej strane brány! Kvak počúva, či je cesta voľná, Iskra nám svieti, Šutko pevne drží most, Lístok číta značky a Kubo kontroluje spoje. Ryško dáva pozor na naše tajomstvo. Ja počítam kamarátov, aby sme sa vrátili všetci.",
          "Každý je pripravený urobiť svoju časť. Keby Iskra svietila sama, most by nikto nedržal. Keby bol most pevný, ale cesta tmavá, nevedeli by sme, kadiaľ ísť. Teraz sme však spolu a môžeme si navzájom pomôcť. Chýba nám už iba spoločný signál, že sme pripravení vyraziť.",
          "Zložte ho zo šiestich písmen, ktoré ste získali od kamarátov. Karta na P6 ukazuje ich poradie podľa úloh. Písmená nájdete aj v zápisníku telefónu. Vyslovte heslo celým tímom a potom ho odošlite. Ja prejdem posledný a pred odchodom sa vám ešte poriadne zamávam!"
        ],
        "after": [
          "SVETLO! Funguje to, ďakujem! Ja už vidím celú cestu až k našim dverám. Kamarátom dávam znamenie, že môžeme vyraziť: Kvak počúva, Iskra svieti, Šutko drží most a ostatní pomáhajú pri bráne. Každý je potrebný, aj váš tím!",
          "Počujem kamarátov: „Piko. Poď.“ Už na mňa čakajú! Ja som ešte raz všetkých spočítal a idem za nimi ako posledný. Potvrďte posledný krok, nech vám môžem ukázať, že sme sa dostali domov všetci."
        ]
      }
    },
    {
      "id": "finale",
      "title": "Tajomstvo zostáva doma",
      "label": "Finále – Domov",
      "icon": "✧",
      "time": [
        3,
        0,
        0
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
        "Postavička hovorí v prvej osobe. Deti pomáhajú kamarátom postupne sa nájsť; každý pridá vlastnú schopnosť a domov sa vrátia spolu."
      ],
      "invitation": [
        "Ešte som sa vám ozval ako maličká modrá bodka v rohu obrazovky.",
        "Mám pre vás posledný krátky odkaz:",
        "„Psst! Ešte niečo som vám zabudol dať.“",
        "„Ak chcete vedieť, ako vyzerá náš domov, čo robíme celý deň a prečo si Kvak nikdy nevie nájsť obe papuče, pripravil som pre vás náš Tajný atlas.“",
        "„Je to darček za pomoc. Môžete si ho prečítať dnes, zajtra alebo kedykoľvek sa k nám budete chcieť vrátiť.“",
        "[OBJAVIŤ TAJNÝ SVET PIXELKOV]",
        "Ešte vám raz zablikám modrým svetielkom.",
        "Potom sa už vrátim za kamarátmi.",
        "Ale možno vám niekedy zamávam znova!",
        "Ja si vašu pomoc zapamätám a vy už poznáte naše najdôležitejšie tajomstvo.",
        "So svojimi kamarátmi som možno bližšie, než si myslíte."
      ],
      "narrative": {
        "before": [
          "Ahojte, tu je Piko z domu! Ja aj všetci moji šiesti kamaráti sme sa bezpečne vrátili. Zase vidím naše farebné domčeky a počujem veselé pípnutia na cestičkách. Tentoraz to nie je volanie o pomoc. To vás Kvak zdraví a ostatní sa pridávajú!",
          "Ďakujem vám za každý nájdený odkaz aj za to, že ste si pomáhali. Vy ste spojili našu partiu a my sme potom spojili svoje schopnosti. Sám by som to nedokázal. Teraz už viem, že keď sa cesta stratí, môžem poprosiť kamarátov a hľadať ju spolu s nimi.",
          "Náš svet zostane ukrytý za svetielkami obrazoviek, ale vy už poznáte jeho malé tajomstvo. Za pomoc som vám pripravil darček: Atlas Pixelkov. Môžete v ňom navštíviť náš svet a lepšie spoznať každého kamaráta. Najprv si však dajte tímové plácnutie. Toto dobrodružstvo sme zvládli spolu!"
        ],
        "after": [
          "Ja aj moji kamaráti vám posielame posledné ďakujeme. Naše cestičky opäť svietia a nikto nezostal sám. Keď sa najbližšie rozsvieti vaša obrazovka, možno vám z jej druhej strany práve mávam!"
        ]
      }
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
    "Kvak? Kvak! Čo to je? Kto mi lezie do signálu?!",
    "Počkajte! Ja vás počujem! Vy ste obnovili moje spojenie?!",
    "Ľudia?! Naozajstní ľudia?! Kvak! Toto musím povedať Pikovi!",
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
  ],
  "voiceScripts": {
    "piko": {
      "title": "PIKO – úvodná videospráva",
      "duration": "cca 7 sekúnd",
      "model": "ElevenLabs v3",
      "prompt": "[curious, whispering] Haló? Vidíte ma?\n\n[surprised, excited] Ja som Piko!\n\n[worried, urgent] Potrebujem pomoc!\n\n[panicked, speaking quickly] Obálka jedna… v kúpeľni! Rýchlo!\n\n[connection breaking, voice fading] Ah—\n\nCharakter hlasu: Mladý, mierne vyššie položený mužský hlas. Zo začiatku zvedavý, potom prekvapený a na konci naliehavý až vystrašený. Posledné slová majú znieť ako prerušované spojenie."
    },
    "kvak": {
      "title": "KVAK – prvá správa po obnovení spojenia",
      "duration": "cca 45–60 sekúnd",
      "model": "ElevenLabs v3",
      "prompt": "[confused, startled] Kvak? Kvak! Čo to je? Kto mi lezie do signálu?!\n\n[surprised, excited] Počkajte! Ja vás počujem! Vy ste obnovili moje spojenie?!\n\n[amazed] Ľudia?! Naozajstní ľudia?! Kvak! Toto musím povedať Pikovi!\n\n[happy, relieved] Jééj! Už ho vidím! Piko je tu! Konečne sme zase v spojení!\n\n[grateful] Ďakujem vám! Bez vás by som sa s ním nespojil!\n\n[more serious, mysterious] Ale niečo mi stále nejde do hlavy. Tesne predtým, ako všetko zablikalo, som zachytil zvláštny signál. Opakoval sa stále dookola. Určite to nebola náhoda.\n\n[curious, hopeful] Myslím, že Iskra by nám mohla pomôcť. Ona vie nájsť aj to, čo ostatní nevidia.\n\n[playful, conspiratorial] Zachytil som jej posledný odkaz… len sa nám roztrhal na kúsky!\n\n[encouraging, energetic] Nájdite ďalšiu obálku tam, kde cez deň do vášho domu prichádza svetlo!\n\n[cheerful] Kvak! A ešte raz ďakujem, kamaráti!\n\nCharakter hlasu: Veselý, energický, trochu komický kačací hlas. Spočiatku zmätený, po obnovení spojenia nadšený, pri zmienke o zvláštnom signáli záhadný a na konci povzbudzujúci."
    }
  },
  "pikoMessage": [
    "Haló? Vidíte ma?",
    "Ja som Piko!",
    "Potrebujem pomoc!",
    "Obálka jedna… v kúpeľni! Rýchlo!",
    "Ah—"
  ]
};
// Keep scene readers and previews on the same first-person story source.
for (const stage of window.GAME.stages) {
  stage.story = stage.narrative.before.map(paragraph => [paragraph]);
  stage.resolution = stage.id === 'finale' ? [] : stage.narrative.after.map(paragraph => [paragraph]);
}
window.GAME.call = window.GAME.stages[0].story;
