# Monitorovanie priebehu platby

**Stav:** Implementované a automatizovane overené 10. 11. 2026. Prehľad je v [Platby a chyby](https://pixelkovia.rodulab.com/admin#payments), v rozbaľovacej časti **Priebeh platby**. Pôvodný vložený platobný formulár zostáva zachovaný. Recenzie vlastník označil za vybavené a vyradil ich z backlogu; táto zmena neimplementuje ďalšie funkcie recenzií.

## Čo počítame

| Krok | Zdroj a presná definícia | Počítanie |
| --- | --- | --- |
| Návšteva checkoutu | Existujúca prvostranná marketingová relácia s `checkout_at`, iba po analytickom súhlase. Zahŕňa aj návštevu pred prípravou platby. | Samostatný údaj v presnosti merania; nie menovateľ prevádzkového funnelu. Pred nákupom nepoznáme metódu a produkt, preto pri ich filtrovaní údaj nezobrazujeme. |
| Nákupný pokus | Existujúci serverový `checkout_attempts.id`, vzniká pred požiadavkou na Stripe. | Jeden nákup; opakovaná požiadavka s tým istým kľúčom a obnovenie stránky nezvyšujú počet. Nový nezávislý nákup aj s rovnakým e-mailom je samostatný. |
| Stripe relácia | Server priradil Stripe Checkout Session k nákupu. | Raz za pokus. Nepotvrdzuje načítanie polí. |
| Načítané polia | `PaymentElement.ready`. | Unikátne pokusy aj samostatný počet všetkých načítaní vrátane obnovení. Každé načítanie má hashované UUID, iba kartový formulár. |
| Údaje v poliach | `PaymentElement.change` s `empty === false`. | Prvé hlásenie za pokus. Zahŕňa automatické vyplnenie, nepreukazuje fyzické písanie. Obsah polí ani `event.value` sa nečíta ani neposiela. |
| Kompletné polia | `PaymentElement.change` s `complete === true`. | Prvé hlásenie za pokus. Údaje sú potenciálne kompletné podľa Stripe, nie schválené bankou. Neskoršie vymazanie neruší historicky dosiahnutý krok. |
| Validácia prešla | `actions.validateElements()` vráti úspech pred potvrdením karty. | Prvý dosiahnutý krok, v detaile. Validačná chyba nikdy nevytvorí potvrdenie. |
| Potvrdené zákazníkom | Bezprostredne pred skutočným `actions.confirm()`, po validácii alebo autorizovanom Express `confirm`. | Unikátne nákupy aj samostatný počet všetkých volaní vrátane opakovaní. Každé volanie má UUID; server uloží jeho hash. Dvojklik chráni existujúci zámok formulára. |
| Peňaženky | Express `ready.availablePaymentMethods`, `confirm` a `cancel`. | Dostupnosť a zatvorenie raz za pokus, potvrdenia samostatne s metódou Apple Pay / Google Pay. Zatvorenie môže prísť aj po autorizácii, preto samo neznamená nezaplatenie. |
| Overená úhrada | Existujúci podpísaný webhook a overená Stripe Session, prípadne historický migrovaný serverový výsledok. | Pre nový funnel iba pokusy od začiatku merania. Browserový úspech, timeout ani samotné polia úhradu nevytvárajú. |
| Prístup a e-mail | Existujúce objednávky a stav `access_deliveries.sent`. | Nákup sa počíta až po vytvorení všetkých očakávaných prístupov / odovzdaní všetkých jeho e-mailov poskytovateľovi. Neznamená doručenie do schránky. Darček = jedna platba, dva prístupy. |

**Nemeriame otvorenie natívnej peňaženky.** Používaný `StripeCheckoutExpressCheckoutElement` nepodporuje `click` ani `availablepaymentmethodschange`; tieto listenery sa nepridávajú. Nepoužívame odhad podľa fokusu. Typy historických diagnostických udalostí nemenia toto obmedzenie.

Overené v oficiálnych definíciách [Checkout SDK](https://github.com/stripe/stripe-js/blob/master/types/stripe-js/checkout.d.ts) (`createPaymentElement` vracia `StripePaymentElement`) a [Payment Element](https://github.com/stripe/stripe-js/blob/master/types/stripe-js/elements/payment.d.ts). Dostupnosť nových udalostí bola navyše potvrdená skutočným produkčným Stripe.js bez uskutočnenia úhrady.

## Kohorta a presnosť

- Obdobie vyberá dátum **vzniku nákupného pokusu**, výsledok je aktuálny k času načítania. Neskoršia úhrada sa objaví pri pôvodnej kohorte. Konverzia = overené peňažné úhrady / pokusy s nenulovou cenou. Nulové objednávky a refundácie sú samostatne; úhrada zostáva historicky dosiahnutá aj po refundácii.
- Preklik Nákupy z predajného funnelu naďalej používa presný výber podľa dátumu úhrady a jeho snapshotu. V tomto režime prehľad výslovne upozorňuje, že výber iba uhradených nákupov nemeria straty medzi krokmi.
- Filtre produktu a metódy upravujú celý prehľad aj tabuľku a resetujú stránkovanie. Pri zaplatenom nákupe má prednosť overená skutočná metóda; pri nezaplatenom posledné klientské potvrdenie. Bez známej metódy zostáva Neznáme. Filter produktu znamená obsah nákupu, aj knihu kúpenú ako doplnok.
- Začiatok merania je uložený v `payment_progress_meta.started_at` pri migrácii 0019. Staršie pokusy zostávajú v tabuľke, ale neodhadujeme im kroky a nepočítame ich do nového funnelu. Nový pokus bez klientského hlásenia je zobrazený ako chýbajúci záznam, nie dokázaný odchod.
- Klientské hlásenia môžu chýbať pri strate internetu, blokovaní požiadaviek alebo starej otvorenej stránke. Meriame ich oddelene od serverových úhrad. Počet chýbajúcich nasledujúcich signálov nie je súčet rozdielov nezávislých stĺpcov a nie je dôkaz opustenia.
- Definitívne vypršanie/zrušenie, technická chyba, bankové odmietnutie, dostupný kód overenia/3-D Secure a zatvorenie peňaženky zostávajú rozlíšené. Neznámy alebo pomalý výsledok sa nepovažuje za zamietnutie. Dôvody poskytovateľa sú dostupné iba cez povolené bezpečné kódy.

## Odolnosť, retencia a kapacita

Klient posiela iba prvé dosiahnutie jednotlivých míľnikov za pokus, nie každé písmeno ani každú zmenu poľa. Načítania formulára majú navyše samostatné identifikátory, aby sa dal odlíšiť celkový počet otvorení od unikátnych nákupov. Volania potvrdenia majú vlastné identifikátory. Server deduplikuje míľniky a v transakčnom D1 batchi zapisuje identifikátor potvrdenia spolu s inkrementom súhrnu; súbežné opakovanie nezvýši počet. Presnosť potvrdení sa neopiera o päťminútové zoskupovanie chýbových logov. Staré klienty bez UUID zostávajú iba diagnostickými signálmi.

Diagnostika je asynchrónna, platba na ňu nečaká. Žiadne údaje karty, CVC, mená, heslá, client secrets ani surové správy Stripe sa do nových tabuliek neukladajú. Verejný zapisovací endpoint má existujúcu ochranu rovnakého originu, allowlist a limit 60 požiadaviek/minútu na hashovaný sieťový rozsah; prekročenie neblokuje platbu. Prehľad zostáva za existujúcou administrátorskou autentifikáciou.

Podrobné diagnostické udalosti a hashe potvrdení majú 90-dňovú retenciu, súhrn pri nákupe sa pri ich zmazaní nenuluje. Opakovanie doručenia je deduplikované počas retenčného obdobia; klient udalosti dlhodobo nefrontuje.

Audit pokračuje bez prehliadača každých 10 minút. Namiesto pôvodných 8 kontrol iba z posledných 7 dní spracuje najviac 24 relácií na beh, po štyroch súbežne; každé čítanie rozbaľuje intent/charge. Dosiahne aj staršie nedoriešené pokusy. Ide o kapacitu do 144 kontrol/h pri plnej dávke, nie záruku neobmedzenej návštevnosti. Ukladá počet skontrolovaných, zostávajúcu frontu a vek najstaršej čakajúcej kontroly. Chýbajúci/starší audit alebo čakanie nad 30 minút spôsobí neaktuálny stav v managemente. Vyšší objem treba riešiť podľa skutočnej fronty; presné Cloudflare poplatky a Observability sú samostatná otvorená úloha, nie overené tvrdenie tejto zmeny.

## Overenie

- `npm --prefix admin test`: 106 testov vrátane skutočného Workers/D1 runtime. Doplnená kontrola súbežného opakovania a inkrementu potvrdení priamo v D1, filtrov, kohorty, historických dát, darčeka, zdarma, refundácie, retencie a auditu dlhšej fronty.
- `tests/checkout-progress.test.cjs`: nasadzovaný checkout, skutočné Worker handlery a lokálna SQLite; karta aj obe peňaženky, hra aj samostatné knihy, opakované chyby a opravy, dvojklik, refresh a porovnanie presných počtov s managementom. Chromium a WebKit, mobilné aj desktopové rozmery. Obsah Stripe udalosti sa nedostane do diagnostického payloadu.
- `STRIPE_INLINE_SMOKE=1 ... node --test tests/stripe-inline-live.test.mjs`: skutočný Stripe API/SDK, načítanie, zadávanie, kompletnosť, validácia a identifikátor potvrdenia. Platobné požiadavky sú v prehliadači zablokované; nevznikne PaymentIntent ani úhrada a vytvorené nezaplatené Session sa expirujú.
- Existujúce regresie `checkout-payment`, `checkout-recovery`, `payment-admin` a `marketing-dashboard` preverujú zachovaný formulár, timeout, návrat z banky, neskorý overený výsledok, pôvodné stavy a presný preklik nákupov do platieb.

Ostrý nákup ani nové fyzické testovanie bankových aplikácií sa pri tejto zmene nevykonáva. Pôvodné peňaženky vlastník overil a uzavrel 2. 11.; nové klientské meranie je overené vyššie uvedenými automatizovanými a SDK skúškami. Overenie skutočného Meta Purchase a napojenie reklamných výdavkov ostávajú v samostatnom [checkliste](DOKONCIT-meta-ads-a-purchase.md).
