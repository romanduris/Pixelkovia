PIXELKOVIA · A1–A5 · META FORMÁTY · 26.11.2026

Hotový koncept A1 dopĺňa 16 nových adaptácií A2–A5 z verzie V4.
Spolu 20 vizuálov: päť konceptov, každý v štyroch formátoch:
- 4 : 5 — 1080 × 1350 px
- 1 : 1 — 1080 × 1080 px
- 9 : 16 — 1080 × 1920 px
- 1,91 : 1 — 1200 × 628 px

Otvorte OTVORIT-NAHLAD.html. Galéria umožňuje filtrovať koncept a formát,
stiahnuť PNG, otvoriť editovateľné SVG a zapnúť kontrolu bezpečných zón.
PREHLAD-A1-A5.jpg zobrazuje všetkých 20 vizuálov naraz.

PNG sú finálne nepriehľadné súbory v sRGB. SVG sú samostatné:
obsahujú fotografickú scénu, herné vložky a fonty; text zostáva upraviteľný.
Pri úprave v grafickom editore podľa potreby nainštalujte fonty Manrope,
DM Sans a Caveat. Ich otvorené licencie sú súčasťou projektu a balíka.
Kontrolné prekrytia nie sú vo finálnych PNG.

Každý formát má vlastnú rekompozíciu pôvodnej rodinnej scény.
A1 sa nemenilo. A2–A5 zachovávajú vlastné schválené texty, rodiny,
obývačku, teplé svetlo a drobné postavičky v kompozícii.
Rekompozície a rozšírenie fotografie vznikli vstavaným imagegenom.
Presné prompty sú v prompts.json pri každom koncepte.
Ide o ilustračné reklamné scény, nie zákaznícke fotografie či recenzie.

Herné vložky používajú skutočný, fyzicky orezaný verejný materiál
path.webp alebo decoder.webp a schválený game-lock-partial.webp.
Papier aj obrazovka sú otočené smerom k rodine. Tiene pier, miestne
osvetlenie papiera a odlesky skla sú zachované natívnymi maskami.
Kompletné pracovné listy, riešenia a funkčné QR sa nepublikujú.

Bezpečné zóny: aspoň 7 % po bokoch, spodných 22 % pre CTA/rozhranie;
Stories navyše horných 15 %. Hlavné texty aj herné vložky sú nad
spodnou zónou. V samotnej grafike nie je nakreslené CTA tlačidlo.

Overenie v repozitári:
node assets/social/a1-a5-meta-formats-2026-11-26/prepare.cjs
node assets/social/a1-a5-meta-formats-2026-11-26/verify.cjs
Jednotlivé koncepty majú aj vlastné render.cjs a verify.cjs.
artwork-index.json a artwork.json obsahujú rozmery, kontrolné súčty,
skutočne merané hranice textov a pôvod herných podkladov.

Súbory sú autorské reklamné podklady. Reklamy nie sú aktivované.
assets/social sa nevkladá do verejného buildu aplikácie.
Web hry: https://pixelkovia.rodulab.com
