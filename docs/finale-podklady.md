# Záverečná rozlúčka a scenár pre OpenGen

QR na pracovnom liste úlohy 7 otvorí zadanie hesla. Rozlúčka sa sprístupní po jeho správnom overení. Kým nie sú dodané médiá, hra používa text rozlúčky; nevytvára sa zástupné video ani nahrávka.

## Reč na nahovorenie

Dokázali ste to! Všetci sme opäť spolu a cesta domov svieti. Ďakujeme, že ste nás nenechali samých.

Každý z vás pomohol — dobrým nápadom, odvahou alebo podporou kamaráta. Teraz sa môžeme bezpečne vrátiť do nášho sveta.

Keď nabudúce zabliká malé svetielko, možno vás len zdravíme. Majte sa krásne, kamaráti. A nezabudnite: spolu dokážeme viac!

Prednes: Rovnaký hlas ako v úvode. Srdečne, s úľavou a radosťou. Záver povedať pokojne, bez naliehavosti. cca 25–30 sekúnd.

## Obrazové referencie

Na každý z dvoch behov použi jeho hotový Start Image. Samostatné portréty sú záložné podklady; nekombinujú sa s týmto režimom. Názvy sú len označením súborov; do videa sa nepíšu.

- assets/finale-production/start-a.png
- assets/finale-production/start-b.png

- assets/characters/piko.png
- assets/characters/miky.png
- assets/characters/pixi.png
- assets/characters/plugy.png
- assets/characters/pingy.png
- assets/characters/cipko.png
- assets/characters/guardy.png
- assets/printable-scenes/p7-navrat-portrait.png

## Prompt na vloženie do OpenGen

OpenGen / Seedance 2.0 — dva klipy 9:16, spolu 20 sekúnd.

Vytvor dva samostatné klipy. Do každého nahraj iba príslušný Start Image a vlož len prompt daného klipu. Jednotlivé portréty sú záložné referencie pre režim References a prípravu obrázkov; pri tomto postupe ich nepridávaj do generovania so Start Image. Pred spustením skontroluj model, dĺžku a cenu zobrazenú v OpenGen. Nezapínaj automatické rozšírenie promptu, ak by pridalo reč alebo zmenilo dej.

MODEL A ZVUK
Seedance 2.0; 1080p pri Seedance 2.0, ak je dostupné; 720p pri Fast. Zvuk: ON — iba nehovorené pixelkové zvuky a jemné efekty

KLIP A — 8 SEKÚND
Start Image: assets/finale-production/start-a.png

Animate the supplied start image as one continuous 8-second vertical 9:16 shot. Preserve its exact warm apartment living room, painted pixel-art texture, lighting, camera framing and all seven distinct electronic characters. Keep every character's original face, body, colours, clothes and accessories. The blue cloud-headed screen-face guide keeps his black suit, teal tie and clipboard. The USB character has arms and legs but no cable tail. The orange shield keeps its teal tie and cyan keyhole.

0-2 seconds: the blue pixel membrane inside the gateway softly dissolves inward, opening a clear luminous passage; the arch remains fixed in place.
2-5 seconds: all seven friends make one small joyful bounce, keeping their feet near their original spots; the floating yellow pixel gently bobs. Everyone stays fully visible in the room.
5-8 seconds: the friends smile and wave slowly toward the viewer. The blue guide waves with his free right hand. Near the end the six companions gently turn toward the open gateway while the blue guide remains nearest the camera. Nobody crosses the gateway in this clip.

Camera stays locked; no cuts, zoom, orbit or reframing. Preserve the number of characters and their separate silhouettes throughout.

AUDIO: synchronized quiet 8-bit electronic chirps and short playful bleep-bloop notes, soft springy digital boings for the little bounce, a gentle ascending shimmering chime as the gateway opens. These are synthetic nonverbal sound effects only. No spoken words, dialogue, singing, human vocalizations or speech-like gibberish. No background music. Warm, cheerful, soft volume; no loud impacts or harsh distortion. No talking mouth movements. No text, captions, names, logos or watermarks.

KLIP B — 12 SEKÚND
Start Image: assets/finale-production/start-b.png

Animate the supplied start image as one continuous 12-second vertical 9:16 farewell shot. Preserve the exact apartment, rug, open cyan gateway, painted pixel-art style, fixed camera and identities of all seven existing electronic friends. The blue cloud-headed screen-face guide in a black suit and teal tie is the nearest character and must remain the last one in the room. He holds his clipboard in his left hand. Do not introduce any new characters or duplicate any friend.

0-6 seconds: the six companions nearest the open gateway take short, cheerful bouncy steps through it, in three loose pairs along the clear path. They remain separate, keep their shapes and pass through the actual opening, disappearing only after crossing its threshold. The tiny floating yellow pixel drifts through beside the microphone. The blue guide waits in the foreground and watches them safely pass.
6-9 seconds: once all six are through, the blue guide turns toward the viewer, pauses and gives two slow warm waves with his free right hand. His cloud-shaped head and cyan screen-face marks remain unchanged.
9-12 seconds: the blue guide turns back and takes a few small bouncy steps through the gateway. Only after he crosses, the passage softly closes and the cyan light gently dims to one tiny twinkle. Hold the empty cozy room briefly.

Locked camera, no cuts, zoom or camera motion. Keep the original gateway location, character scale, anatomy and accessories. The USB has no cable tail.

AUDIO: soft synchronized digital footstep ticks and playful 8-bit chirps for the companions; two delicate electronic greeting notes during the guide's final wave; a quiet descending shimmering chime when the gateway closes. Synthetic nonverbal pixel sounds only. No words, dialogue, singing, human voices, speech-like gibberish or background music. No loud or frightening effects. No talking mouths. No text, names, subtitles, logos or watermarks.

KONTROLA PRED ĎALŠÍM PLATENÝM GENEROVANÍM
- Na začiatku je presne sedem rôznych postavičiek; žiadna sa nespojí s inou ani sa nerozmnoží.
- Všetky ruky a nohy zostávajú v obraze, tváre a oblečenie sa nemenia.
- Brána sa otvára na rovnakom mieste a postavičky prechádzajú otvorom.
- Šesť kamarátov odíde skôr; modrý sprievodca zostane posledný a zamáva do kamery.
- Zvuk obsahuje iba tiché elektronické efekty, bez slov a spevu.
- Použiteľný klip si ulož; pri chybe druhého klipu neopakuj prvý.

## Zapojenie hotových médií

Hotové video MP4 s nehovorenými pixelkovými zvukmi a prípadný samostatný hlas MP3 patria do assets/. Polia GAME.finaleVideo a GAME.finaleAudio zatiaľ zostávajú null. Po dodaní sa uvedú skutočné cesty; ovládanie je ručné, prehrávanie neopúšťa stránku a text rozlúčky zostáva dostupný. Nevkladaj cestu k neexistujúcemu súboru.

Zdroj textu je game-data.js. Po jeho úprave spusti node scripts/export-finale-script.cjs.
