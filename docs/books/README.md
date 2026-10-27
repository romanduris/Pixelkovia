# Knihy a Atlas

`books-content/before.json` a `after.json` obsahujú po tri autorské rozprávky. `atlas.json` obsahuje sedem profilov, schopnosti a malé aktivity. Texty sa nemenia pri úprave prezentácie; `content-integrity.json` overuje ich aktuálne kontrolné súčty a počty odsekov.

Plné knihy: `book-before.html` a `book-after.html`, dostupné z `books-preview.html` v súkromnej Site a zo storyboardu. Verejný `library.html`, Atlas a krátke ukážky kníh nemajú herné predpoklady.

`artwork-prompts.json` a `artwork-sources.json` opisujú grafiku používanej série. Obálky majú webový rozmer 1400 × 2000, ilustrácie 1200 × 800. Editovateľné titulky sú v HTML. Verejný funnel dostáva iba obálky a štyri náhľady strán z `assets/sales/books/`.

[Platná ponuka](../offer.md) používa dve samostatné knihy po 4,99 € a kompletnú hru s oboma knihami za 19,99 €. Statický prototyp neposkytuje overenie nákupu; platby a zákaznícke doručovanie kníh zatiaľ nie sú zapojené.

## Knižnica v rodičovskom portáli

`parent.html#kniznica` používa rovnaký katalóg, obálky a ukážky ako verejná knižnica. Zakúpené knihy otvára cez `library-read.html?book=<produkt>`; nezakúpené ponúkajú ukážku a samostatný checkout. Atlas zostáva zdarma. Platby sú naďalej vypnuté.

Oprávnenia číta z autentifikovaného `GET /api/customer/library` na adrese API v `SITE_CONFIG.managementUrl()`. Plný text doručuje až `GET /api/customer/library/<produkt>` po opätovnom serverovom overení zaplatenej objednávky, zákazníka, platnosti oprávnenia a pripravenosti obsahu. Oprávnenie na knihu nezávisí od 24-hodinového opakovania hry. Nákup sa neukladá do localStorage ani nepreberá z URL.

Oba endpointy vyžadujú existujúci privátny `CUSTOMER_AUTH` binding. Kým nie je pripojený, vracajú 501 a portál ponúka iba ukážky a ponuku; klient si vlastníctvo nedomýšľa. CORS povoľuje iba pôvod API a `WEB_URL`, s prihlasovacou reláciou a bez cachovania. Pri zapojení identity treba zabezpečiť zákaznícku reláciu dostupnú API (ideálne rovnaký pôvod); administrátorské heslo zákaznícke prihlásenie nenahrádza.

`book-before.html`, `book-after.html` a `books-preview.html` zostávajú redakčné náhľady v owner-private Site. Do verejného funnelu ani do zákazníckych odkazov sa nekopírujú. Pri publikovaní zákazníckeho portálu sa plné redakčné náhľady nesmú zverejniť.
