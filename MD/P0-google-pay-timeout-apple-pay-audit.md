# P0 – timeout Google Pay a ochrana pred opakovanou platbou

Stav k 28. 10. 2026: oprava implementovaná; natívne platby Google Pay aj Apple Pay zostávajú na tomto checkoute vypnuté do overenia na zariadeniach. Platba kartou zostáva dostupná. Globálne nastavenia účtu Stripe sa nemenia.

## Zistenia a hranice dôkazov

- Čítanie produkčného Stripe API potvrdilo dve úspešné platby Google Pay po 1 € a jednu úspešnú kartovú platbu 14,99 €. Obe peňaženky mali `PaymentIntent.status=succeeded` a `latest_charge.payment_method_details.card.wallet.type=google_pay`. Otvorené alebo expirované náhľadové relácie sa nepočítajú ako neúspešné platby.
- Existujúca D1 databáza potvrdila objednávky a odoslané prístupové správy pri všetkých troch nákupoch. Pri Google Pay sa objednávky uložili približne 3,2 a 4,0 sekundy po vytvorení úspešnej platby; doručenie do odosielacej služby nasledovalo približne o 0,6 sekundy neskôr.
- Pôvodný klient po úspechu SDK okamžite zničil Payment/Express Checkout Element a v rovnakom `confirm` handleri čakal na serverový polling. Pri každej výnimke bez rozlíšenia volal `paymentFailed()`. Po vyčerpaní pollingu znovu povolil úpravu objednávky. Server pre každý POST vytváral nový pokus s novým Stripe idempotency key.
- Nesprávne označenie neznámeho výsledku za zlyhanie a možnosť novej relácie sú potvrdené chyby kódu. Predčasné zničenie elementu a čakanie handlera sú podozrivé príčiny natívneho timeoutu. Historický záznam z prehliadača chýba; presná príčina pôvodného hlásenia `callback timeout` nie je preukázaná. Približne 12-sekundové čakanie aplikácie neoznačujeme za preukázaný limit Google Pay.
- Apple Pay používa ten istý `confirm` handler. Nie je dôkaz, že by pôvodne na zariadení zlyhalo.

## Výsledné správanie

`checkout.js` odovzdáva pôvodný `expressCheckoutConfirmEvent` do `actions.confirm`, uvádza návratovú URL a necháva Stripe riadiť natívny platobný hárok. Po výsledku nečaká na webhook, objednávku ani e-mail a neničí element. Samostatný 20-sekundový watchdog iba prepne stav aplikácie; nevyvoláva `paymentFailed()` ani neukončuje natívnu platbu. Jeho čas nie je tvrdením o limite peňaženiek.

Jednoznačný `card_error` alebo `validation_error` umožní vedomú opravu a opakovanie v rovnakej relácii. Výnimka spojenia, neznámy výsledok alebo oneskorenie ukáže:

> Overujeme vašu platbu. Prosíme, neplaťte znova. Potvrdenie a prístup vám po úspešnej úhrade prídu e-mailom.

Stav blokuje novú platbu a ponúkne overenie pôvodnej. Identifikátor relácie zostáva v návratovej URL; lokálne sa uchová náhodný identifikátor pokusu a výber objednávky, bez údajov karty či hesiel. Obnovenie stránky, návrat späť a druhá záložka obnovujú pôvodný pokus. Browser storage slúži iba obnove; prístup ani zaplatenie neurčuje.

`admin/migrations/0010_checkout_requests.sql` pridáva jedinečný serverový pokus a jedinečný aktívny nákup pre e-mail. Atómový D1 batch zabraňuje dvom súbežným pokusom; opakovanie po stratenej odpovedi používa pôvodný Stripe idempotency key a rovnaké parametre. Iný identifikátor z prehliadača neobíde nevyriešenú platbu. Kontrolujú sa aj staršie relácie pred migráciou. Úprava objednávky najskôr na serveri overí a bezpečne expiruje pôvodnú Stripe Session; neznámy výsledok, `processing` či `requires_action` zámok neuvoľnia. Ďalší nákup po potvrdenej platbe vyžaduje výslovnú akciu a vytvorí vlastnú objednávku a prístup.

`/api/checkout/status` overuje reláciu priamo v Stripe vrátane serverovej sumy, EUR, režimu účtu, väzby na pokus a voucherov. Rozlišuje `pending`, `failed`, `expired`, `paid` a `refunded`. Úspech sa zobrazí aj pri oneskorenom webhooku; doručenie e-mailu má vlastný stav. Stavové API nevytvára účty ani oprávnenia. Tie stále vznikajú z podpísaných webhookov a overenej Stripe relácie.

Webhook ukladá objednávky pred potvrdením prijatia. Posielanie správ odovzdáva do `context.waitUntil`, takže oneskorený Resend neblokuje odpoveď webhooku. Existujúce opakovanie doručenia, šifrovanie, odstránenie odoslaných správ, atómové dve objednávky a refund zostávajú zachované. Generovanie hesiel a prihlasovanie sa nemenili.

## Overenie

Prešlo **42 serverových testov** a **66 prehliadačových scenárov**: 21 regresných + 12 obnovovacích v každom z prehliadačov Chromium a WebKit. Prešli aj statické zostavenie a dry-run zostavenia Workeru.

```sh
node scripts/prepare-static.mjs
npm run build:check --prefix admin
npm test --prefix admin
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-payment.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright QA_BROWSER=webkit node tests/checkout-payment.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-recovery.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright QA_BROWSER=webkit node tests/checkout-recovery.test.cjs
```

- Serverové testy používajú izolovanú SQLite/D1 databázu a nahradené Stripe/Resend. Overujú súbeh dvoch kľúčov, stratenú odpoveď pri vytváraní, blokovanie neznámej platby, expiráciu pred novým pokusom, staršie relácie, potvrdenie bez webhooku/e-mailu, nulový voucher, úmyselný nový nákup a duplicitné či prehodené webhooky. Existujúce testy kontrolujú ceny 14,99 €, 19,98 €, staršie otvorené relácie za 19,99 €, darovanú hru, samostatné prístupy a refund.
- Prehliadačové testy spúšťajú skutočný klient v Chromiu a WebKite s nahradeným SDK. Pre Google Pay aj Apple Pay overujú návrat callbacku pri zablokovanom stavovom API, zachovaný element, úspešnú platbu pri výnimke SDK, neznámy výsledok aj výpadok stavového API, refresh/back/druhú záložku, zamietnutie, zrušenie, oneskorený úspech a stratenú odpoveď vytvárania.
- Mobilné snímky stavov potvrdenia a overovania sa vizuálne kontrolujú pri šírke 390 px. Existujúca regresná sada pokrýva aj 360, 430 a 1360 px, kartu, vouchery a ceny.
- Testy nevytvárajú živé platby a neposielajú skutočné e-maily. Produkčné vyšetrovanie bolo iba na čítanie.

## Apple Pay a Google Pay – zostávajúca podmienka aktivácie

Obe vetvy sú skontrolované a majú spoločné automatizované testy. Verejný `checkoutConfig()` vracia pre obe peňaženky `false`; Payment Element ich tiež nezobrazuje. Obnoviť ich možno až po samostatne overenej zmene.

Podľa aktuálnej matice Stripe funguje Apple Pay v Safari a podporovaných prehliadačoch iOS 16+; na ostatných desktopových prehliadačoch vyžaduje `paymentMethods.applePay: always`. Google Pay v niektorých prehliadačoch vrátane Safari tiež vyžaduje `always`. Pri budúcom povolení zachováva klient tieto nastavenia, no rozhodujú udalosti dostupnosti zo Stripe; na Chrome/Android sa Apple Pay neponúka.

Skutočný test Google Pay na podporovanom zariadení a Apple Pay v podporovanom prehliadači s pripravenou Apple peňaženkou zostáva povinný. WebKit s mockom neoveruje natívny Apple Pay hárok, bankovú autorizáciu ani príčinu pôvodného timeoutu. Apple Pay dostupnosť závisí od prehliadača, zariadenia, pripravenej peňaženky a registrovanej domény; samotné tlačidlo ani registrácia nie sú E2E platbou. Bez tohto overenia zostávajú peňaženky vypnuté. Živý platený test vyžaduje výslovné povolenie vlastníka.

Oficiálne podklady overené pomocou Stripe CLI 1.55.3: [Checkout confirm](https://docs.stripe.com/js/custom_checkout/confirm), [Express confirm event](https://docs.stripe.com/js/elements_object/express_checkout_element_confirm_event), [prechod na Checkout Sessions](https://docs.stripe.com/elements/express-checkout-element/migration?payment-ui=embedded-components), [Express Checkout a podporované prehliadače](https://docs.stripe.com/elements/express-checkout-element), [testovanie peňaženiek](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment?payment-ui=embedded-components).
