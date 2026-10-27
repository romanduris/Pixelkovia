# Knihy a Atlas

`books-content/before.json` a `after.json` sú jediným zdrojom úplných textov, každá s tromi autorskými rozprávkami. `atlas.json` obsahuje sedem profilov. `content-integrity.json` overuje kontrolné súčty a počty odsekov.

Verejné `library.html`, `atlas.html` a dve knižné ukážky obsahujú iba voľný obsah a vzorky. Celé knihy sa čítajú na `/kniznica/citat?book=story-book-before` alebo `story-book-after`; server pri každom načítaní kontroluje príslušný zaplatený nákup. Redakčný náhľad z interného storyboardu používa tú istú čítačku a texty po administrátorskom overení. Duplicitné plné HTML knihy sa nepoužívajú.

Ilustrácie patria pod samostatné knižné oprávnenia. Knižnica v `/Supervisor` zvýrazní vlastnené knihy; ostatné obálky sú sivé a ponúkajú iba ukážku a kúpu. Čítanie nezávisí od časového okna na opakovanie hry.

`artwork-prompts.json` a `artwork-sources.json` zachovávajú podklady aktuálnej série. Obálky majú 1400 × 2000, ilustrácie 1200 × 800. Názvy a lokalizované titulky sú editovateľný HTML text. Verejné náhľady strán v `assets/sales/books/` obsahujú iba už zverejnené úvodné odseky.
