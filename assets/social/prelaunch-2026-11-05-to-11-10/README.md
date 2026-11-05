# Pixelkovia — predštartové grafiky, 5.–10. 11. 2026

Hotová séria pre Facebook Pixelkovia a Instagram @pixelkovia: **11 samostatných PNG, 1080 × 1350 px, 4 : 5, nepriehľadné sRGB**. Dva carousely majú po štyri slidy. Poradie určuje číslo súboru, nie náhľadový hárok. Všetko je iba pripravené v repozitári; nebolo vykonané nasadenie webu ani zverejnenie na sociálnych sieťach.

## Finálne PNG

| Dátum | Súbor |
| --- | --- |
| 5. 11. | [post-01-objavte-tajny-svet-pixelkov.png](post-01-objavte-tajny-svet-pixelkov.png) |
| 6. 11. · 1/4 | [post-02-slide-01-ako-funguje.png](post-02-slide-01-ako-funguje.png) |
| 6. 11. · 2/4 | [post-02-slide-02-rodic-pripravi.png](post-02-slide-02-rodic-pripravi.png) |
| 6. 11. · 3/4 | [post-02-slide-03-deti-patraju.png](post-02-slide-03-deti-patraju.png) |
| 6. 11. · 4/4 | [post-02-slide-04-velke-tajomstvo.png](post-02-slide-04-velke-tajomstvo.png) |
| 8. 11. | [post-03-piko-potrebuje-pomoc.png](post-03-piko-potrebuje-pomoc.png) |
| 9. 11. | [post-04-jeden-telefon-sedem-indicii.png](post-04-jeden-telefon-sedem-indicii.png) |
| 10. 11. · 1/4 | [post-05-slide-01-co-dostanete.png](post-05-slide-01-co-dostanete.png) |
| 10. 11. · 2/4 | [post-05-slide-02-pribeh-v-mobile.png](post-05-slide-02-pribeh-v-mobile.png) |
| 10. 11. · 3/4 | [post-05-slide-03-pracovne-listy.png](post-05-slide-03-pracovne-listy.png) |
| 10. 11. · 4/4 | [post-05-slide-04-navod-a-diplom.png](post-05-slide-04-navod-a-diplom.png) |

## Pôvod a rozhodnutia

- Piko: pôvodný `assets/characters/piko.png`, iba odstránenie prázdnych priehľadných okrajov a rovnomerné zmenšenie. Bez prekreslenia tváre, oblečenia, farieb alebo proporcií.
- Partia a domáce prostredie: schválené `assets/pixelkovia-room-mobile.webp` a `assets/pixelkovia-room-desktop.webp`. V skupinových scénach ostáva všetkých sedem Pixelkov vrátane schváleného Guardyho.
- Rodinné pátranie: existujúce `assets/sales/family-code-mobile.webp` a `assets/sales/family-opening-mobile.webp`. Sú to schválené ilustračné promo scény, nie zákaznícke fotografie ani recenzie. Telefón zostáva súčasťou spoločnej aktivity pri stole.
- Pracovné listy: iba fyzicky orezané verejné podklady `assets/sales/public-previews/{decoder,path,signals}.webp`. Celé hárky, riešenia ani záverečné návratové znaky sa nepoužívajú.
- Rodičovský návod a diplom: skutočná sadzba z `printables.html`, `print-materials.js` a `signal-print.css`, zachytená lokálnym Chromium. Do uložených podkladov boli fyzicky vyrezané iba úvodné prípravné kroky návodu a horná časť diplomu. Umiestnenia indícií a riešenia z dolnej časti rodičovského návodu sú mimo výrezu.
- Samostatný schválený promo záber rodiča pri príprave nebol k dispozícii. Slide o príprave preto používa skutočný výrez návodu a detail verejnej ukážky pracovného listu. Nové vlastnosti hry ani nové postavy neboli dopĺňané.
- Typografia a paleta vychádzajú z existujúcich Facebook coverov a predajného webu: Manrope ExtraBold, DM Sans Medium, tmavomodrá, krémová, mäta a zelená. Použité sú existujúce lokálne fonty aj ich OFL licencie v `../facebook/sources/fonts/`.
- Texty z dodaného zadania majú doplnenú slovenskú diakritiku; preklep „PATRJU“ je opravený na „PÁTRAJÚ“. Názvy postáv v marketingových nadpisoch zostávajú podľa výslovného zadania. Neuvádza sa cena, predajný termín ani vymyslené hodnotenie.

## Pomocné súbory

- [previews/contact-sheet.jpg](previews/contact-sheet.jpg): všetkých 11 grafík pri šírke 360 px, na vizuálnu kontrolu mobilnej čitateľnosti; nie je určený na publikovanie ako carousel.
- [sources/parent-guide-excerpt.png](sources/parent-guide-excerpt.png): bezpečný výrez úvodu skutočného rodičovského návodu, 794 × 510 px.
- [sources/diploma-excerpt.png](sources/diploma-excerpt.png): výrez skutočného diplomu, 738 × 455 px.
- [render.cjs](render.cjs): upraviteľné texty a deterministická kompozícia.
- [artwork.json](artwork.json): pôvod podkladov, kontrolné súčty SHA-256, rozmery výrezov a poznámky k textom.
- [layout.json](layout.json): skutočné rozmery textových vrstiev a poloha použitých podkladov vo všetkých exportoch.
- `README.md`: tento zoznam a odovzdávacie poznámky.

## Opätovné zostavenie

Z koreňa repozitára:

```sh
node assets/social/prelaunch-2026-11-05-to-11-10/render.cjs
```

Používa sa existujúci `admin/node_modules/sharp`. Alternatívnu lokálnu cestu možno zadať cez `SHARP_MODULE`. Zostavenie kontroluje kontrolné súčty podkladov, textové bezpečné okraje minimálne 80 px vodorovne a 60 px zvisle, rozmery, formát, nepriehľadnosť a profil sRGB všetkých finálnych PNG. Samotný render nepristupuje na sieť, neupravuje web a nič nepublikuje.

Výrezy návodu a diplomu vznikli z existujúcej tlačovej stránky pri šírke okna 900 px. Presná geometria a zdroje sú v `artwork.json`; uložené sú len bezpečné výrezy, nie screenshot celého rodičovského návodu.
