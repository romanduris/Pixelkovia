# Pixelkovia – zjednodušenie Stripe Embedded Checkout na mobile

**Stav:** Schválené UX zadanie; implementácia a testovanie ešte prebiehajú.  
**Oblasť:** WEB & BUSINESS / verejný checkout.  
**Rozsah:** Iba platobná obrazovka a konfigurácia dostupných platobných metód. Bez zmien produktu, cien a herného obsahu.

## Cieľ

Súčasný Stripe Embedded Checkout je na mobiloch zbytočne dlhý: ponúka dominantné prihlásenie cez Link a výber platobných metód MB WAY, Bancontact, Satispay a EPS. Pri primárnom predaji slovenským rodinám chceme kratšiu, jednoznačnú obrazovku s rýchlou platbou kartou.

**Cieľový tok:** Prehľad vybranej objednávky a celkovej ceny → stručný nadpis „Bezpečná platba“ → priamo viditeľné polia karty → tlačidlo „Zaplatiť [suma]“.

## Požiadavky pre Codex

1. V serverovej tvorbe Stripe Checkout Session nastav `payment_method_types: ['card']`. Neponúkaj MB WAY, Bancontact, Satispay a EPS ani ďalšie automaticky vybrané alternatívne platobné metódy. Over, že voľba funguje s používaným `ui_mode: 'embedded'`.
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
