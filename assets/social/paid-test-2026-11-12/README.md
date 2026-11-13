# Pixelkovia · Dnes má vaša obývačka tajomstvo.

Reklamná séria z 12. novembra 2026, aktualizovaná 13. novembra: hlavný motív má tri samostatne generované scény pre **1:1, 9:16 a 1,19:1** a vlastnú editovateľnú sadzbu v každom formáte. Story má celú obývačku od stropu po podlahu; žiadny z troch finálnych výstupov nevzniká dopĺňaním prázdnych okrajov. Pôvodné koncepty A/B/C a osobitná produktová Story zostávajú dostupné.

**Pripravené na kontrolu vlastníkom. Sociálne príspevky ani platené reklamy neboli publikované, naplánované alebo zapnuté.** Predajný web, ceny, checkout a samotná hra sa obsahovo nemenia. Tento adresár zostáva mimo verejného aj chráneného aplikačného exportu.

## Otvoriť hotové vizuály

- **[Galéria všetkých výstupov](OTVORIT-NAHLAD.html)** – lokálny prehľad s odkazmi na plné PNG a editovateľné SVG.
- **[Prehľad troch motívov](pixelkovia_ad_concepts_overview.png)** – spoločná porovnávacia tabuľa.

| Motív / výstup | Súbor | Rozmery |
| --- | --- | --- |
| A · Dnes má vaša obývačka tajomstvo. | [Feed A](pixelkovia_ad_concept_A_feed_4x5.png) | 1080 × 1350 |
| B · Jeden mobil. Všetci v hre. | [Feed B](pixelkovia_ad_concept_B_feed_4x5.png) | 1080 × 1350 |
| C · Čo ukrýva vaša obývačka? | [Feed C](pixelkovia_ad_concept_C_feed_4x5.png) | 1080 × 1350 |
| Hlavný feed · samostatná štvorcová scéna A | [Finálny štvorec 1:1](pixelkovia_ad_final_square_1x1.png) | 1080 × 1080 |
| Tajomstvo v obývačke · natívna vertikálna scéna | [Hlavná Story 9:16](pixelkovia_ad_final_story_9x16.png) | 1080 × 1920 |
| Hlavný motív · rodina napravo, nadpis naľavo | [Horizontálny 1,19:1](pixelkovia_ad_final_landscape_1_19x1.png) | 1190 × 1000 |
| Pozrite, čo hráte spolu. · skutočná ukážka | [Produktová Story](pixelkovia_ad_game_story_9x16.png) | 1080 × 1920 |

Prehľad a súbory v `previews/` slúžia na kontrolu. Do reklamy patria plné PNG. Odporúčanie A je kreatívny výber, nie výsledok merania predaja.

Horizontálny pomer je **1,19:1 podľa zadania**, nie 1,91:1. Duplicitný finálny export 4:5 bol nahradený štvorcom; jeho totožná pôvodná podoba zostáva ako koncept A. Nové pozadia sú samostatné generované kompozície, jemne prevedené na presné exportné rozmery bez pásov alebo naťahovania. Texty, značka, údaje a CTA zostávajú v SVG oddelené od pozadia.

## Réžia a háčiky

**A · Tajomstvo v obývačke.** Deti a rodič riešia úlohu pri drevenom stole. Teplá lampa, modrý večer za oknom a jemná stopa svietiacich štvorčekov spájajú papier s mobilom. Piko sedí na hrane stola s nohami vo vzduchu, Guardy vykúka spoza jeho okraja. Nová póza Pixiho s ceruzkou dokončuje podčiarknutie rukopisného slova „tajomstvo“. Vrchná časť funguje ako plagát, stred ukazuje spoločné hranie, spodná časť uzatvára vek, trvanie a výzvu.

**B · Jeden mobil. Všetci v hre.** Intímnejší záber cez ramená detí, jeden veľký mobil a rodičia zapojení do riešenia. Guardy sedí na obale telefónu, Piko sa drží okraja stola. Nadpis pomenúva spoločný zážitok; doplnkový rukopis „Spolu až do finále.“ mu dáva smer.

**C · Čo ukrýva vaša obývačka?** Deti objavujú papierovú indíciu pri gauči. Piko ukazuje smer z operadla, Pixi vykúka spoza vankúša, Guardy dohliada na nález. Záber vysvetľuje, že dobrodružstvo pokračuje aj mimo displeja. Zobrazený úkryt je reklamná ilustrácia, nie návod ani prezradenie konkrétnej úlohy.

Všetky scény majú spoločnú tmavomodrú, jantárovú a azúrovú paletu, kontaktové tiene a výtvarne zladené postavy. Typografia používa Manrope, DM Sans a rukopisný Caveat, ktorý nadväzuje na funnel. Dôležité nadpisy a CTA zostávajú čitateľné v náhľadoch pri šírke 360 px.

## Pôvod obrázkov a presnosť produktu

Scény A/B/C, nové formátové scény a samostatná póza Pixiho vznikli vstavaným **image_gen**. Pôvodné zadania sú v [PROMPTS.json](PROMPTS.json); presné nové prompty a roly referencií v [FORMAT-PROMPTS.json](FORMAT-PROMPTS.json). Referencie tvorili schválená obývačka, pôvodné portréty a skutočné fotografie hrania; nové formáty vychádzajú z hotového motívu A. Nové prostredia, ľudia a telefóny v scénach sú **generované reklamné ilustrácie**; neprezentujú sa ako zákaznícke fotografie alebo recenzie. Mená postáv ani predajné texty nie sú zapečené v podkladových ilustráciách.

Produktová Story navyše obsahuje **nezmenený schválený skutočný záber** `assets/sales/game-lock-partial.webp`, vložený do samostatného vektorového rámu telefónu a označený „Skutočný záber z hry“. Táto ukážka sa neprepisuje ani negeneruje. Telefóny v ostatných ilustračných scénach predstavujú výtvarné zobrazenie hrania, nie presný screenshot rozhrania.

Podklady v `sources/`:

| Súbor | Obsah |
| --- | --- |
| `scene-A-room.webp` | Celistvá scéna spoločného riešenia pri stole |
| `scene-B-phone.webp` | Celistvá scéna hrania cez ramená detí |
| `scene-C-discovery.webp` | Celistvá scéna objavovania indície pri gauči |
| `scene-A-square.webp` | Nový záber rodiny komponovaný pre štvorec |
| `scene-A-story.webp` | Nový vertikálny záber celej obývačky, stola a podlahy |
| `scene-A-landscape-1_19x1.webp` | Nová horizontálna scéna s rodinou napravo a priestorom pre text naľavo |
| `pixi-lettering.png` | Nová póza schválenej postavy s ceruzkou a skutočným alfa kanálom |

Papiere v generovaných scénach majú všeobecné grafické fragmenty. Nepoužívajú celé pôvodné pracovné listy, QR, heslá ani odpovede. Neošetrené fotografie nie sú vložené do SVG alebo do odovzdávaných zdrojov. Pôvodné produktové materiály a sedem úloh zostávajú bez zmeny.

Označenie generovaného obsahu je aj v XMP metadátach PNG a v popise SVG. Metadáta nenahrádzajú príslušné označenie pri nahrávaní na sociálnu platformu.

## Texty k reklamám

### A · odporúčaný hlavný text

**Dnes má vaša obývačka tajomstvo.**

Vytlačíte a ukryjete 7 úloh, vezmete jeden spoločný mobil a pustíte sa do pátrania. Jeden hľadá, druhý si všimne detail — a zrazu zaznie spoločné „máme to!“

Pixelkovia – Stratený signál sú rodinná hra na doma pre deti 7–13 rokov a rodičov. Vyhraďte si približne 60–90 minút na dobrodružstvo, v ktorom hráte ako jeden tím.

Pozrite sa, ako sa hrá: https://pixelkovia.rodulab.com/

Krátky nadpis reklamy: **Vaša obývačka. Vaša rodinná misia.**

### B · spoločný mobil

**Jeden mobil. Všetci v hre.**

Papierové indície, príbeh v telefóne a nápady celej rodiny. V Pixelkovii riešite 7 záhad spolu — od prvej stopy po spoločné finále.

Pre deti 7–13 rokov a rodičov · približne 60–90 minút · doma.

Objavte hru: https://pixelkovia.rodulab.com/

Krátky nadpis reklamy: **7 záhad pre váš tím.**

### C · domáce pátranie

**Čo ukrýva vaša obývačka?**

Po príprave hry možno ďalšiu stopu k spoločnému „máme to!“ Vytlačené úlohy premenia známy byt na miesto pátrania a jeden spoločný mobil vás posúva príbehom ďalej.

Pixelkovia – Stratený signál. Rodinné dobrodružstvo pre deti 7–13 rokov a rodičov na približne 60–90 minút.

Prijmite rodinnú misiu: https://pixelkovia.rodulab.com/

Krátky nadpis reklamy: **Dobrodružstvo čaká doma.**

## Stories a cieľový odkaz

V platenej reklame nastavte cieľ **https://pixelkovia.rodulab.com/** v reklamnom systéme. Vytlačená URL a CTA v obrázku samy nevytvárajú klikateľnú plochu.

Pri organickej Story nahraďte tlačené CTA natívnou odkazovou nálepkou v označenom priestore **x 250 / y 1517 / 580 × 104 px**. Text nálepky napríklad „Pozrieť hru“. Táto plocha je zaznamenaná aj v SVG a `artwork.json`. Dôležité texty sú medzi hornými a dolnými ovládacími prvkami Stories.

## Editácia a export

Sedem SVG v `editable/` obsahuje vložené bezpečné bitmapy a fonty; všetky reklamné texty zostávajú textom. `render.cjs` reprodukuje sadzbu a exportuje plné PNG, mobilné náhľady, spoločný prehľad, lokálnu galériu a kontrolné záznamy. Nové finálne formáty majú samostatné pozadia, veľkosti, pozície nadpisu, informácií a CTA. Žiadne generovanie ani sieťové publikovanie pri exporte neprebieha.

```sh
PLAYWRIGHT_MODULE=/cesta/k/playwright node assets/social/paid-test-2026-11-12/render.cjs
```

Používa existujúci projektový Sharp a fonty. OFL licencie Manrope a DM Sans sú v `licenses/`, Caveat v `assets/fonts/OFL-Caveat.txt`. Pri ručnej zmene SVG sa vyhnite opätovnému spusteniu šablóny, ktorá SVG vytvára nanovo.

Export kontroluje presné rozmery, sRGB, nepriehľadnosť finálnych PNG, bezpečné hranice typografie, minimálnu veľkosť nadpisov a kontrolné súčty. Vizuálna kontrola zahŕňa všetky tri motívy a obe Stories pri mobilnej šírke 360 px, úplnosť postáv, ochranu podkladov a čitateľnosť skutočnej ukážky.
