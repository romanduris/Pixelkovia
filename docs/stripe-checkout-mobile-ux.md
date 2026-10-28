# Pixelkovia – zjednodušenie Stripe Embedded Checkout na mobile

**Stav:** Implementované; overenie a výsledky sú uvedené nižšie.
**Oblasť:** WEB & BUSINESS / verejný checkout.  
**Rozsah:** Iba platobná obrazovka a konfigurácia dostupných platobných metód. Bez zmien produktu, cien a herného obsahu.

## Cieľ

Súčasný Stripe Embedded Checkout je na mobiloch zbytočne dlhý: ponúka dominantné prihlásenie cez Link a výber platobných metód MB WAY, Bancontact, Satispay a EPS. Pri primárnom predaji slovenským rodinám chceme kratšiu, jednoznačnú obrazovku s rýchlou platbou kartou.

**Cieľový tok:** Prehľad vybranej objednávky a celkovej ceny → stručný nadpis „Bezpečná platba“ → priamo viditeľné polia karty → tlačidlo „Zaplatiť [suma]“.

## Požiadavky pre Codex

1. V serverovej tvorbe Stripe Checkout Session nastav `payment_method_types: ['card']`. Neponúkaj MB WAY, Bancontact, Satispay a EPS ani ďalšie automaticky vybrané alternatívne platobné metódy. Over, že voľba funguje s aktuálnym podporovaným režimom Stripe; implementácia používa `ui_mode: 'form'`.
2. **Vypni alebo potlač automatické prihlásenie cez Stripe Link** pre platobný tok Pixelkovia, pokiaľ je to podporované dokumentovanou konfiguráciou Stripe. Pred úpravou over aktuálnu dokumentáciu pre Stripe Embedded Checkout a konkrétny typ integrácie. Neodstraňuj bezpečnostné overovanie bánk (3D Secure/SCA).
3. **Apple Pay a Google Pay** zachovaj, ak ich karta/Stripe a konkrétne zariadenie bezpečne podporujú, a ak nepridávajú zbytočné kroky. Neprisľubuj ich zobrazenie na všetkých zariadeniach; otestuj správanie na podporovaných prehliadačoch.
4. V existujúcej checkout stránke skráť veľké medzery a duplicitné nadpisy, obmedz opakované cenové informácie, zmenši zbytočný obal okolo Stripe platobného prvku. Nenúť zákazníka scrollovať cez dlhý zoznam metód pred kartou.
5. Stripe hostované/iframe polia neupravuj nedokumentovaným CSS, skriptmi ani zásahom do DOM. Použi iba oficiálne nastavenia Stripe. Ak samotnú vnútornú podobu Stripe formulára nemožno viac skrátiť, optimalizuj aspoň naše okolité rozloženie.
6. Zachovaj existujúce sumy a obchodnú logiku:
   - hlavná hra 14,99 €;
   - hra + jedna knižka 19,98 €;
   - hra + obe knižky 19,99 €;
   - Atlas Pixelkov zdarma podľa platnej konfigurácie;
   - samostatné knižky po 4,99 €.
7. Zachovaj zabezpečenie serverového výpočtu ceny, Stripe webhooky, podpisové overovanie, ochranu proti duplicitným objednávkam a prideľovanie prístupu až po potvrdenej platbe.
8. Otestuj mobilné šírky **360, 390 a 430 px** aj desktop. Skontroluj otvorenie platobného kroku, jednu kartu bez alternatívnych zahraničných platobných metód, chyby validácie, zobrazenie správnych súm a návrat k úprave objednávky.
9. Automatické testy nesmú vykonať reálnu platbu ani meniť produkčný Stripe účet bez výslovného schválenia. Najprv použi testovacie/simulované prostredie.
10. Na konci odovzdaj pred/po screenshoty, výsledky testov, konkrétne zmenené súbory a informáciu, či sa podarilo vypnúť Link **bez obmedzenia** Apple Pay/Google Pay.

## Dizajnový princíp

Nechceme vlastný formulár platobnej karty ani integráciu, ktorá obchádza Stripe. Chceme **čo najkompaktnejší oficiálny Stripe Embedded Checkout**: príjemný pre mobil, dôveryhodný, s jasným súčtom, dominantnou kartou a minimum rozhodovania.

## Poznámka pre implementáciu

Ak Stripe pri `payment_method_types: ['card']` napriek tomu zobrazuje Link alebo iné wallet prvky, nepokúšaj sa ich skrývať neoficiálnym CSS. Najprv skontroluj Dashboard konfiguráciu Link a podporované možnosti pri vytváraní relácie. Ak nemožno naplniť všetky požiadavky súčasne, transparentne popíš kompromis a navrhni najmenšiu zmenu; neaktivuj produkčný predaj len kvôli UX zmene.

## Výsledok – 27. 10. 2026

- Používa sa oficiálny Stripe Form SDK, režim `form`, rozloženie `expanded` a Appearance téma `night`. Aktuálna dokumentácia: [vložený formulár](https://docs.stripe.com/checkout/form/quickstart), [možnosti formulára](https://docs.stripe.com/js/custom_checkout/create_form).
- Server vyberá iba `card`; formulár potláča Link cez dokumentované `expressCheckout.paymentMethods.link: 'never'`. MB WAY, Bancontact, Satispay ani EPS sa pri overení neobjavili. Globálne platobné nastavenia účtu neboli upravené.
- Apple Pay/Google Pay nie sú zakázané v konfigurácii formulára. Dostupnosť na fyzickom zariadení s uloženou peňaženkou sa nepodarilo overiť; netvrdíme, že sa zobrazia všade. WebKit sa v tomto testovacom prostredí nepodarilo overiť.
- Po pokračovaní sa skryje rozsiahly výber produktov a zobrazí sa stručný prehľad, suma a karta. Tlačidlo „Upraviť objednávku“ obnoví pôvodný výber a e-mail. Pri otvorení platby sa údaje uzamknú, aby sa počas vytvárania relácie nezmenili.
- Cena zostáva v EUR; táto relácia neponúka konverziu meny. Stripe riadi vlastné tlačidlo „Zaplatiť“ a zobrazuje finálnu sumu tesne nad ním. Do textu ani DOM iframe nezasahujeme.
- Chromium: šírky **360, 390, 430 a 1360 px**, bez vodorovného pretečenia; v každom prípade jeden formulár karty, žiadne tlačidlo Link ani uvedené zahraničné metódy, správna suma 14,99 €. Platobný krok mal pri základnej hre približne **981–987 px** výšky celej stránky.
- Prešlo **24 serverových testov**, štyri scenáre prehliadača s riadeným SDK a kontroly súborov/cenníka. Serverové scenáre potvrdzujú sumy 14,99 €, 19,98 €, 19,99 €, samostatné knihy 4,99 € a obe knihy 9,98 €. Simulované scenáre pokrývajú chybu, opakovanie, dvojité kliknutie, zlyhanie načítania, serverové potvrdenie a návrat od banky.
- Skutočný Stripe formulár bol vizuálne overený v nezaplatenej relácii. Neboli zadané údaje karty ani odoslaná skutočná platba. Skúšobné relácie sa po overení ukončia; simulované výsledky nie sú dôkazom reálneho bankového overenia alebo doručenia e-mailu.

### Pred / po

Snímky používajú iba skúšobné údaje, bez údajov platobnej karty:

| Pred zjednodušením | Po zjednodušení |
| --- | --- |
| [Snímka pred – 390 px](screenshots/checkout-before-390.png) | [Snímka po – 390 px](screenshots/checkout-after-390.png) |

Zmenené súbory: `checkout.html`, `checkout.css`, `checkout.js`, `admin/src/commerce.mjs`, `admin/tests/customer-access.test.mjs`, `tests/checkout-payment.test.cjs`, dokumentácia nastavenia platieb a toto zadanie so snímkami. Herný obsah a ceny sa nemenili.

## Doplňujúce overenie – 28. 10. 2026

- Pôvodné zjednodušenie je pushnuté a bolo úspešne nasadené z commitu `69bad78`. Produkčný `checkout.js` sa pri kontrole zhodoval so zdrojom.
- Predtým otvorené automatizované overenie vo WebKite sa podarilo dokončiť. `tests/checkout-payment.test.cjs` teraz podporuje `QA_BROWSER=webkit` a trvalo pokrýva šírky **360, 390, 430 a 1360 px**. V každej kontroluje správne sumy, otvorenie kompaktného kroku, absenciu vodorovného pretečenia a zachovanie výberu aj e-mailu po návrate. Mobilné scenáre používajú dotykové ovládanie.
- Prešlo **16 platobných scenárov**: osem v Chromiu a osem vo WebKite, s riadenou náhradou Stripe SDK a zachytenými požiadavkami bez prístupu k platobnému poskytovateľovi. Zahŕňajú chyby, opakovanie, dvojité kliknutie, serverové potvrdenie a návrat od banky.
- Prešlo aj všetkých **24 serverových testov**, sedem testov prihlasovacích kľúčov a e-mailových DNS, kontrola statických súborov a digitálnych identít. Celá cesta cez izolované Workers/D1, portál, sedem úloh, druhý telefón, hodnotenie a administráciu prešla v **Chromiu aj WebKite**.
- Na produkčnej doméne prešlo **17 HTTP kontrol** verejných stránok, povinného prihlásenia, nedostupných odpovedí, platených súborov a vyradených trás. Verejný checkout sa vo WebKite načítal so sumou 14,99 € bez vodorovného pretečenia.
- Testy neodoslali skutočnú platbu, nevytvorili produkčného zákazníka a nemenili nastavenia Stripe. Skutočný formulár Stripe vo WebKite, bankové overenie, doručenie prístupového e-mailu a Apple Pay/Google Pay na fyzickom zariadení týmto overené nie sú. Pôvodné snímky pred/po zostávajú platné; vzhľad ani produkčná platobná logika sa v tomto doplnení nemenili.

## Aktuálna ponuka a voucher – 28. 10. 2026

- Názov produktu je **Hra Pixelkovia – Stratený signál**. Hlavná karta uvádza „7 záhad v jednom spoločnom príbehu“.
- Súhrn zobrazuje plánovanú štandardnú cenu **29,99 €**, zľavu **−15 € za prednostný prístup** a výsledok **14,99 €**. Označenie plánovanej ceny zostáva explicitné; nejde o predchádzajúcu predajnú cenu. Riadok „Doručenie online“ je odstránený.
- Obe knihy sa pridávajú jedným spoločným políčkom. Zachované sú obe obálky, stručný obsah a samostatné ukážky. Používateľ potvrdil zachovanie kompletného balíka za **19,99 €**, preto knihy k hre stoja **5 € namiesto 9,98 €**, s textom „takmer za polovicu“. Atlas zostáva bezplatnou voliteľnou položkou. Samostatné knihy zostávajú za 4,99 €.
- Pod tlačidlom kúpiť je iba odkaz „Mám zľavový kód“, ktorý otvorí dialóg. `free` vynuluje celú aktuálnu objednávku. Neznámy kód, zatvorenie bez uplatnenia, odstránenie kódu, návrat fokusu a zmeny výberu majú pokrytie v testoch.
- Server overuje voucher a zapisuje ho do existujúcej D1 cez migráciu `0006_checkout_vouchers.sql`. Prístup vytvorí až po podpísanej udalosti a overení dokončenej nulovej relácie cez Stripe API. Otvorená, nezaplatená či podvrhnutá relácia prístup neudelí; opakovaná udalosť nevytvorí druhú objednávku. Podrobnosti: [platby a doručenie](payment-setup.md).
- Prešlo **25 serverových testov**, **24 prehliadačových platobných scenárov** (12 Chromium + 12 WebKit), verejná ponuka na siedmich šírkach a celá cesta hrou v oboch prehliadačoch. Platby používajú riadené SDK a izolovanú databázu; automatizácia nevykonala živú úhradu ani nevytvorila produkčnú objednávku.

Aktuálne snímky ponuky, bez údajov karty:

| Mobilná ponuka | Dialóg voucheru | Desktop |
| --- | --- | --- |
| [390 px](screenshots/checkout-offer-390.png) | [Voucher](screenshots/checkout-voucher-390.png) | [1360 px](screenshots/checkout-offer-1360.png) |

## Kompaktný checkout a druhá hra – 28. 10. 2026

- Potvrdené poradie je stručná karta hry → iba e-mail → tri kompaktné doplnky → **Vaša objednávka**. Meno sa nezbiera. E-mail má samostatný malý blok bez veľkého nadpisu.
- Atlas uvádza preškrtnutú plánovanú cenu **2,99 €** a „Teraz zdarma“. Balík kníh má dve malé obálky, cenu +5 € a odkaz **Pozrieť ukážku oboch kníh**. Odkaz používa rovnaký dialóg `collection` ako funnel: dve knihy, štyri obrázkové ukážky, bez zmeny výberu či ceny.
- Tretí voliteľný doplnok je druhá hra za **9,99 €**. Bez kníh sa platí 24,98 €, s knihami 29,98 €. Dve samostatné objednávky majú vlastné účty a heslá; kupujúci dostane dva oddelené e-maily a druhý môže preposlať. Druhá objednávka obsahuje iba základnú hru. [Spracovanie a testy](payment-setup.md).
- Na mobile je pri prechádzaní ponuky dostupná spodná lišta s aktuálnou sumou a pokračovaním k platbe. Pri viditeľnom hlavnom tlačidle, otvorenej ukážke, voucheri alebo platobnom kroku sa schová. Obe tlačidlá vyžadujú platný e-mail a používajú rovnakú ochranu pred opakovaným kliknutím.
- Vizuálna kontrola na 390 px: stránka má približne **1 500 px** oproti predchádzajúcim 2 090 px, napriek novej ponuke druhej hry. Kontroly na 360, 390, 430 a 1360 px pokrývajú aj chybové stavy, samostatné knihy, voucher, spoločnú ukážku a mobilné tlačidlo.
- Prešlo **27 serverových testov**, **26 platobných scenárov** (13 Chromium + 13 WebKit), verejný funnel na siedmich šírkach a cesta cez sedem úloh v oboch prehliadačoch. Doručenie dvoch e-mailov, opakovanie, atómové vytvorenie, podpísané webhooky, refund aj voucher sú overené izolovane bez živej úhrady či produkčného nákupu.

Snímky vyššie sú aktualizované; [prvá mobilná obrazovka so spodnou lištou](screenshots/checkout-mobile-bar-390.png) ukazuje dostupné pokračovanie bez posúvania k súhrnu.
