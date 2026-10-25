# Pixelkovia — digitálne ilustrácie V6.1

Schválená sada B, Plugy bez chvosta, ochranca podľa poslednej používateľovej referencie. Hlavný obraz vychádza z obývačkového variantu 2. Piko zachováva pôvodnú obláčikovú hlavu, obrazovku s výrazom >_, oblek a tyrkysovú kravatu zo schváleného videa. Ilustrácie vznikli vstavaným image_gen, nie CLI.

## Portréty

Sedem PNG v characters/ má skutočný alfa kanál. Nahrádzajú bývalé sprite výrezy v hre, knižke, rodičovskom návode a tlačovinách. Mená sú samostatný HTML text, nie súčasť artworku. Presné prompty, referencie a zdrojové cesty sú v characters/PORTRAIT-PROMPTS.json. Pôvodné generované súbory zostávajú v úložisku generátora; historické projektové ilustrácie v Git histórii.

## Hlavná scéna

pixelkovia-room.png zobrazuje sedem kamarátov pri digitálnom stole v normálnej ľudskej obývačke. Guardy je oranžový štít s tyrkysovou kravatou a kľúčovou dierkou. Neobsahuje mená ani typografiu. Mobilná a desktopová adaptácia menia iba kompozíciu artworku pod existujúcim webovým textom; prompty sú v characters/HERO-PROMPTS.json.

Rodinné fotografie family-signal-puzzle.png a family-cipher-puzzle.png neobsahujú pôvodné postavy. Zostávajú označenými ilustračnými vizualizáciami spoločného riešenia, nie fotografiami zákazníkov ani presným zobrazením finálnych materiálov.

Mobilný funnel používa pixelkovia-room-mobile-tall.png: zvislé rozšírenie schválenej obývačky nad postavami aj pod stolom. Titulok a krátky popis sú upraviteľné HTML cez pokojnejšiu hornú časť scény, údaje o hre ležia pod stolom. Mobilná výška sa prispôsobuje viditeľnej obrazovke; horné rozšírenie sa podľa potreby oreže, aby partia so stolom aj text zostali na úvodnej obrazovke. Nákupné tlačidlo je až v ďalších častiach funnelu. Pôvodná hlavná aj desktopová ilustrácia zostávajú zachované. Obrázok vytvoril vstavaný image_gen; oba prompty a zdroj sú v characters/HERO-MOBILE-TALL-PROMPT.json.

## Tlačové a knižné scény

| Súbor v printable-scenes/ | Obsah |
| --- | --- |
| p1-miky-piko.png | Mikrofón načúva a sprievodca obnovuje spojenie. Dve postavy. |
| p2-pixi.png | Pixel svieti na dva papierové kruhy, mikrofón a sprievodca pomáhajú. |
| p3-plugy.png | USB konektor a traja kamaráti obnovujú digitálny most. |
| p4-pingy.png | Dátový posol a štyria kamaráti skladajú presne štyri prázdne pásiky. |
| p5-cipko-guardy.png | Mikročip skúma plán s tromi uzlami; celá partia obnovuje cestu k ochrancovi. |
| p6-spolocny-navrat.png | Sedem kamarátov sa vracia cez ochranný priechod, sprievodca posledný. |

Scény majú biele pozadie a pomer približne 3 : 1. Neobsahujú mená, odpovede ani typografiu. Presné prompty a kontrola postáv sú v printable-scenes/PROMPTS.json. Tie isté obrázky používajú pracovné listy, príslušné herné výsledky aj knižné ilustrácie.

miky-sheet-preview.png, náhľady v printables/ a všetky PDF sú skutočné exporty upraviteľného HTML/CSS cez scripts/export-printables.cjs, nie obrazovou AI vytvorené dokumenty. Textové mená a QR pochádzajú z dát a sú lokalizovateľné. Návod, úloh 1–7 a diplom majú každý jednu A4; balík má deväť strán.

## Médiá a font

Schválené PicoVideo.mp4 a obe pôvodné zvukové nahrávky sú byte po byte zachované. Staré názvy sú nevyhnutné archívne cesty. Nové hlasové podklady nepoužívajú konkrétne mená a čakajú na nahratie.

Caveat v fonts/Caveat.ttf zostáva pod licenciou fonts/OFL-Caveat.txt.

## Oprava svetelných uzlov — Úloha 4

`printable-scenes/p4-svetelne-uzly.png`: nová ilustrácia cez vstavaný image_gen, odvodená od schválenej skupiny piatich postáv. Kompozícia na výšku (4 : 5) zoskupuje postavy nad sebou pri oprave svetelných uzlov a mostíkov. Bez textu, mien a riešenia; Plugy nemá chvost. Presný prompt je uložený v `printable-scenes/PROMPTS.json`. Pôvodná ilustrácia štyroch pásikov zostáva archívnym assetom.
