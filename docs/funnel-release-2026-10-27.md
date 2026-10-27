# Funnel a režim čítania – 27. 10. 2026

- Publikuje sa aj predtým pripravený text, ktorý vedie spoločným zážitkom s deťmi, objavovaním a logikou. Technické podrobnosti zostávajú pri príprave a vo FAQ.
- Mobilný úvod má podľa výšky obrazovky 500–620 px. Údaje sú v poradí **45–60 min → 7–13 rokov → Jeden tím**, s doplnením 2–5 hráčov. Pixelkovia aj hlavná výzva sa zmestia do prvého zobrazenia pri kontrolovaných mobilných rozmeroch. Čas je odporúčaný priestor na spoločné hranie; podrobné FAQ naďalej vysvetľuje rozdielne tempo rodín.
- Rodinná galéria začína usmiatou skupinkou pri zadávaní kódu. Pôvodná prvá fotka je tretia. Obrázky sa nemenili.
- Desať ukážkových textov (osem päťhviezdičkových a dva štvorhviezdičkové) sa posúva prstom, šípkami aj klávesnicou. Nad sekciou a na každej karte je jasne uvedené, že ide o **ilustračné hodnotenia**, nie skutočné ani overené recenzie. Nie sú uvedení vymyslení zákazníci, dátumy, priemer hodnotení ani štruktúrované údaje recenzií.
- Ikonky sú výrezy schváleného portrétu Pika: `favicon.ico` obsahuje 16/32 px, `assets/brand/piko-32.png` a `piko-192.png` slúžia prehliadaču, `piko-180.png` záložke na domovskej obrazovke. Pôvodný portrét zostal nedotknutý.
- Atlas má hore prepínač svetlého a tmavého čítania pre rozprávku aj encyklopédiu. Voľba sa uchováva pod samostatným kľúčom `pixelkovia-atlas-reading-theme`. Pri blokovanom úložisku prepínanie funguje bez uloženia. Tlač zostáva svetlá.

## Overenie

Chromium: verejný funnel a súkromný sales/checkout v šírkach 320, 360, 390, 430, 768, 1366 a 1440 px. Overené: 9 sekcií, všetkých 19 FAQ, poradie snímok, ikonka, desať jasne označených ukážok, šípky, klávesnica, dotykové posunutie oboch galérií, obmedzenie animácií, ceny a všetky kombinácie doplnkov, neaktívna platba a zachovanie postupu. Verejné súkromné adresy vracajú 404 vrátane nových atlasových súborov.

Atlas: Chromium pri 320/390/1440 px; čítanie od prvej obrazovky, oba režimy, obnovenie voľby po načítaní, klávesnica, blokované úložisko, svetlá tlač a nezmenený text knihy aj encyklopédie.

Vizuálne skontrolované skrátené úvody na mobiloch, desktop, prvé ukážkové hodnotenie a oba režimy atlasu. WebKit sa v tomto prostredí počas testu predčasne zatvára, preto jeho kontrola nie je označená za úspešnú.

Pôvodný kontrolný súčet 176 chránených súborov sa zachoval. Pri `atlas.html` kontrola odoberá iba päť presne povolených nových odkazov na zdroje a porovnáva zvyšok s historickým originálom; pôvodný `atlas.css`, obsah knihy, ilustrácie, PDF, hra, administrácia a checkout logika sa nemenili. Verejný balík používa explicitný zoznam 28 assetov a neobsahuje atlas ani hru.

Neskoršia úprava vzorových hodnotení: pokojnejší, vecný tón, dve mierne výhrady k náročnosti a príprave. Označenie ilustračných textov zostáva viditeľné; nie sú im pripísané vymyslené zákaznícke mená.

FAQ: tlačidlo Ďalšie otázky pridáva 11 ďalších riadkov priamo do rovnakého zoznamu bez vnoreného rámčeka. Klávesnica sa presunie na prvú pridanú otázku; ovládanie na konci umožní vrátiť sa k ôsmim otázkam. Bez JavaScriptu sú všetky odpovede dostupné. Pôvodné znenie 19 otázok a odpovedí zostáva zachované.
