# Mobilná predajná stránka a kombinácia papiera s telefónom

Aktualizácia z 26. 10. 2026 podľa následného zadania: telefón je hlavné zariadenie návštevníka stránky a oba nové rodinné zábery majú priamo vysvetliť hybridný priebeh hry.

- Úvod výslovne ukazuje „Papierové stopy + Jeden spoločný mobil“. Zostáva schválená obývačka a celá partia pri stole. Na malých a nízkych telefónoch sa mení výška úvodu a mierka obrazu; nákupná výzva je dostupná v spodnej lište.
- Mobilné texty, tlačidlá, FAQ a kartičky postáv sú väčšie. Hlavné dotykové tlačidlá majú najmenej 46 px na výšku. Prehľad postáv má širšie karty a priamo vysvetľuje bočné posúvanie.
- Prvá rodinná scéna ukazuje skutočný záber z úvodného videa v jednom spoločnom telefóne a šesť vystrihnutých záznamov signálu. Druhá ukazuje rovnice z listu 3 a čiastočne rozsvietenú skutočnú číselnú mriežku v mobile. Text pod fotografiami vysvetľuje prechod medzi papierom a telefónom.
- Fotografie sú ilustračné vizualizácie vytvorené vstavaným `image_gen` podľa skutočných herných podkladov. Sú na výšku 4 : 5, aby papier aj telefón zostali dostatočne veľké. Názvy postáv nie sú súčasťou bitmapy. Pôvodné zábery zostávajú zachované.
- Pre každý rodinný záber sú WebP varianty so šírkou 640, 960 a 1200 px; `srcset` vyberá vhodnú veľkosť. Na bežný telefón s DPR 1 sa načíta približne 76–96 kB verzia. Vyššie rozlíšenia zachovávajú detail displeja na jemnejších obrazovkách.
- Portréty postáv na predajnej a objednávkovej stránke používajú samostatné priehľadné WebP kópie: približne 384 kB spolu oproti pôvodným 7,2 MB PNG. Herné portréty a ich zdroje zostávajú nezmenené.
- Rozbaľovacia ukážka „Takto vyzerá hra v telefóne“ zobrazuje skutočný snímok hry a nemenený videozáber na rozdiel od ilustračnej fotografickej scény. Nehrá zvuk, nemení postup a nespúšťa hru.

## Uložené obrázky a prompty

- `assets/sales/family-opening-mobile.webp`, `family-opening-mobile-medium.webp`, `family-opening-mobile-small.webp`
- `assets/sales/family-lock-mobile.webp`, `family-lock-mobile-medium.webp`, `family-lock-mobile-small.webp`
- `assets/sales/characters/*.webp`: sedem rozmerovo optimalizovaných kópií pôvodných schválených portrétov.
- `assets/sales/opening-video-frame.webp`: skutočný záber videa `assets/PicoVideo.mp4` pri 7 s.
- `assets/sales/game-lock-partial.webp`: skutočná obrazovka úlohy 3 pri čiastočnom výbere políčok. Zachytená v izolovanom testovacom prehliadači, bez mena postavy v obraze.

Presné zadania, vstupné referencie a pôvodné generované súbory: [mobile-sales-artwork.json](mobile-sales-artwork.json). Použitý bol vstavaný image_gen; Sharp len vytvoril rozmerové WebP varianty bez zmeny obsahu.

## Overenie

Rozšírený `tests/sales-checkout.test.cjs` kontroluje obrazovky 320 × 568, 360 × 640, 390 × 844, 430 × 932, 768 × 1024 a 1440 × 1000: viditeľnú mobilnú výzvu, veľké portrétové fotografie, skutočné herné ukážky, prechody na ponuku, všetky kombinácie cien a zachovanie uloženého herného postupu. Vizuálne snímky zahŕňajú aj čitateľnosť textov, veľkosť papierov a mobilov na fotografiách a kompozíciu úvodu.

Lokálny WebKit opäť padá aj na samostatnom HTML s jediným nadpisom, takže tento engine tu nemožno spoľahlivo overiť. Hra, zvuk, úlohy ani tlačové podklady sa nemenili. Finálne Kúpiť zostáva podľa predchádzajúceho zadania neaktívne.
