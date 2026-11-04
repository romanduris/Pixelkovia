# Facebook profilová fotografia — návrhy na schválenie

- `profile-A.png`: tmavá značková verzia s jemným tyrkysovým svetlom.
- `profile-B.png`: svetlá krémová verzia s mätovými a levanduľovými tónmi.
- `profile-C.png`: dobrodružná tmavá verzia s nenápadnými digitálnymi stopami.
- `comparison.png`: kruhové výrezy všetkých troch návrhov pri 256, 96 a 48 px. Riadky 96 a 48 px sú v pomere 1 : 1; pri hodnotení zobrazovať PNG na 100 %.

Tri profilové obrázky sú samostatné nepriehľadné PNG, presne 1024 × 1024 px, s profilom sRGB. Neobsahujú text ani ďalšiu postavičku. Hlava, obrazovková tvár, oči a kravata zostávajú v bezpečnej oblasti stredového kruhového výrezu.

## Zachovanie originálu

Piko pochádza priamo z `assets/characters/piko.png`. Používa sa rovnaký celočíselný výrez 1024 × 1024 px od bodu (116, 0), bez zmeny mierky, proporcií, farieb, tváre, očí, oblečenia či detailov. Kompozícia sústreďuje pozornosť na hlavu a hornú časť tela. Pôvodná visačka aj oranžová podložka zostávajú súčasťou ilustrácie; okraj kruhu prirodzene oreže spodnú časť tela a podložky.

Vstavaný `image_gen` vytvoril iba tri pozadia. Finálne obrázky vznikajú deterministickou kompozíciou pôvodného PNG cez jeho existujúci alfa kanál. Súbory `sources/background-*.webp` sú bezstratovo uložené podklady pozadí v cieľovom rozlíšení. Presné prompty, zdroj, kontrolný súčet originálu a parametre výrezu sú v `artwork.json`.

## Opätovné zostavenie

```sh
node assets/social/facebook/render.cjs
```

Autorovací nástroj používa existujúci `admin/node_modules/sharp` (pri príprave sharp 0.35.5). Inú lokálnu inštaláciu možno zadať cez `SHARP_MODULE`. Zdrojového Pika nemení a pri zmene jeho kontrolného súčtu zastaví zostavenie.

Ide iba o návrhy. Web na tieto súbory neodkazuje a príprava neobsahuje žiadne nasadenie na živý web. Existujúci build môže obrazové podklady pribaliť do chránenej časti artefaktu; nepatria do verejného zoznamu súborov.

# Facebook titulné obrázky — návrhy na schválenie

- `cover-A.png`: hlavná predajná verzia. Pôvodný Piko pred detailom schválenej obývačky, slogan „VÁŠ DOMOV. ICH DOBRODRUŽSTVO.“ a podtext „Interaktívna rodinná hra plná záhad“.
- `cover-B.png`: pôvodná spoločná scéna všetkých siedmich Pixelkov v obývačke, rovnomerne zmenšená na 50 % a premiestnená nad profilovku. Slogan „OBJAVTE TAJNÝ SVET PIXELKOV“ a podtext „Dobrodružstvo sa začína u vás doma.“ Text je odsadený viac od ľavého okraja. Pozadie zostáva súvislé aj pri použití obrázka bez profilovky.
- `cover-C.png`: tri detaily z dvoch schválených ilustrácií rodinného hrania: indície, spoločné riešenie pracovného listu a partia Pixelkov na telefóne. Slogan „DOBRODRUŽSTVO U VÁS DOMA“ a podtext „7 záhad • 45–60 minút • Pre deti 7–13 rokov“. Nejde o zákaznícke fotografie ani dokumentárny záber z hry.

Každý cover je samostatný nepriehľadný PNG, presne **1640 × 720 px**, s profilom sRGB. Ide výhradne o kompozície pôvodných podkladov, bez nového generovania obrázkov, dopĺňania postáv alebo retuše ich identity. Vo variante A sa Piko rovnomerne zmenšuje na 60 %; vo variante B spoločná scéna na 50 %. Ostatné operácie sú výrezy, typografia a kontrastné prechody za textom. Vo variante B sa zjemňujú iba okraje prostredia spoločnej scény; všetky hlavy zostávajú nepriehľadné a ich farby sa neupravujú.

Typografia používa rovnaké rodiny ako aktuálna predajná stránka: **Manrope** a **DM Sans**. Farby vychádzajú zo `sales.css`: tmavomodrá `#0d1424`, krémová `#f6f0e5`, mäta `#ace9cf`, levanduľová `#cab5f4` a zelená `#233b33`. Lokálne autorovacie kópie fontov a ich licencie OFL sú v `sources/fonts/`; neboli použité žiadne nové ilustračné podklady.

## Porovnanie orezov

- `cover-previews-desktop.png`: všetky tri varianty pri **820 × 312 px**, po stredovom výreze originálu na 1640 × 624 px od Y = 48.
- `cover-previews-mobile.png`: všetky tri varianty pri **640 × 360 px**, po stredovom výreze na 1280 × 720 px od X = 180.
- `cover-previews-mobile-profile.png`: pôvodné širšie mobilné výrezy s modelovým kruhovým prekrytím predchádzajúcim návrhom `profile-A.png`. Priemer kruhu vrátane okraja je 208 px; stred je v bode (320, 360). Pod náhľadom je pridaná plocha na zobrazenie celej profilovej fotografie. Tento prvý model nepostihuje užší výrez a vyššiu profilovku zo screenshotu používateľa; na kontrolu upraveného B slúžia nasledujúce samostatné náhľady.
- `cover-B-mobile.png`: užší mobilný výrez **640 × 390 px**, zo zdrojovej oblasti X = 295–1345 a Y = 0–640.
- `cover-B-mobile-profile.png`: rovnaký užší výrez s veľkou profilovkou s priemerom **280 px**, so stredom v bode (320, 354), na ploche 640 × 500 px. Tento model vychádza z približnej geometrie dodaného screenshotu.

Texty a hlavné tváre sú uložené v centrálnej oblasti X = 180–1460 a Y = 48–672. Dolný stred zostáva použiteľný pre prekrytie profilovou fotografiou. Náhľady sú orientačnou simuláciou, nie garanciou konkrétneho rozhrania Facebooku; skutočný orez treba skontrolovať pri nahratí. Text a tváre boli vizuálne overené v oboch výrezoch aj pri prekrytí.

Variant C má konzervatívnejšiu vnútornú oblasť X = 260–1380. Ilustrácie sa nachádzajú medzi X = 270 a 1370, takže v mobilnom výreze ostáva na každej strane 45 px voľného priestoru. Text začína 60 px od ľavého okraja mobilného výrezu; celý vrátane parametrov hry je nad miestom prekrytia. Prostredný detail presúva ukazujúcu ruku a ceruzku vyššie; profilovka môže zakryť spodnú časť pracovného listu. Tváre na bočných ilustráciách zostávajú mimo kruhu.

Upravené B počíta aj s vyšším prekrytím: v zdrojovom obrázku má profilovka približný stred (820, 580) a polomer 230 px. Všetkých sedem hláv je nad Y = 300; profilovka začína okolo Y = 350. Kontrola navyše vynecháva približnú oblasť vlastníckej bubliny nad profilovkou (X = 680–960, Y = 313–443) a priestor hornej navigácie. Profilovka zakrýva iba časť stola, podlahy a pozadia. V exporte `cover-B.png` nie je profilovka ani vynechané miesto či kruhová diera.

## Opätovné zostavenie coverov

```sh
node assets/social/facebook/render-covers.cjs
```

`covers-artwork.json` obsahuje pôvod podkladov, ich kontrolné súčty, presné slogany a parametre simulovaných výrezov. `cover-layout.json` zaznamenáva skutočné rozmery vyrastrovaných textov. Zdrojom úprav rozloženia je `render-covers.cjs`. Pôvodné ilustrácie aj návrhy profilových fotografií zostávajú nezmenené. Zostavenie návrhov nevykonáva nasadenie webu.
