# Pixelkovia · kampaň 12.–16. novembra 2026

Osem statických návrhov pre Facebook a Instagram. **Pripravené na schválenie vlastníkom; nič nebolo publikované ani naplánované na sociálnych sieťach.** Predajný web, checkout, ceny, administrácia aj hra zostali bez zmien.

## Obsah balíka

| Plánovaný deň | Súbor | Formát | Posolstvo |
| --- | --- | --- | --- |
| Št 12. 11. | `2026-11-12-feed-A.png` | 1080 × 1350 | Dobrodružstvo začína doma; dôraz na skutočný produkt |
| Št 12. 11. | `2026-11-12-feed-B.png` | 1080 × 1350 | Rovnaká téma; výraznejší ilustrovaný svet Pixelkov |
| Pi 13. 11. | `2026-11-13-story.png` | 1080 × 1920 | Vytlačiť. Ukryť. Hrať. |
| So 14. 11. | `2026-11-14-story.png` | 1080 × 1920 | Každá indícia posúva spoločné pátranie |
| Ne 15. 11. · 1/3 | `2026-11-15-carousel-01.png` | 1080 × 1350 | Papier: Hľadajte stopy. |
| Ne 15. 11. · 2/3 | `2026-11-15-carousel-02.png` | 1080 × 1350 | Mobil: Odhaľujte príbeh. |
| Ne 15. 11. · 3/3 | `2026-11-15-carousel-03.png` | 1080 × 1350 | Spoločné dobrodružstvo: Zvládnete všetkých 7 záhad? |
| Po 16. 11. | `2026-11-16-feed.png` | 1080 × 1350 | Dobrodružstvo sa blíži. |

**12. novembra vyberte A alebo B, nie oba ako dva samostatné príspevky.** Nedeľné tri súbory patria do jedného carouselu v uvedenom poradí.

- `previews/00-prehlad-vsetkych-vizualov.jpg`: náhľad celej série; neslúži na publikovanie.
- `previews/*-360.png`: jednotlivé obrázky pri mobilnej šírke 360 px.
- `TEXTY-PRISPEVKOV.md`: popisy a pokyny k odkazom pre jednotlivé platformy.
- **`editable/`**: osem samostatných SVG s editovateľným textom, vloženými fotografiami, ilustráciami a fontmi. Neobsahujú skryté celé pracovné listy.
- `sources/`: iba bezpečné fyzické výrezy, nezmenené pôvodné postavičky a fonty s OFL licenciami.
- `artwork.json`: presné použité súbory, pôvod, výrezy, kontrolné súčty, rozmery a poloha odkazovej nálepky.
- `layout.json`: skutočné rozmery a veľkosti textov z exportu.
- `render.cjs`: upraviteľná sadzba a lokálny export bez publikovania.
- `ZADANIE.md`: pôvodné dodané zadanie.

## Kreatívny koncept

**Skutočné stopy. Veľký spoločný svet.** Autentické zábery rúk, papierových indícií a hry v telefóne spájajú diagonálne fotografické karty, jemná signalizačná trasa a pôvodní Pixelkovia. Tmavomodrá, krémová a mäta aj fonty Manrope a DM Sans nadväzujú na existujúcu značku. Fotografie zostávajú fotografiami skutočného produktu; ilustrovaná obývačka je vedome priznanou značkovou ilustráciou. Nepoužíva sa generovaná rodina, nové postavy ani predstierané hodnotenie zákazníka.

Kompozície sa striedajú: produktový dvojzáber, vstup do ilustrovaného sveta, zrozumiteľné tri kroky, detail pátrania, tri samostatné carouselové kapitoly a mätový teaser s dominantným pôvodným Pikom.

## Použité podklady a ochrana úloh

| Podklad | Pôvod a zásah |
| --- | --- |
| Hra v telefóne | `assets/sales/real-play/play-phone.webp`, odvodené z autentickej fotografie `assets/Photo/20261108_193537.jpg`. Nový fyzický výrez zobrazuje iba aktívne herné políčka a ruky. QR, pracovné listy v pozadí a spodný riadok s priebežnými kódmi sú mimo uloženého výrezu. |
| Papierové pátranie | `assets/sales/real-play/play-paper.webp`, pôvodne `20261108_190754.jpg`. Ruky a zakrytá časť papierových kruhov bez kompletného zadania, QR alebo riešenia; dve nové fyzické veľkosti výrezu. |
| Čítanie indície | `assets/sales/real-play/play-team.webp`, pôvodne `20261108_193034.jpg`. Nový výrez prsta ukazujúceho na časť tlačeného listu; QR napravo, úplné zadanie aj návratový znak sú mimo uloženého súboru. |
| Príbeh na telefóne | `assets/sales/real-play/play-story.webp`, pôvodne `20261108_195955.jpg`. Použitá je pôvodná statická fotografia, nie snímka extrahovaná z videa. Nový výrez fyzicky vylučuje dolnú a pravú časť pracovného listu s dopísanými znakmi. |
| Návod na prípravu | Bezpečný výrez `assets/social/prelaunch-2026-11-05-to-11-10/sources/parent-guide-excerpt.png` z predchádzajúcej série, ďalej fyzicky orezaný len na ľavé prípravné kroky. QR napravo a všetky riešenia mimo výrezu nie sú v súbore. |
| Svet Pixelkov | Schválené `assets/pixelkovia-room-desktop.webp`; použitá je pravá časť obývačky s celou pôvodnou partiou. |
| Postavičky | Nezmenené `assets/characters/{piko,pixi}.png`; v skupinovej ilustrácii zostáva celá schválená partia vrátane pôvodného oranžového Guardyho. Postavy sa škálujú rovnomerne, bez prekreslenia alebo farebných zmien. |
| Fonty | Existujúce Manrope ExtraBold a DM Sans Medium z predchádzajúcich coverov; OFL licencie sú súčasťou ZIP-u. |

Pôvodné neošetrené fotografie, kompletné pracovné listy, odpovede, funkčné QR, súbory hry, heslá a kľúče nie sú v tomto balíku. Z bezpečných výrezov v SVG ani PNG sa nedá obnoviť odrezaná časť pôvodného dokumentu. Originálne projektové podklady sa nemenia.

Pôvod ilustrácií uvádza `assets/IMAGE-SOURCES.md`. Existujúce ilustrácie sú AI generované podľa schválených referencií. V tejto kampani nevznikli žiadne nové generované obrazy. Pôvodné súbory postavičiek vrátane ich metadát sú skopírované nezmenené; nové PNG majú aj textové XMP vysvetlenie zmiešaného pôvodu kompozície. Označenie ilustrácií podľa požiadaviek platformy neobchádzajte.

## Stories a odkazy

Obe Stories ponechávajú čistý priestor **x = 220, y = 1510, šírka 640, výška 130 px**. V editore Instagramu/Facebooku sem vložte klikateľnú odkazovú nálepku s textom napríklad **„Pozrieť hru“** a cieľom:

https://pixelkovia.rodulab.com/

Tento priestor je zámerne bez napevno vytlačeného tlačidla. Dôležité texty Stories zostávajú vo vnútornej časti obrazu; spodná adresa je nad ovládaním príbehu. Facebook feed používa odkaz v popise, Instagram feed výzvu na BIO. Samotná URL v PNG nie je klikateľná.

## Pred publikovaním

- Schváliť grafiky a popisy; pre 12. november zvoliť variant A/B.
- Potvrdiť aktuálny BIO odkaz a doplniť klikateľné nálepky do oboch Stories.
- **Termín 18. novembra nebol potvrdený.** Preto pondelkový vizuál používa neutrálny nadpis a nesľubuje spustenie v konkrétny deň. Po potvrdení sa dá nadpis zmeniť v SVG alebo v šablóne.
- Séria pokrýva päť plánovaných dní. Nenahrádza celý pôvodný dvojtýždňový predreklamný plán.
- Samostatné zábery tlačenia alebo ukrývania neboli v dostupných fotografiách; piatkové kroky ich vysvetľujú skutočnými materiálmi a výrezom reálneho návodu. Úkryty sa nevymýšľajú ani neprezrádzajú.

## Úprava a opätovný export

SVG možno otvoriť v prehliadači alebo v editore SVG. Fonty sú vložené pre náhľad v prehliadači; editor, ktorý ignoruje vložené webové fonty, môže vyžadovať inštaláciu dvoch pribalených TTF. Texty zostávajú editovateľné a postavičky sa neprekresľujú.

V repozitári:

```sh
PLAYWRIGHT_MODULE=/cesta/k/playwright node assets/social/prelaunch-2026-11-12-to-16/render.cjs
```

Samostatný balík môže použiť lokálne nainštalované `sharp` a `playwright` cez premenné `SHARP_MODULE` a `PLAYWRIGHT_MODULE`. Už pripravené bezpečné zdroje postačujú; pôvodné neošetrené fotografie nie sú potrebné. `--reuse-svg` exportuje ručne upravené SVG bez opätovného vytvorenia ich kompozície. Render kontroluje rozmery, sRGB, nepriehľadnosť, bezpečné hranice textov a minimálnu veľkosť písma. Nespúšťa reklamy ani nič nepublikuje.

## Dokončenie a kontrola odovzdania · 12. 11. 2026

- Opätovný export všetkých ôsmich kompozícií cez Chromium; renderer skontroloval rozmery, sRGB, nepriehľadnosť, bezpečné okraje a veľkosti písma.
- Vizuálne overený prehľad celej série a mobilné náhľady; skontrolované fyzické výrezy podkladov, ktoré vylučujú celé pracovné listy, riešenia a QR.
- Overené kontrolné súčty zdrojov a exportov, prítomnosť ôsmich editovateľných SVG a odkazy v `OTVORIT-NAHLAD.html`.
- Opravené konce riadkov CSV; `PUBLIKACNY-PLAN.csv` obsahuje hlavičku a osem samostatných záznamov v UTF-8 s BOM, oddelených bodkočiarkami.

Balík je dokončený na odovzdanie a schválenie. Výber A/B, potvrdenie dátumu štartu a samotné publikovanie zostávajú vlastníkovi podľa pôvodného zadania. Táto päťdňová séria neuzatvára širšiu otvorenú úlohu dvojtýždňového rozbehu v backlogu.
