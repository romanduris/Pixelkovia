# Záverečná rozlúčka a scenár pre OpenGen

QR na pracovnom liste úlohy 7 otvorí zadanie hesla. Rozlúčka sa sprístupní po jeho správnom overení. Dodané video assets/EndScene.mp4 sa prehráva po ťuknutí, so zvukom a ovládaním pauzy i opakovania. Text rozlúčky zostáva dostupný.

## Reč na nahovorenie

Dokázali ste to! Ďakujeme, kamaráti. Už môžeme ísť domov. Majte sa krásne!

Prednes: Rovnaký hlas ako v úvode. Srdečne, s úľavou a radosťou. Plynulo a prirodzene, len krátke pauzy medzi vetami, bez zrýchľovania. Cieľ 7–8 sekúnd; v 10-sekundovom videu približne od 0,5 do 8,5 s. Dĺžku po vygenerovaní overiť. Hlas je voliteľný a pridáva sa neskôr k videu; záber musí fungovať aj bez neho. cca 7–8 sekúnd · do 10-sekundového videa.

TTS zadanie:
[warm, cheerful] Dokázali ste to! Ďakujeme, kamaráti. Už môžeme ísť domov. Majte sa krásne!

Celý návod s obrázkami, nastaveniami a kopírovaním zadania je priamo v storyboard.html po rozbalení „Scenár pre OpenGen“ pri finále.

## Obrazové referencie

Na jeden 10-sekundový beh použi Start Image. Voliteľný End Image určuje rovnakú izbu po odchode partie. Ak ho vybraný model nesprístupní, stačí Start Image a rovnaký prompt. Samostatné referenčné portréty sa nepridávajú.

- assets/finale-production/start-a.png
- assets/finale-production/end-empty-room.png

## Prompt na vloženie do OpenGen

OpenGen — jeden 10-sekundový klip 9:16

1. OTVOR OPENGEN
https://opengen.ai/video-generator

2. START IMAGE — ZAČIATOK
https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site/assets/finale-production/start-a.png
Stiahni PNG a nahraj ho do Start Image. Tento obrázok určuje vzhľad celej partie aj izby.

3. END IMAGE — VOLITEĽNÝ KONIEC
https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site/assets/finale-production/end-empty-room.png
Rovnaká izba po odchode všetkých, brána dohasína. Nahraj ho do End Image, ak je toto pole dostupné pri vybranom modeli. Ak nie je dostupné, použi len Start Image a rovnaký prompt. Samostatné referenčné portréty nepridávaj.

4. NASTAVENIA
Model: Seedance 2.0 (na snímke bol vybraný Fast; skontroluj výber).
Režim: Start Image / Image to Video.
Pomer: 9:16. Dĺžka: 10 sekúnd.
Rozlíšenie: 1080p, ak je dostupné, inak 720p. Fast: 720p.
Zvuk: ON — iba nehovorené pixelkové zvuky.
End Image: nahraj end-empty-room.png, ak ho vybraný model sprístupní.
References: prázdne.
Pred spustením skontroluj cenu v OpenGen.

5. SKOPÍRUJ IBA NASLEDUJÚCI ANGLICKÝ TEXT DO PROMPTU

Animate the supplied start image as one continuous 10-second vertical 9:16 farewell shot. Preserve the exact warm apartment living room, painted pixel-art texture, lighting, fixed camera framing and all seven distinct electronic friends. Keep their original faces, bodies, colours, clothes and accessories. The blue cloud-headed screen-face guide keeps his black suit, teal tie and clipboard in his left hand. The USB character has arms and legs but no cable tail. The orange shield keeps its teal tie and cyan keyhole.

0-2 seconds: the blue membrane inside the gateway dissolves inward into a clear luminous passage. The arch stays fixed. The friends make one small joyful bounce; the tiny yellow pixel gently bobs.
2-6 seconds: the six companions take short cheerful steps through the opening in three loose pairs, giving small waves toward the viewer as they go. Keep separate silhouettes and a clear path. The yellow pixel floats through beside the microphone. Each disappears only after crossing the threshold. The blue guide stays in the room nearest the camera, facing the viewer while his companions leave; he does not follow yet.
6-9 seconds: with all six companions through, the blue guide looks toward the viewer and gives two slow warm waves with his free right hand. Preserve his cloud-shaped head and original cyan eye marks.
9-10 seconds: the blue guide turns and takes a quick final step through the nearby gateway. Only after he crosses, the passage softly closes to a subdued deep-blue pixel membrane and the cyan arch light dims, leaving one tiny cyan twinkle at the threshold. Keep the arch visible. Finish with the empty warm apartment; all seven friends and their accessories are gone. If an End Image is supplied, match that final composition precisely without an abrupt cut, dissolve of characters or camera movement.

OPTIONAL SPEECH COMPATIBILITY, 0.5-8.5 seconds: keep the blue guide facing the viewer with a warm, relaxed expression. Animate ONLY his existing small cyan mouth line with gentle short pulses, slightly opening and closing with brief pauses, then settling back to its original resting shape by 8.5 seconds. Keep the screen-face design intact: no human lips, teeth, tongue, new mouth or exaggerated talking. The movement must read as a friendly electronic expression when there is no voice, and as loosely speaking if a short voiceover is added later. Do not attempt word-level lip synchronization or generate dialogue. At 9 seconds he turns and leaves as described.

Prioritize clear farewell gestures and stable character identities over elaborate movement. Locked camera; no cuts, zoom, orbit or reframing. Start with exactly seven friends; no duplicates, new characters, merging bodies or changing accessories.

AUDIO: soft synchronized 8-bit electronic chirps, short playful bleep-bloop notes and gentle digital boings, a shimmering ascending chime when the gateway opens, two delicate electronic greeting notes during the last wave, and a soft descending chime at the end. Synthetic nonverbal pixel sound effects only. No spoken words, dialogue, singing, human voices, speech-like gibberish or background music. Warm cheerful soft volume; no loud impacts or distortion. Only the blue guide has subtle expressive mouth-line movement as directed below; every other face stays unchanged. No text, names, captions, logos or watermarks.

KONIEC TEXTU NA KOPÍROVANIE

KONTROLA VÝSLEDKU
- Na začiatku je presne sedem rôznych postavičiek; žiadna sa nespojí s inou ani sa nerozmnoží.
- Všetky ruky a nohy zostávajú v obraze, tváre a oblečenie sa nemenia.
- Brána sa otvára na rovnakom mieste a postavičky prechádzajú otvorom.
- Šesť kamarátov odíde skôr; modrý sprievodca zostane posledný a zamáva do kamery.
- Zvuk obsahuje iba tiché elektronické efekty, bez slov a spevu.
- Video má 10 sekúnd; posledné mávanie má priestor a odchod zostáva zrozumiteľný.
- Modrý sprievodca sa do 8,5 s pozerá k divákovi a jemne pohybuje iba pôvodnou tyrkysovou čiarou úst. Záber funguje s voliteľným hlasom aj bez neho.
- Na poslednom zábere je rovnaká prázdna izba s dohasínajúcou bránou; postavičky zmiznú až po prechode cez otvor.

VOLITEĽNÝ HLAS PRI STRIHU
Voliteľná samostatná TTS stopa: cieľ 7–8 sekúnd, v obraze približne 0,5–8,5 s. Pridať až pri strihu, podľa skutočnej dĺžky nahrávky. OpenGen generuje iba pixelkové efekty. Pohyb úst je jemný a orientačný, bez presného lip-syncu.
Text: Dokázali ste to! Ďakujeme, kamaráti. Už môžeme ísť domov. Majte sa krásne!

## Zapojenie hotových médií

GAME.finaleVideo: assets/EndScene.mp4. GAME.finaleAudio: null (samostatná hlasová stopa ešte nie je dodaná). Používa sa pôvodná zvuková stopa dodaného MP4, bez pridanej TTS nahrávky. Prehrávanie je ručné, zostáva na stránke a nezmení uložený postup. Video sa pri odchode zastaví. Pri chybe ostáva opakovanie pokusu aj text rozlúčky.

Zdroj textu je game-data.js. Po jeho úprave spusti node scripts/export-finale-script.cjs.
