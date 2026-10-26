# OpenGen — hotové podklady pre Seedance 2.0

Použi režim Start Image / Image to Video, pomer 9:16, zvuk ON.
Odporúčaný model na finál: Seedance 2.0. 1080p pri Seedance 2.0, ak je dostupné; 720p pri Fast.
Na priloženej snímke používateľa šípka ukazuje na Seedance 2.0, ale fajkou a v spodnej lište je vybraný Seedance 2.0 Fast.

1. Pre klip A nahraj start-a.png, nastav 8 sekúnd a vlož celý prompt-a.txt.
2. Pre klip B nahraj start-b.png, nastav 12 sekúnd a vlož celý prompt-b.txt.
3. Každý klip generuj samostatne. Neposielaj oba prompty do jedného 15-sekundového behu.
4. Spoj A a B v tomto poradí. Výsledok má približne 20 sekúnd; krátky prestrih alebo prelínačka môže spoj zjemniť.

Vytvor dva samostatné klipy. Do každého nahraj iba príslušný Start Image a vlož len prompt daného klipu. Jednotlivé portréty sú záložné referencie pre režim References a prípravu obrázkov; pri tomto postupe ich nepridávaj do generovania so Start Image. Pred spustením skontroluj model, dĺžku a cenu zobrazenú v OpenGen. Nezapínaj automatické rozšírenie promptu, ak by pridalo reč alebo zmenilo dej.

## Zvuk
Zapni generovanie zvuku. V oboch promptoch sú iba nehovorené elektronické pípnutia, jemné poskoky a zvuk brány. Žiadne hovorenie, spev, ľudské hlasy ani hudba. Hlasová záverečná reč na hernej stránke je samostatný podklad, nie súčasť tohto videa.

## Referencie
Pri Start Image použi iba príslušný hotový obrázok. Sedem samostatných portrétov v priečinku references je záloha pre alternatívny režim References a úpravu obrázkov. Do tohto behu ich nepridávaj. Režimy snímok a referencií sa v dokumentovaných integráciách Seedance používajú oddelene.

## Kontrola výsledku
- Na začiatku je presne sedem rôznych postavičiek; žiadna sa nespojí s inou ani sa nerozmnoží.
- Všetky ruky a nohy zostávajú v obraze, tváre a oblečenie sa nemenia.
- Brána sa otvára na rovnakom mieste a postavičky prechádzajú otvorom.
- Šesť kamarátov odíde skôr; modrý sprievodca zostane posledný a zamáva do kamery.
- Zvuk obsahuje iba tiché elektronické efekty, bez slov a spevu.
- Použiteľný klip si ulož; pri chybe druhého klipu neopakuj prvý.

Presný vzhľad a pohyb nie sú zaručené ani s referenciou. Pred druhým plateným behom skontroluj prvý klip. Výsledok Fast nie je zárukou rovnakého výsledku pri štandardnom modeli; pri vyššom rozlíšení vzniká nové generovanie. Pred spustením vždy použi cenu zobrazenú priamo v OpenGen.

Modelové podklady:
https://seed.bytedance.com/en/blog/seedance-2-0-official-launch
https://elevenlabs.io/docs/overview/capabilities/image-video
