# Záverečná rozlúčka a scenár pre OpenGen

QR na pracovnom liste úlohy 7 otvorí zadanie hesla. Rozlúčka sa sprístupní po jeho správnom overení. Kým nie sú dodané médiá, hra používa text rozlúčky; nevytvára sa zástupné video ani nahrávka.

## Reč na nahovorenie

Dokázali ste to! Všetci sme opäť spolu a cesta domov svieti. Ďakujeme, že ste nás nenechali samých.

Každý z vás pomohol — dobrým nápadom, odvahou alebo podporou kamaráta. Teraz sa môžeme bezpečne vrátiť do nášho sveta.

Keď nabudúce zabliká malé svetielko, možno vás len zdravíme. Majte sa krásne, kamaráti. A nezabudnite: spolu dokážeme viac!

Prednes: Rovnaký hlas ako v úvode. Srdečne, s úľavou a radosťou. Záver povedať pokojne, bez naliehavosti. cca 25–30 sekúnd.

## Obrazové referencie

Na jeden 10-sekundový beh použi hotový Start Image. Samostatné portréty sú záložné podklady; nekombinujú sa s týmto režimom. Názvy sú len označením súborov; do videa sa nepíšu.

- assets/finale-production/start-a.png

- assets/characters/piko.png
- assets/characters/miky.png
- assets/characters/pixi.png
- assets/characters/plugy.png
- assets/characters/pingy.png
- assets/characters/cipko.png
- assets/characters/guardy.png
- assets/printable-scenes/p7-navrat-portrait.png

## Prompt na vloženie do OpenGen

OpenGen / Seedance 2.0 — jeden 10-sekundový klip 9:16.

Vytvor jeden 10-sekundový klip. Nahraj start-a.png ako Start Image a vlož celý prompt-a.txt. Samostatné portréty sú záložné podklady; do tohto behu ich nepridávaj. Nastav 9:16 a zvuk ON. Pred plateným spustením skontroluj model, dĺžku a cenu v OpenGen.

MODEL A ZVUK
Seedance 2.0; 1080p pri Seedance 2.0, ak je dostupné; 720p pri Fast. ON — iba nehovorené pixelkové zvuky a jemné efekty

Start Image: assets/finale-production/start-a.png

Animate the supplied start image as one continuous 10-second vertical 9:16 farewell shot. Preserve the exact warm apartment living room, painted pixel-art texture, lighting, fixed camera framing and all seven distinct electronic friends. Keep their original faces, bodies, colours, clothes and accessories. The blue cloud-headed screen-face guide keeps his black suit, teal tie and clipboard in his left hand. The USB character has arms and legs but no cable tail. The orange shield keeps its teal tie and cyan keyhole.

0-2 seconds: the blue membrane inside the gateway dissolves inward into a clear luminous passage. The arch stays fixed. The friends make one small joyful bounce; the tiny yellow pixel gently bobs.
2-6 seconds: the six companions take short cheerful steps through the opening in three loose pairs, giving small waves toward the viewer as they go. Keep separate silhouettes and a clear path. The yellow pixel floats through beside the microphone. Each disappears only after crossing the threshold. The blue guide waits in the room nearest the camera; he does not follow yet.
6-9 seconds: with all six companions through, the blue guide looks toward the viewer and gives two slow warm waves with his free right hand. Preserve his cloud-shaped head and cyan screen-face marks.
9-10 seconds: the blue guide turns and takes a quick final step through the nearby gateway. Only after he crosses, the passage light gently dims. Keep the arch visible.

Prioritize clear farewell gestures and stable character identities over elaborate movement. Locked camera; no cuts, zoom, orbit or reframing. Start with exactly seven friends; no duplicates, new characters, merging bodies or changing accessories.

AUDIO: soft synchronized 8-bit electronic chirps, short playful bleep-bloop notes and gentle digital boings, a shimmering ascending chime when the gateway opens, two delicate electronic greeting notes during the last wave, and a soft descending chime at the end. Synthetic nonverbal pixel sound effects only. No spoken words, dialogue, singing, human voices, speech-like gibberish or background music. Warm cheerful soft volume; no loud impacts or distortion. No talking mouths. No text, names, captions, logos or watermarks.

KONTROLA VÝSLEDKU
- Na začiatku je presne sedem rôznych postavičiek; žiadna sa nespojí s inou ani sa nerozmnoží.
- Všetky ruky a nohy zostávajú v obraze, tváre a oblečenie sa nemenia.
- Brána sa otvára na rovnakom mieste a postavičky prechádzajú otvorom.
- Šesť kamarátov odíde skôr; modrý sprievodca zostane posledný a zamáva do kamery.
- Zvuk obsahuje iba tiché elektronické efekty, bez slov a spevu.
- Video má 10 sekúnd; posledné mávanie má priestor a odchod zostáva zrozumiteľný.

## Zapojenie hotových médií

Hotové video MP4 s nehovorenými pixelkovými zvukmi a prípadný samostatný hlas MP3 patria do assets/. Polia GAME.finaleVideo a GAME.finaleAudio zatiaľ zostávajú null. Po dodaní sa uvedú skutočné cesty; ovládanie je ručné, prehrávanie neopúšťa stránku a text rozlúčky zostáva dostupný. Nevkladaj cestu k neexistujúcemu súboru.

Zdroj textu je game-data.js. Po jeho úprave spusti node scripts/export-finale-script.cjs.
