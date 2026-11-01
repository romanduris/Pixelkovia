# P0 – pôvodný inline checkout s opraveným potvrdením

Stav 1. 11. 2026: podľa upresnenia vlastníka je obnovený pôvodný vzhľad a rozbaľovanie platobného formulára priamo v zelenom súhrne. Samostatná externá platobná obrazovka sa pre nové nákupy nepoužíva. Rovnaký klient a backend obsluhujú funnel, samostatné knihy aj dokúpenie z rodičovského portálu.

## Preukázané chyby a oprava

- SDK vyhadzovalo `IntegrationError`, pretože klient posielal `returnUrl` popri serverovom `return_url`. Návratová adresa sa teraz nastavuje iba na serveri. Presné parametre sú overené skutočným SDK aj kontraktovými testami.
- Klient očakával iné `error.type`. Checkout SDK používa `validateElements` a výsledok s `error.code`, napríklad `paymentFailed`. Neúplné údaje sa overia pred potvrdením, polia zostanú otvorené a opraviteľné. Zamietnutie obnoví tú istú reláciu, neistý výsledok musí najskôr overiť server.
- Peňaženky boli výslovne vypnuté v konfigurácii. Sú znovu povolené; dostupnosť riadi Stripe a schválená registrácia domény. Pôvodný `expressCheckoutConfirmEvent` sa odovzdá do SDK, handler nečaká na polling a zachová elementy aj pri pomalom potvrdení. Výpadok nevyvoláva falošné `paymentFailed`.
- Príliš široký zámok vyžadoval ďalšie potvrdenie aj po staršom zaplatenom nákupe. Overený dokončený nákup už neblokuje nové kliknutie na nákup s rovnakým e-mailom. Rovnaký kľúč zostáva idempotentný a rozbehnuté alebo neisté spracovanie platby blokuje súbežný nový pokus. Každá nová zaplatená objednávka má vlastné heslo a prístup.

## Zachované správanie a ochrany

HTML a CSS boli obnovené z `886fa85`; navyše sú len skryté prístupné hlásenia e-mailu a červený štýl pri skutočnej chybe. Pôvodné kompaktné polia, farby, slovenské texty, suma na finálnom tlačidle, spoločný zelený panel a mobilné rozloženie zostávajú zachované. Údaje karty ostávajú v iframe Stripe.

Cena, EUR, režim účtu, voucher a väzba relácie sa overujú na serveri. Prístup udeľuje len overený podpísaný webhook. Izolované nákupy, dve atómové objednávky, šifrované doručenie, odstránenie odoslaného obsahu a refund ostávajú zachované.

Po potvrdení sa uložený zaplatený pokus odstráni; nová návšteva funnelu preto nezobrazí staré potvrdenie nad novým košíkom. Návratový odkaz na konkrétnu platbu stále zobrazuje jej vlastný výsledok. Stratené odpovede, refresh, staré lokálne pokusy a prechod zo staršej externej relácie používajú rovnaké kľúče a bezpečné uzavretie pred náhradou.

## Overenie a jeho hranice

- Serverové testy overujú súbeh, idempotenciu, izoláciu, ceny, vouchery, podpísané udalosti, e-maily, refund a opakovaný nákup vrátane darčekovej hry bez extra potvrdenia.
- Browser testy v Chromium aj WebKite overujú mobilné šírky 360/390/430 a desktop, pôvodný inline layout, aktuálny kontrakt SDK, neplatné polia, zamietnutie, neznámy výsledok, výpadky, dvojklik, refresh, expiráciu, neskoré potvrdenie a správanie oboch natívnych callbackov.
- `tests/stripe-inline-live.test.mjs` používa skutočné Stripe API a SDK s izolovanou databázou. Overuje 14,99 €/1 €/0 € a skutočné iframe polia, validáciu a opraviteľnosť bez odoslania platby. Požiadavky na potvrdenie/údaje karty sú blokované; relácie sa expirujú a API musí ukazovať žiadny PaymentIntent. Test neposiela e-maily.
- Mobilné snímky skutočného formulára pred chybou aj po chybe sa vizuálne kontrolujú vo viditeľnom výreze. Full-page screenshot mimo výrezu nemusí správne vykresliť iframe Stripe; rozmery polí sa overujú aj priamo v prehliadači.
- Skutočná banková úhrada, 3-D Secure a Apple Pay/Google Pay na fyzickom zariadení nie sú týmto overené. Predchádzajúci externý WebKit test mal lokálny TLS problém s `api.stripe.com`; produkčná bezpečnosť sa kvôli tomu nemení. Historická presná príčina pôvodného natívneho timeoutu nie je spätne preukázaná.

Podrobnosti a príkazy: [platby a automatické doručenie](../docs/payment-setup.md).

## Obnova nákupu na inom zariadení

Otvorený nezaplatený formulár s rovnakým e-mailom pôvodne blokoval nový nákup aj bez rozbehnutej bankovej platby. Nový prehliadač nemal kľúč pôvodného pokusu, preto jeho tlačidlo obnovy stále končilo tou istou chybou. Text pritom nesprávne tvrdil, že sa platba overuje.

Backend teraz pred náhradou overí pôvodnú reláciu, uzavrie iba bezpečne uzatvoriteľný nezaplatený formulár cez Stripe a opätovne overí expiráciu. Nezverejní jeho client secret druhému prehliadaču. Rozbehnuté spracovanie alebo bankové overenie zostáva chránené; ak počas uzatvárania vyhrá potvrdenie platby, náhrada sa nevytvorí. Stratená odpoveď expiračného API sa rozhoduje podľa nového overeného stavu. Súbežné pokusy môžu nahradiť nezaplatenú reláciu, ale nesmú ponechať dve otvorené platiteľné relácie.

Dočasné blokovanie má konkrétny dôvod v odpovedi API a zaznamenáva sa v managemente. Test `tests/checkout-device-recovery.test.cjs` overuje skutočný Worker a databázu z dvoch izolovaných prehliadačov pre 1 € hru aj obe knihy, expiráciu starého formulára, čakajúcu banku a súbeh potvrdenia s expiráciou. Skutočné Stripe API overuje bez úhrady aj `tests/stripe-inline-live.test.mjs`.

## Úplne vyplnené polia a chyba zbierania telefónu

Pokus kartou z 1. 11. 2026 o 20:06:33 Europe/Bratislava má v diagnostike `confirm_error`, ale v Stripe nevytvoril PaymentIntent. Skutočný SDK test s kompletnými verejnými testovacími údajmi a zablokovaným odoslaním platby reprodukoval `IntegrationError`: `fields.billingDetails.phone: never` požadovalo manuálne dodaný telefón, hoci Checkout Session telefón nezbierala. Pôvodné skúšky prázdnych a neplatných polí túto vetvu nezachytili.

Payment Element používa predvolené rozhodovanie Stripe o potrebných údajoch; nútené `never` pre e-mail a telefón je odstránené. Telefón sa pri tejto digitálnej objednávke navyše nevyžaduje. Test teraz vyplní kompletné verejné testovacie údaje a overí, že potvrdenie dôjde až na zámerne zablokovanú sieťovú hranicu, nevyhodí integračnú chybu a nevytvorí PaymentIntent ani úhradu.

Do managementu sa posielajú iba povolené kódy príčiny, bez správy SDK alebo obsahu polí. Známa prekážka potvrdenia ešte pred platbou explicitne ukončí natívny platobný hárok cez `paymentFailed`; neznámy výsledok siete/banky sa takto neoznačuje a naďalej čaká na overenie. Ak server potvrdí nezaplatený stav po chybe, klient vysvetlí nedokončené potvrdenie a ponúkne obnovu pôvodného formulára. Neskoré overené zaplatenie má prednosť pred chybovým hlásením.

Pokus Google Pay o 20:04 má záznam zatvorenia peňaženky bez potvrdenej úhrady. Samotný dôvod natívneho timeoutu nie je z tohto záznamu preukázaný. Zároveň bola nájdená medzera pred udalosťou `confirm`: `pageshow`/`storage` mohli pri návrate z natívnej aplikácie spustiť polling a skryť ešte otvorenú peňaženku, lebo ochrana začínala až pri potvrdzovaní. Ochrana teraz začína pri `click`; SDK `resolve()` sa zavolá synchronne, odmietnutý klik použije `reject()`. Natívny hárok, pôvodné iframe a zákaz druhej platby zostanú zachované aj pred `confirm`, pri zmene dostupnosti peňaženiek a návrate z aplikácie. Zrušenie peňaženky ochranu uvoľní; otvorenie má vlastnú bezpečnú diagnostickú udalosť. Chromium/WebKit testy overujú návrat pred potvrdením aj zrušenie. Tieto testy nenahrádzajú overenie peňaženky na fyzickom zariadení.
