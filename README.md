# Záhada u vás doma — Pixelkovia: Stratený signál

Kompletný lokálny HTML prototyp rodinnej hry v slovenčine. Bez backendu, účtov a zostavovania.

## Spustenie

Otvorte `index.html` priamo v prehliadači. Alebo z koreňa repozitára spustite:

```sh
python3 -m http.server 8080
```

Potom otvorte http://localhost:8080. Pre hranie na mobile použite rovnakú lokálnu sieť a IP adresu počítača namiesto localhost (port musí byť dostupný).

## Súbory

- `index.html` — vstup, navigácia a dialóg.
- `styles.css` — responzívny vzhľad, mobilné rozloženie a tlač storyboardu.
- `game-data.js` — všetkých 10 etáp, plný príbeh, odpovede, dve nápovedy, materiály a časovanie. Sem smerujú budúce obsahové úpravy.
- `app.js` — simulovaný telefonát, overovanie, digitálna sekvencia, mapa, zápisník, lokálny postup, príprava a Game master.
- `assets/pixelkovia-*.png` — pixelová ilustrácia domova a atlas siedmich postáv.
- `printables.html` — pracovné tlačiteľné listy P1–P6, funkčné šifrovacie kotúče a voliteľný diplom. Tlačiť jednostranne pri 100 % mierke.
- `tests/prototype.test.cjs` — obsahové a prehliadačové regresné overenie.

## Hranie a kontrola

Najprv otvorte **Príprava hry**, vytlačte pracovné listy a rozmiestnite tri obálky a kartu symbolov. V hráčskom režime prijmite hovor, prečítajte päť častí rozhovoru a prejdite osem úloh až po finále. Pri úlohách je aj odkaz na pracovný list, takže možno hru skúsiť bez tlače (hľadanie sa vtedy iba simuluje).

**Game master** zobrazuje celý storyboard naraz, vrátane odpovedí, nápovied, pokynov a rozdelenia času. Otestovanie konkrétnej etapy beží v dočasnom režime a nemení uložený rodinný postup. Tento režim je interný, bez zabezpečenia. Pri reštarte sa zobrazuje potvrdenie pred vymazaním postupu.

Postup a využité nápovedy sa ukladajú v localStorage aktuálneho prehliadača. Na inom zariadení sa nesynchronizujú. Ak je úložisko nedostupné, hra ďalej funguje v pamäti. Zaškrtnutá príprava zostáva uložená samostatne. Po obnovení stránky sa možno vrátiť k aktuálnej etape.

## Otvorené časti V2

- Finálne PDF; ilustrované HTML listy sú hrateľné pracovné podklady.
- Náročnejšie ilustrované bludisko; teraz je použitý funkčný jednoduchý potrubný plán.
- MP3 telefonát. Cestu nastavte v `GAME.audio`; text je vždy dostupný. Pri nedostupnom súbore sa zobrazí textová alternatíva.
- Testovanie s rodinami a vekmi 7–13 rokov. Časy sú odhady. Súčet návrhových časov podľa zadania je 60 minút.

Rozhranie má systémový font ako zálohu. Google Fonts sú voliteľné a pri offline hraní sa použije lokálna záloha. Všetko herné funguje bez siete.

## Overenie pre vývojára

Hra nemá závislosti. Voliteľné prehliadačové testy používajú Playwright; jeho inštaláciu môžete ponechať mimo projektu:

```sh
npm install --prefix /tmp/mystery-qa playwright
/tmp/mystery-qa/node_modules/.bin/playwright install --with-deps chromium
# V inom termináli spustite python3 -m http.server 8080
PLAYWRIGHT_MODULE=/tmp/mystery-qa/node_modules/playwright node tests/prototype.test.cjs
```

Test overí celý priechod, nesprávne odpovede, nápovedy, diakritiku, obnovenie postupu, izolované testy etáp, reštart, mobilné rozloženie a tlačové podklady. Náhľady a skúšobný PDF výstup zapisuje do `/tmp`, nie do repozitára.

## Príbeh a vizuálny smer

Piko, modrý Pixelko, po výpadku svetelného priechodu hľadá šiestich kamarátov. Úlohy 1–6 obnovia kontakty s Kvakom, Iskrou, Šutkom, Lístkom, Kubom a Ryškom; každý odovzdá jedno písmeno. Siedma úloha odhalí SPOLU a poradie písmen. Ôsma otvorí heslom SVETLO cestu domov. Celá partia sa vráti vo finále.

`adventure.css` pridáva tmavomodrú, fialovú a tyrkysovú paletu, ilustrovaný domov a kontakty Pixelkov. Nové rastrové ilustrácie sú v `assets/pixelkovia-room.png` a `assets/pixelkovia-atlas.png`; prompty a pôvod sú v `assets/IMAGE-SOURCES.md`. Atlas má 4 × 2 políčka a zobrazuje sa cez CSS bez kopírovania jednotlivých portrétov. Pôvodné fotografie ostávajú archivované, rozhranie ich už nepoužíva.

ID etáp, odpovede, odmeny, časovanie a kľúč `zahada-v1-progress` ostávajú kompatibilné s V1. Šesť obnovených kontaktov sa odvodzuje z existujúcich splnených úloh, bez migrácie alebo vymazania uloženého postupu. Príprava, storyboard aj všetky tlačové listy používajú nový príbeh.

## Trvalý online náhľad

Adresa hostovaného prototypu: https://zahada-u-vas-doma.alert-coin-6330.chatgpt.site

Hosting cez Sites funguje nezávisle od spusteného Codespace. Prístup je predvolene súkromný pre vlastníka. Budúce úpravy sa publikujú do toho istého webu. Súbory na nasadenie pripraví `node scripts/prepare-static.mjs` do ignorovaného priečinka `dist/`; identita webu je uložená v `.openai/hosting.json`.
