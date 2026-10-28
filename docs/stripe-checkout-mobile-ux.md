# Pixelkovia – kompaktná platba na mobile

Aktuálny stav k 28. 10. 2026. Zdroje sú `checkout.html`, `checkout.css`, `checkout.js` a `admin/src/commerce.mjs`. Ceny, objednávky, doručenie a oprávnenia spracúva existujúci backend; podrobnosti sú v [nastavení platieb](payment-setup.md).

## Správanie

- Ponuka má tri rovnako vysoké, kratšie riadky. Názov, krátky opis a prípadná ukážka tvoria zvisle vycentrovaný blok. Atlas zastupuje Guardy. Platobná poznámka a garancia sú zarovnané na stred. Hlavička obsahuje „← Späť“.
- Kniha **Po veľkom záblesku** používa v spoločnom katalógu údaj **20–25 minút spoločného čítania**.
- Súhrn **Vaše dobrodružstvo** a sekcia **Bezpečná platba** sú v jednom zelenom paneli, bez druhej karty a opakovanej hlavičky s cenou. Panel má na desktope maximálnu šírku **660 px**; Stripe vypĺňa jeho vnútornú šírku. Na mobile panel využíva dostupnú šírku.
- **Pokračovať k platbe** otvorí platbu priamo pod súčtom a skryje sa. Zostáva jediná kartová akcia **Zaplatiť [suma]** a dostupné tlačidlá peňaženiek. Pôvodná ponuka a e-mail zostávajú viditeľné, ale uzamknuté. **Upraviť objednávku** platbu zbalí a údaje znovu sprístupní. Garancia je až pod platbou.
- Platba používa verejný Stripe Elements SDK nad Checkout Sessions (`ui_mode: elements`), samostatný Payment Element a Express Checkout Element. Form SDK s veľkým blokom Contact/Link už nový klient nepoužíva.
- Oficiálny Appearance API používa `inputs: condensed`, slovenčinu a predvolené **Slovensko / SK**. Krajina zostáva zmeniteľná. Údaje karty sú vo vlastnom iframe Stripe; nezasahujeme do jeho DOM.
- V tejto relácii sú ostatné aktuálne zapnuté miestne metódy a splátky vylúčené cez `excluded_payment_method_types`. Link vypína `wallet_options.link.display: never` a nastavenie prvkov; globálne nastavenia iných aplikácií sa nemenia.
- Apple Pay a Google Pay majú vlastný priestor nad kartou, ktorý sa skryje, ak ich Stripe na zariadení neponúkne. Nepoužívame súkromný preview režim Form SDK.
- Vlastné tlačidlo uvádza presnú sumu z SDK; menu a centy porovnáva so serverovou odpoveďou. Dvojité kliknutie ani súbeh karty a peňaženky nepotvrdia objednávku dvakrát. Úspech SDK čaká na overený stav servera.
- Voucher `free` vynechá údaje karty, ale objednávku potvrdí cez Stripe; `1e` zachová platenú objednávku za presne 1 €. Návrat k úprave obnoví výber aj e-mail. Staršie otvorené záložky majú počas nasadenia kompatibilný režim `form`.

## Overenie

- Všetkých **33 serverových testov** a zostavenie Workeru prešlo. Overujú aj samostatné účty pri zhodnom e-maile, dve atómové objednávky, podpísané webhooky, refund, šifrované doručenie a preposielanie podpory.
- Všetkých **40 platobných scenárov** s riadeným SDK prešlo (20 Chromium + 20 WebKit). Pokrývajú šírky **360, 390, 430 a 1360 px**, korektné ceny, návrat, chyby, dvojité potvrdenie, peňaženku, zmenenú sumu a nenačítané polia karty. Spustenie: `PLAYWRIGHT_MODULE=/cesta/k/playwright [QA_BROWSER=webkit] node tests/checkout-payment.test.cjs`.
- Skutočný Stripe Payment Element bol vizuálne overený v Chromiu na **390 a 1360 px**. Predvolená krajina bola **Slovensko**, polia boli po slovensky a bez Contact/Link bloku. Spoločný panel mal približne **366 px** na mobile a **638 px** na desktope. Skutočné tlačidlá Apple Pay a Google Pay sa zobrazili nad kartou.
- Vizuálna kontrola iba otvorila nezaplatenú reláciu bez údajov karty či potvrdenia. Relácia bola ukončená so stavom `expired` / `unpaid`. Bankové overenie a platba z fyzickej peňaženky týmto overené nie sú.
- Návrat od banky má jeden súhrn s uloženou prezentačnou sumou. Bez uloženého prehľadu nezobrazuje nesúvisiaci predvolený košík. Zaplatenie vždy určuje server.

## Apple Pay / Google Pay

Produkčná doména `pixelkovia.rodulab.com` je zaregistrovaná, povolená a v Stripe má Apple Pay aj Google Pay stav `active`. V predvolenej konfigurácii **Your account**, ktorú používa checkout, sú obe peňaženky dostupné a zapnuté. Registráciu a zapnutie Google Pay dokončil vlastník cez Dashboard; následná kontrola cez Stripe API potvrdila stav domény aj konfigurácie.

Dostupnosť na konkrétnom zariadení závisí od prehliadača a nastavenej peňaženky. Registrácia domény a zobrazenie tlačidla samy osebe neoverujú úspešnú bankovú platbu.

## Snímky

| Pôvodný platobný formulár | Kompaktný Payment Element |
| --- | --- |
| [Pred – 390 px](screenshots/checkout-before-390.png) | [Aktuálne – 390 px](screenshots/checkout-payment-compact-390.png) |

[Desktop – 1360 px](screenshots/checkout-payment-compact-1360.png), [ponuka – mobil](screenshots/checkout-offer-390.png), [ponuka – desktop](screenshots/checkout-offer-1360.png). Snímky neobsahujú údaje platobnej karty.

Dokumentácia Stripe: [Elements SDK](https://docs.stripe.com/js/custom_checkout/init), [Payment Element](https://docs.stripe.com/js/custom_checkout/create_payment_element), [Express Checkout Element](https://docs.stripe.com/js/custom_checkout/create_express_checkout_element), [potvrdenie objednávky](https://docs.stripe.com/js/custom_checkout/confirm).
