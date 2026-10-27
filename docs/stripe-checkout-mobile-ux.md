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
