# Uvádzacia ponuka Pixelkov

Používateľ schválil zapracovanie `PIXELKOVIA_FUNNEL_EARLY_BIRD_A_KNIZKY_ZADANIE.md`; SHA zadania je v `../books/scope-approval.json`. Po dokončení sa vstupné zadanie vymaže; priečinok `MD/` ostane cez `.gitkeep`.

## Výsledná ponuka

| Výber k hre | Knihy | Zľava | Celkom |
| --- | ---: | ---: | ---: |
| Bez kníh | 0,00 € | 0,00 € | 14,99 € |
| Iba prvá kniha | 4,99 € | 0,00 € | 19,98 € |
| Iba druhá kniha | 4,99 € | 0,00 € | 19,98 € |
| Obe knihy | 9,98 € | −4,98 € | 19,99 € |

Atlas je tretia doplnková karta, automaticky zahrnutá za 0 €. Zobrazuje plánovanú samostatnú cenu 2,99 € a výslovné vysvetlenie neodoberateľnosti; žiadny nefunkčný checkbox. Dve platené voľby začínajú vypnuté, staré URL parametre ich nezapínajú. Samostatné knižné ponuky fungujú bez hry za 4,99 € alebo obe knihy za 9,98 €.

Uvádzacia cena je v úvode, hlavnej cenovej karte, mobilnej lište aj checkoute. Plánovaná cena hry po úvodnom období je 29,99 €, transparentne označená ako budúca. Súčet plánovaných samostatných cien je 42,96 €. Žiadne tvrdenie o historickej zľave, falošný odpočet alebo počet kusov.

## Obrázky a verejné ukážky

Použité sú už hotové dve schválené obálky a štyri existujúce ilustrácie v rovnakom štýle postáv. Nevzniká druhá odlišná séria obrázkov. Štyri nové náhľady strán `assets/sales/books/{before,after}-page-{1,2}.webp` (720 × 900) vznikli zo screenshotov s ilustráciou a jedným z dvoch už verejných úvodných odsekov každej knihy. Ide o ukážku sadzby a obsahu, nie celé knihy. Textové názvy na obálkach kariet a v oknách sú živé HTML.

Spoločné okno `book-previews.js` / `.css` sa otvára pre jednu knihu alebo obe naraz na funneli; na checkoute pre každú knihu. Obsahuje obálku, anotáciu, odhad 20–25 minút čítania, zaradenie pred/po hre, dva náhľady a odkaz na prístupnú textovú ukážku. Odhad vychádza z približne 2 300–2 550 slov na knihu a pokojného čítania. Otvorenie okna nemení výber, cenu ani herný postup; funguje Escape, zatvorenie aj vrátenie fokusu.

Verejný balík má iba štyri aktuálne produkty. Historické produkty a ID ostávajú v súkromnom katalógu a databáze; pri výpočte sa ignorujú. Žiadne migračné operácie, zmeny starých objednávok, platieb, oprávnení či backendu. Autorské texty, hra, videá, nahrávky a tlačové materiály sú chránené pôvodnými kontrolnými súčtami. Plné knihy a pôvodné ilustrácie ostávajú mimo verejného balíka.

## Overenie

- Statické kontroly: kontrolné súčty pôvodného obsahu, presný odvodený verejný katalóg, štyri cenové kombinácie, ignorovanie duplicít a historických ID, nezávislé knihy a hranica verejných súborov.
- Chromium: funnel a checkout pri 320, 360, 390, 430, 768, 1366 a 1440 px, vizuálna kontrola mobilu aj počítača, ukážkové okná, okamžité prepočty oboma smermi, neaktívna platba, žiadne odoslanie formulára a zachovanie uloženého postupu.
- Verejné súkromné adresy musia vracať 404; plné knihy sa nedoručujú anonymne.
- Overenie vo WebKite v tomto prostredí nie je k dispozícii; testy a vizuálna kontrola prebehli v Chromium.
