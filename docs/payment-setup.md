# Platby a automatické doručenie

Používa sa účet Stripe **Pixelkovia**, `acct_1UVB5BGle1VvIsLT`, jednorazové platby v EUR. Predajné ceny zostávajú v spoločnom `site-config.js`: hra 14,99 €, každá kniha 4,99 €, kompletný balík 19,98 €, voliteľný Atlas zdarma.

## Nastavenie kľúčov

Kľúče patria do **Codespaces secrets**, s prístupom repozitára `romanduris/Pixelkovia`, a do Cloudflare Worker secrets. Nezadávajú sa do chatu, Git súborov ani argumentov príkazu.

- `PIXELKOVIA_TOKEN`: existujúci Cloudflare token.
- `CUSTOMER_AUTH_SECRET`: existujúci náhodný autentifikačný a šifrovací kľúč; po začatí predaja ho neotáčať bez samostatného migračného postupu.
- `STRIPE_SECRET_KEY`: preferovaný obmedzený `rk_live_` kľúč pre vlastný server. Potrebuje čítanie účtu a relácií, tvorbu Checkout Sessions a správu platobného webhooku.
- `STRIPE_PUBLISHABLE_KEY`: verejný `pk_live_` kľúč rovnakého účtu.
- `RESEND_API_KEY`: kľúč Resend s oprávnením na nastavenie odosielacej domény a odosielanie.
- `STRIPE_WEBHOOK_SECRET`: vygeneruje sa pri vytvorení endpointu a musí zostať zachovaný.

```sh
node scripts/configure-commerce.mjs --interactive
```

Skript číta chýbajúce kľúče skrytým vstupom, overí účet Pixelkovia a prijímanie platieb, uloží kľúče ako Codespaces secrets, nastaví iba e-mailové DNS záznamy pre `pixelkovia.rodulab.com`, overí doménu Resend a vytvorí alebo opätovne použije platobný webhook. Následne nastaví Worker secrets. Existujúce konfliktné DNS neprepisuje. Hodnoty kľúčov nevypisuje.

Každý kľúč kontroluje hneď po zadaní. Ak je testovací, zamenený alebo zamaskovaný, vypíše názov premennej a konkrétny dôvod a zopakuje iba jej výzvu. Vkladajte celý kľúč cez tlačidlo kopírovania v Stripe, bez názvu premennej. Okolité úvodzovky a značky vloženia terminálu skript odstráni. Platnosť a oprávnenia následne overí poskytovateľ.

Resend je zriadený cez Stripe Projects v bezplatnom pláne. Pri prvom nastavení v aktuálnom Codespace možno použiť jeho vygenerované prostredie bez zobrazovania kľúča:

```sh
node --env-file=/tmp/pixelkovia-tools/.env scripts/configure-commerce.mjs --interactive
```

Súbor spravuje CLI; ručne ho neupravovať ani nevypisovať. Tento dočasný súbor nie je potrebný na prevádzku webu. `RESEND_API_KEY` je uložený aj v Codespaces secrets a Cloudflare. Po obnovení Codespace sa trvalé secrets načítajú do prostredia a stačí pôvodný príkaz bez `--env-file`.

DNS názvy Resend, napríklad `send.pixelkovia`, sú relatívne k zóne `rodulab.com`. Skript ich prevedie na `send.pixelkovia.rodulab.com`, podporuje aj úplné názvy a CNAME bez proxy. Záznamy mimo odosielacej subdomény odmietne.

Ak je DNS overenie ešte rozpracované, platby ostanú vypnuté. Opakovanie skriptu používa uložené secrets a existujúci webhook; nevytvára druhý endpoint. Web funguje aj po zastavení alebo prestavaní Codespace.

## Spracovanie nákupu

E-mail je povinný pred vytvorením Checkout Session. Formulár karty je vložený na checkout stránke; banka môže vyžiadať overenie. Cenu a obsah objednávky určuje server, nie suma zaslaná prehliadačom.

Aktuálna integrácia používa serverový režim `ui_mode: form`, Stripe.js `endive/stripe.js` a `initCheckoutFormSdk`. Jednokrokový formulár vytvorený cez `createForm({layout: 'expanded'})` používa Appearance API s témou `night`, tmavými poľami a mätovým tlačidlom. Údaje karty zostávajú v iframe Stripe.

Schválené [mobilné UX zadanie](stripe-checkout-mobile-ux.md) výslovne obmedzuje túto platbu na `payment_method_types: ['card']`. Karty zahŕňajú aj podporované Apple Pay/Google Pay peňaženky; ich dostupnosť určuje Stripe a zariadenie. Vo formulári je `expressCheckout.paymentMethods.link: 'never'`. Automatická konverzia meny je vypnutá pre túto reláciu, aby zostala zobrazená pôvodná cena v EUR. Globálna konfigurácia Stripe účtu sa nemení.

Pri otvorení platby výber produktov nahradí stručný prehľad objednávky a formulár. Návrat k úprave obnoví výber aj e-mail. Prehľad pre návrat od banky sa dočasne uchováva v `sessionStorage` bez hesiel či údajov karty; slúži výhradne na zobrazenie. Cenu aj zaplatenie vždy overuje server.

Ponuka používa jeden výber oboch kníh: hra 14,99 € a knihy spolu 4,99 € namiesto 9,98 € (položky 2,49 € a 2,50 €), spolu 19,98 €. Server odosiela rovnaký rozpis do Stripe a uloží presné jednotkové ceny pri vytvorení relácie. Dokončenie ich prenesie do položiek objednávky. Zľava 4,99 € sa medzi knihy rozdelí na celé centy. Už otvorené relácie zachovajú uložené jednotkové ceny aj pôvodnú celkovú sumu.

## Druhá hra pre ďalšiu rodinu

K základnej hre možno výslovne pridať druhú hru za **9,99 €**. Bez kníh je súčet 24,98 €; s balíkom kníh 29,97 €. Atlas je voliteľný a zdarma. Samostatná kniha nemá ponuku druhej hry. Používa sa iba e-mail kupujúceho, bez mena a ďalšieho formulára pre príjemcu.

Migrácia `0007_additional_game.sql` ukladá výber a presnú cenu druhej hry do existujúceho `checkout_attempts`. Tabuľka `checkout_orders` prepája jednu Stripe reláciu s hlavnou a prípadnou druhou objednávkou a doplní väzby aj k starším objednávkam. Štruktúra pôvodných objednávok a prihlasovacie údaje sa nemenia.

Po overení Stripe relácie vzniknú obe objednávky, účty, heslá, oprávnenia a šifrované doručovacie záznamy v jednom atómovom D1 batchi. Hlavná objednávka obsahuje vlastný výber; druhá iba `episode-1` za 9,99 €. Celkové sumy oboch sa musia rovnať overenej platbe. Opakované udalosti nevytvoria ďalšiu dvojicu; zlyhanie batchu neuloží polovicu nákupu. Existujúca otvorená relácia bez druhej hry sa spracuje rovnako ako pred zmenou.

Oba e-maily idú kupujúcemu z `Adam@pixelkovia.rodulab.com`. Druhý má vlastný predmet „Vaša druhá hra Pixelkovia – na preposlanie“ a obsahuje iba heslo druhého účtu. Každý sa doručuje a opakuje nezávisle; checkout hlási doručenie až po odoslaní oboch. Úplný refund pôvodnej platby zneplatní obe objednávky. `free` vynuluje aj druhú hru a po dokončení overenej nulovej relácie vytvorí dva oddelené prístupy.

`admin/tests/additional-game.test.mjs` overuje ceny, oddelenie účtov a kníh, dva odlišné e-maily, opakovanie iba neúspešného doručenia, odstránenie šifrovaných správ po úspechu, atómový rollback, podpísané webhooky, idempotenciu, refund pred aj po dokončení a nulovú dvojicu s voucherom. Používa izolovanú databázu a nahradených poskytovateľov; neposiela živé e-maily ani platby.

Udalosť `confirm` odovzdáva `formConfirmEvent` do `actions.confirm` s `redirect: 'if_required'`. Počas potvrdenia je zmena objednávky blokovaná a druhé kliknutie sa ignoruje. Chyba ponechá formulár pripravený na opravu. Úspech SDK spustí overenie objednávky na serveri; sám neudelí prístup ani neoznačí nákup za zaplatený. Návrat od banky používa rovnaké serverové overenie a nevytvorí ďalšiu platobnú reláciu.

Podpísané udalosti `checkout.session.completed` a `checkout.session.async_payment_succeeded` spúšťajú vytvorenie prístupu len po overení `payment_status=paid`, režimu, sumy, meny a väzby na serverovú objednávku. Opakovaná udalosť nevytvorí ďalší účet. Úplný refund zneplatní zaplatený stav objednávky. Návratová URL sama prístup neudelí.

Každý nákup má vlastné zákaznícke ID, zakúpené produkty a náhodné heslo, aj pri rovnakom e-maile. E-mail z **Adam@pixelkovia.rodulab.com** obsahuje iba krátke poďakovanie, odkaz na `/Supervisor`, prihlasovací e-mail a heslo pre daný nákup. Fronta je šifrovaná, úspešné odoslanie vymaže šifrovaný obsah a neúspešné odoslanie sa opakuje.

Pod tlačidlom kúpiť je odkaz „Mám zľavový kód“, ktorý otvorí dialóg. Schválený voucher `free` (bez ohľadu na veľkosť písmen a okolité medzery) zníži celú vybranú objednávku na 0 €. Platí pre hru, balík aj samostatné knihy. Neznámy kód server odmietne. Voucher sa neukladá do URL ani lokálneho úložiska.

Server zapíše `voucher_code=free` a nulovú cenu do `checkout_attempts` a vytvorí nulové Stripe položky. Podľa [dokumentácie Stripe pre nulové objednávky](https://docs.stripe.com/payments/checkout/no-cost-orders?ui=checkout-form) formulár pri celkovej sume 0 nevyžaduje kartu. Prístup sa vytvorí až z podpísanej udalosti `checkout.session.completed` po načítaní relácie cez Stripe API: `status=complete`, `payment_status=no_payment_required`, suma 0, správna mena, režim účtu, väzba na serverový pokus a potvrdený voucher v metadata. Nulová relácia nemá PaymentIntent. Opakovaná udalosť nevytvorí ďalšiu objednávku; opakovaný samostatný nákup má vlastné heslo a šifrovaný doručovací záznam.

Starý adaptér Payment Links a ručné doručovanie sa nepoužívajú. Voucher neobchádza kontrolu pripravenosti Stripe ani e-mailového odosielateľa.

## Overenie

`admin/tests/customer-access.test.mjs` kontroluje dva nezávislé nákupy rovnakého e-mailu, idempotenciu, prihlásenie, rozdielne knihy, podpis platobnej udalosti a odstránenie obsahu doručovacej fronty. `tests/customer-journey.test.cjs` overuje skutočný portál, všetkých sedem úloh a hodnotenie v izolovanom Workers/D1 prostredí. Tieto testy nenahrádzajú platbu kartou a doručenie cez živého poskytovateľa.

`node --test tests/email-dns.test.mjs` overuje názvy odosielacích DNS záznamov vrátane ochrany ostatných subdomén.

`node --test tests/commerce-credentials.test.mjs` overuje skryté zadávanie, opakovanie výzvy, rozlíšenie chýb a obnovenie terminálu po zrušení bez vypísania zadanej hodnoty.

`PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-payment.test.cjs` overuje stavový tok formulára v prehliadači s riadenou náhradou Stripe SDK: povinný e-mail, opakované kliknutie, chybu a opakovanie, zlyhanie načítania, potvrdenie serverom a návrat od banky. Kontroluje aj šírky 360, 390, 430 a 1360 px, sumy 14,99 €, 19,98 €, 24,98 € a 29,97 €, samostatné knihy za 4,99 €/9,98 € a voucher za 0 €, dotykové ovládanie na mobilných šírkach a zachovanie výberu aj e-mailu pri návrate z platby. S `QA_BROWSER=webkit` spustí rovnaké scenáre vo WebKite; predvolene používa Chromium. Dňa 28. 10. 2026 prešlo všetkých trinásť scenárov v každom prehliadači. Tieto scenáre neposielajú skutočné platby a neoverujú peňaženky na fyzickom zariadení.
