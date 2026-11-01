# P0 – oprava karty a prechod na Stripe Checkout

Stav 1. 11. 2026: po súhlase vlastníka vlastné potvrdenie karty a callbacky peňaženiek nahrádza predpripravená Stripe stránka. Ponuka, ceny, vouchery, izolované prístupy, podpísané webhooky a doručovanie ostávajú zachované.

## Preukázaná príčina incidentu

- Produkčný JavaScript bol totožný s commitom `886fa85`. Konfigurácia výslovne vracala obe peňaženky vypnuté. Doména bola v Stripe povolená a Apple Pay/Google Pay mali aktívnu registráciu.
- So skutočným Stripe SDK a prázdnymi údajmi sa reprodukoval `IntegrationError`: `returnUrl` pri `confirm()` bol poslaný súčasne s už nastaveným serverovým `return_url`. Výnimka sa potlačila, formulár sa skryl a zákazník zostal v neistom overovaní. Žiadna karta ani platba sa neposlala.
- Po odstránení tejto duplicity iba v diagnostickom prehliadači Stripe vrátil `{type: error, error: {code: null, message: Číslo vašej karty je neúplné.}}`. Klient očakával iné `error.type`, preto aj túto validáciu nesprávne označil za neistú platbu.
- Dnešné dve pôvodné relácie za 1 € nemali PaymentIntent. Staršie úspešné platby ostali zachované. Historický natívny timeout Google Pay nie je týmto vyšetrovaním spätne vysvetlený.

## Výsledná zmena

Klient neposiela údaje karty, nenačítava Stripe.js a nevolá `confirm`. Server vytvorí `ui_mode: hosted_page`, nastaví iba príslušné `success_url`/`cancel_url`, názov, farby a písmo. Zákazník vie pred prechodom, že platbu dokončí na Stripe. Samotná URL ani lokálne úložisko neudeľujú prístup.

Server vracia overené stavy `ready`, `failed`, `pending`, `expired`, `paid`, `refunded`, `unknown`. Pripravená alebo zamietnutá platba sa obnoví v tej istej relácii. Bankové overenie, spracovanie a výpadok blokujú neoverenú novú platbu. Zmena výberu najskôr bezpečne expiruje pôvodnú reláciu. Obnova zo starého checkoutu neobíde tento krok. Po strate odpovede sa používa ten istý idempotency key; dlhodobo chýbajúce Stripe ID sa pred uvoľnením dohľadá u poskytovateľa.

Návrat zo Stripe funguje aj bez browser storage cez náhodné serverové checkout ID. Samostatná kniha zostáva samostatnou knihou. Návratová URL udrží vlastnú objednávku aj pri ďalšom nákupe v druhej záložke. Chyby sa zobrazujú výrazne červené s ikonou a konkrétnou ďalšou akciou; úspech zelený. Text sa vykresľuje bezpečne ako text.

## Dôkazy a hranice overenia

- Serverové testy pokrývajú súbeh, idempotenciu, stratenú odpoveď, bezpečné uzavretie, cenu, účet, vouchery, podpisy, izoláciu nákupov, dve atómové objednávky, heslá, e-maily a refund.
- Browser testy pokrývajú Chromium aj WebKit, mobilné šírky 360/390/430 a desktop, ceny a výber, chybový e-mail, návrat/späť, HTTP chyby, dvojklik, zastavenie pollingu, neskoré potvrdenie, zakázaný storage, starý formulár a podvrhnuté URL/texty. Snímky mobilnej chyby a skutočného Stripe formulára boli vizuálne skontrolované.
- Produkčné Stripe API prijalo presné nové relácie 14,99 €/1 €/0 €. Relácie používali vlastnú konfiguráciu účtu, v ktorej sú karta, Apple Pay aj Google Pay zapnuté a dostupné. Globálne konfigurácie ani iné integrácie sa nemenili.
- Opt-in test `tests/stripe-hosted-live.test.mjs` načítava skutočný Stripe Checkout a overuje validáciu polí. Vytvorené relácie sa expirujú, platobné POST požiadavky sú blokované a API musí potvrdiť, že nevznikol PaymentIntent. Test nepoužíva produkčnú D1 a neposiela prístupové e-maily.
- Tieto kontroly nepredstavujú uskutočnenú úhradu, overenie 3-D Secure cez banku ani natívnu platbu na fyzickom iPhone/Androide. Zobrazenie peňaženky závisí aj od podporovaného zariadenia a pripravenej peňaženky.

Detaily a spustenie kontrol: [platby a doručenie](../docs/payment-setup.md).

### Obmedzenie externého WebKitu v tomto Codespace

Vlastné obrazovky prešli v Chromium aj WebKite. Skutočný Stripe formulár a validácia prešli v Chromium. Pri samostatnom externom WebKite požiadavka na `api.stripe.com` zlyhala s `Unacceptable TLS certificate` a Stripe zobrazil svoju sieťovú chybu. Test neoznačujeme za úspešný a bezpečnosť produkcie sa kvôli nemu nemení. Overenie reálneho Safari/iPhonu zostáva otvorené.
