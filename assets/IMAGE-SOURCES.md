# Pixelkovia — ilustračné podklady

Vytvorené vstavaným nástrojom image_gen podľa používateľovej obrazovej referencie. Prihlasovací panel referencie nie je súčasťou ilustrácií ani aplikácie. Obrázky slúžia ako samostatné podklady pod skutočným HTML rozhraním. Pôvodné fotografie z prvej verzie sú ponechané v repozitári, aktuálne rozhranie ich nepoužíva.

## assets/pixelkovia-room.png

Use case: illustration-story. Asset type: cinematic pixel art landscape background for a Slovak family mystery adventure game website. Input image is character and style reference only; IGNORE the login overlay entirely. Create a NEW wide 3:2 illustration in the same richly textured high-quality pixel art. Ordinary cozy family living room at blue twilight transformed by a mysterious glowing violet pixel doorway at RIGHT. Seven adorable companions matching reference: a small blue cloud-headed robot with dark face screen, cyan >_ eyes, dark suit and teal tie is the guide nearest right foreground, holding a small glowing communicator; beside him six tiny companions: white duck with teal bowtie, smiling amber flame, rounded gray rock, green sprout with two leaves, stack of purple cubes with little face, orange red panda with teal scarf. All friendly, expressive, chunky coherent sprites. Characters gathered along lower RIGHT two thirds of image near a wooden table with paper envelopes and a cipher wheel, portal glow, little cyan signal particles. LEFT HALF very dark and uncluttered negative space for real HTML headline, no prominent objects there. Dark ink navy, violet, cyan, warm amber lamp. Detailed charming indie mystery adventure art, crisp pixel edges and subtle dithering. No text, no letters, no UI, no login, no logos, no children, no humans, no horror. The image is artwork only, never a website screenshot.

## assets/pixelkovia-atlas.png

Use case: illustration-story. Asset type: character portrait sprite atlas for family pixel-art mystery game. Reference image is visual reference of the SEVEN characters only, ignore its login interface. Produce a perfectly regular 4 column by 2 row GRID of 8 equal SQUARE tiles, overall 2:1 landscape image. Each tile has flat very dark ink navy #10152b background, no borders. Each character centered FULL BODY with clear padding, charming richly shaded crisp pixel art matching reference. Tiles in reading order: TOP LEFT blue cloud-headed robot guide Piko, cyan >_ screen face, black suit white shirt teal tie and tiny communicator. TOP 2: white little duck with orange bill and teal bow tie. TOP 3: cute orange amber flame with black dot eyes smiling, tiny feet. TOP 4: friendly rounded gray stone with little smile and feet. BOTTOM LEFT: green sprout creature round head with two leaves, happy face and little body. BOTTOM 2: three stacked purple voxel cubes with expressive small dark face and feet. BOTTOM 3: cute orange red panda, pale cheeks, pointed ears, striped tail and teal scarf. BOTTOM 4: small glowing cyan and violet pixel portal ring with golden star in center, no character. Each character large but WITHIN its own tile. Consistent scale, same eye height around tile center, dark purple/blue ambient light warm outlines, limited palette, no typography, no labels, no UI, no sheet header, no watermark. The atlas will be consumed through CSS background-size 400% 200%, so exact equal tile positions are critical.

Atlas: 4 stĺpce × 2 riadky. Piko, Kvak, Iskra, Šutko / Lístok, Kubo, Ryško, dekoratívny priechod. Zobrazuje sa cez CSS background-position, bez úprav zdrojovej bitmapy.

## Fonty

Caveat je lokálne pribalený v assets/fonts/Caveat.ttf s licenciou OFL-Caveat.txt. Ostatné webové fonty majú systémovú zálohu. Herné mechaniky aj materiály fungujú bez siete.

## Predajná prezentácia · ilustračné rodinné scény

Vytvorené vstavaným nástrojom `image_gen` (nie CLI). Ide o ilustračné vizualizácie rodinnej aktivity, nie fotografie reálnych zákazníkov ani presné vyobrazenie finálnych tlačovín. Popisky na stránke to uvádzajú. Pôvodná titulná ilustrácia a oficiálne postavy zostali zachované.

### assets/family-signal-puzzle.png

Use case: photorealistic-natural. Asset type: illustrative lifestyle photograph for a Slovak at-home family mystery game sales page, landscape 3:2. Overhead editorial photograph of a warm wooden dining table in a cozy real family home. Only hands of two school-age children and one parent are visible, no faces. The children are collaboratively arranging six small white paper signal cards printed with dark navy thin outlines and tiny date-and-time-like marks, one hand moves a card, another points, pencil and a pale kraft paper envelope nearby, a white A4 instruction sheet with dark blue framing partly visible. A phone sits unobtrusively in upper corner with an abstract blue light, no readable UI. Tactile white paper, a little creative mess, genuine shared concentration and play. Warm natural window light, touches of deep navy and muted violet, premium candid family activity photography, realistic anatomically correct hands. No legible words or numerals, no visible solutions, no invented mascots, no branding, no watermark, no collage, no text overlay. Frame for a generous full-width website image.

### assets/family-cipher-puzzle.png

Use case: photorealistic-natural. Asset type: illustrative lifestyle photograph for a Slovak family mystery game product page, landscape 3:2. Close view at a 45-degree angle over a light wooden table in a cozy home: a child's hands carefully rotate two concentric hand-cut white paper cipher wheels while an adult hand steadies the outer wheel. Dark navy fine outlined alphabet-like small markings on the rings, no legible answer or word. Nearby a pencil, two folded white puzzle strips and a kraft paper envelope. Hands and practical paper craft are the main story, faces outside frame. Beautiful warm window light from left, quiet violet blue shadows, premium natural family activity photography. Realistic hands with accurate anatomy, ordinary accessible home materials, tangible and inviting. No readable text, no logos, no watermarks, no invented characters, no screens taking focus, no collage, no text overlay.

### assets/kvak-sheet-preview.png a assets/printables/*.pdf

Skutočný náhľad a jednostranové A4 PDF sú exportované z koreňového `printables.html` a jeho CSS cez `scripts/export-printables.cjs`. Nie sú generované obrazovou AI; zdrojom pravdy zostáva HTML/CSS. PDF P1–P6 a diplom sú pripravené na samostatné stiahnutie.
