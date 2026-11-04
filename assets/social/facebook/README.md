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
