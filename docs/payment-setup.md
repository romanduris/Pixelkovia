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

E-mail je povinný pred vytvorením Checkout Session. Výber produktov zostáva na `/checkout`; samotné platenie preberá predpripravená zabezpečená stránka Stripe v slovenčine. Server určuje cenu aj obsah. Klient posiela `uiMode: hosted`, server používa `ui_mode: hosted_page` podľa existujúcej API verzie `2026-08-26.dahlia`.

Stripe riadi polia karty, validáciu, Apple Pay/Google Pay, bankové overenie a finálne potvrdenie. Naša stránka nenačítava Stripe.js, nemá vlastné `actions.confirm`, kartové tlačidlo ani callback peňaženky. Tým sú odstránené chyby dvojitého `returnUrl` a nesprávneho rozlišovania chýb Checkout SDK. Staré serverové režimy `elements`/`form` zostávajú len kvôli idempotentnej obnove už vytvorených pokusov; nový klient ich nevytvára.

`success_url` vracia zákazníka na `/checkout?session_id=…`; `cancel_url` používa náhodné serverové `checkout_id`, takže vie obnoviť tú istú reláciu aj bez browser storage. Oba odkazy zachovávajú aj samostatnú knihu. URL sama nepotvrdzuje úhradu. Stavové API znova načíta Stripe, overí sumu, EUR, účet, voucher a väzbu na pokus; vracia len zobrazený súhrn a bezpečnú pokračovaciu URL. Klient aj server povoľujú iba HTTPS `checkout.stripe.com/c/pay/` bez používateľského mena, hesla či iného portu.

Checkout používa dynamické metódy s výnimkami iba pre túto reláciu (`excluded_payment_method_types`). Link je skrytý cez `wallet_options.link.display: never`, automatická konverzia meny je vypnutá. Farby, meno Pixelkovia a písmo Inter sa nastavujú v konkrétnej relácii. Globálne nastavenia účtu sa nemenia. Produkčné API potvrdilo, že nové relácie používajú vlastnú predvolenú konfiguráciu účtu s dostupnou kartou, Apple Pay a Google Pay. Dostupnosť tlačidiel na konkrétnom zariadení riadi Stripe.

Vysvetlenia a výsledky na Pixelkovii používajú spoločný panel: informačný modrozelený, chyba červená s ikonou a textom, úspech zelený. Chyba e-mailu sa zobrazuje priamo pri poli s `aria-invalid` a `role=alert`. Pokračovanie používa tú istú Stripe Session; návrat, obnovenie a druhá záložka nevytvárajú novú úhradu. Zmena objednávky najskôr na serveri overí a expiruje pôvodnú reláciu. `processing`, `requires_action` a neistý výsledok ostávajú chránené pred novou platbou. Po vyčerpaní overovania je dostupné manuálne overenie; nezobrazuje sa nepravdivé zamietnutie bankou.

Prehľad na návrate určuje server. `localStorage` uchováva identifikátor pokusu a výber bez údajov karty či hesiel; neposkytuje prístup. Stratená odpoveď pri vytváraní sa opakuje s rovnakým obsahom a Stripe idempotency key. Ak po 30 minútach stále chýba uložené Stripe ID, bezpečné uzavretie najskôr vyhľadá pôvodnú reláciu v Stripe, overí ju a ukončí. Výpadok poskytovateľa zámok neuvoľní.

Ponuka používa jeden výber oboch kníh: hra 14,99 € a knihy spolu 4,99 € namiesto 9,98 € (položky 2,49 € a 2,50 €), spolu 19,98 €. Server odosiela rovnaký rozpis do Stripe a uloží presné jednotkové ceny pri vytvorení relácie. Dokončenie ich prenesie do položiek objednávky. Zľava 4,99 € sa medzi knihy rozdelí na celé centy. Už otvorené relácie zachovajú uložené jednotkové ceny aj pôvodnú celkovú sumu.

Migrácia `0010_checkout_requests.sql` pridáva atómový zámok aktívneho nákupu pre e-mail a jedinečný identifikátor pokusu. Opakované POST požiadavky s rovnakým pokusom vracajú pôvodnú reláciu a používajú rovnaký Stripe idempotency key. Iný kľúč nevytvorí druhú nevyriešenú platbu. Nový samostatný nákup po zaplatení vyžaduje výslovnú akciu. Stavové API overuje Stripe samostatne od webhooku a e-mailu, ale nevytvára účty ani oprávnenia. Webhook odovzdá posielanie správ do `context.waitUntil`.

## Druhá hra pre ďalšiu rodinu

K základnej hre možno výslovne pridať druhú hru za **9,99 €**. Bez kníh je súčet 24,98 €; s balíkom kníh 29,97 €. Atlas je voliteľný a zdarma. Samostatná kniha nemá ponuku druhej hry. Používa sa iba e-mail kupujúceho, bez mena a ďalšieho formulára pre príjemcu.

Migrácia `0007_additional_game.sql` ukladá výber a presnú cenu druhej hry do existujúceho `checkout_attempts`. Tabuľka `checkout_orders` prepája jednu Stripe reláciu s hlavnou a prípadnou druhou objednávkou a doplní väzby aj k starším objednávkam. Štruktúra pôvodných objednávok a prihlasovacie údaje sa nemenia.

Po overení Stripe relácie vzniknú obe objednávky, účty, heslá, oprávnenia a šifrované doručovacie záznamy v jednom atómovom D1 batchi. Hlavná objednávka obsahuje vlastný výber; druhá iba `episode-1` za 9,99 €. Celkové sumy oboch sa musia rovnať overenej platbe. Opakované udalosti nevytvoria ďalšiu dvojicu; zlyhanie batchu neuloží polovicu nákupu. Existujúca otvorená relácia bez druhej hry sa spracuje rovnako ako pred zmenou.

Oba e-maily idú kupujúcemu z `Piko@pixelkovia.rodulab.com`. Druhý má vlastný predmet „Vaša druhá hra Pixelkovia – na preposlanie“ a obsahuje iba heslo druhého účtu. Každý sa doručuje a opakuje nezávisle; checkout hlási doručenie až po odoslaní oboch. Úplný refund pôvodnej platby zneplatní obe objednávky. `free` vynuluje aj druhú hru a po dokončení overenej nulovej relácie vytvorí dva oddelené prístupy.

`admin/tests/additional-game.test.mjs` overuje ceny, oddelenie účtov a kníh, dva odlišné e-maily, opakovanie iba neúspešného doručenia, odstránenie šifrovaných správ po úspechu, atómový rollback, podpísané webhooky, idempotenciu, refund pred aj po dokončení a nulovú dvojicu s voucherom. Používa izolovanú databázu a nahradených poskytovateľov; neposiela živé e-maily ani platby.

Podpísané udalosti `checkout.session.completed` a `checkout.session.async_payment_succeeded` spúšťajú vytvorenie prístupu len po overení `payment_status=paid`, režimu, sumy, meny a väzby na serverovú objednávku. Opakovaná udalosť nevytvorí ďalší účet. Úplný refund zneplatní zaplatený stav objednávky. Návratová URL sama prístup neudelí.

Každý nákup má vlastné zákaznícke ID, zakúpené produkty a náhodné heslo, aj pri rovnakom e-maile. E-mail z **Piko@pixelkovia.rodulab.com** obsahuje iba krátke poďakovanie, odkaz na `/Supervisor`, prihlasovací e-mail a heslo pre daný nákup. Fronta je šifrovaná, úspešné odoslanie vymaže šifrovaný obsah a neúspešné odoslanie sa opakuje.

Prístupové správy majú meno a podpis „Piko · Pixelkovia“. Odpovede smerujú na `miky@pixelkovia.rodulab.com`; vrátenie peňazí na `guardy@pixelkovia.rodulab.com`. Existujúca doména Resend prijíma poštu cez MX v `funnel/cloudflare.json`, vedľa proxovaného (flattened) Pages CNAME. Koreňová pošta domény a iné aplikácie sa nemenia.

`node scripts/configure-support.mjs` používa existujúce `RESEND_API_KEY`, Cloudflare token a súkromnú cieľovú adresu `SUPPORT_FORWARD_TO`. Cieľ aj `RESEND_WEBHOOK_SECRET` uloží do Cloudflare a Codespaces secrets. Verejný katalóg cieľovú adresu neobsahuje. Webhook `/api/support/webhook` overuje pôvodné bajty a Svix HMAC podpis s toleranciou päť minút. Správu načíta z Resend a prepošle iba pre obe určené adresy; `Reply-To` obsahuje pôvodného zákazníka. Predmety sú `CHARGEBACK - Pixelkovia - <časť odosielateľa pred @>` a `QUESTION - Pixelkovia - <časť odosielateľa pred @>`. Pôvodný predmet je v tele správy. D1 uchováva iba doručovacie ID a čas, nie obsah ani súkromný cieľ. Opakovanie používa rovnaký idempotency key a úspešné ID bráni opätovnému odoslaniu. Chyby vracajú neúspešný stav pre opakovanie cez Resend.

Prílohy do 15 MiB spolu sa prenesú vrátane vložených obrázkov. Pri väčších prílohách alebo neúplnom zozname príloh príde telo správy a upozornenie s odkazom na pôvodnú správu v súkromnej schránke Resend. Obsah zostáva v pôvodnej správe aj pri zlyhaní preposlania.

Pod tlačidlom kúpiť je odkaz „Mám zľavový kód“, ktorý otvorí dialóg. Schválený voucher `free` (bez ohľadu na veľkosť písmen a okolité medzery) zníži celú vybranú objednávku na 0 €. Platí pre hru, balík aj samostatné knihy. Neznámy kód server odmietne. Voucher sa neukladá do URL ani lokálneho úložiska.

Server zapíše `voucher_code=free` a nulovú cenu do `checkout_attempts` a vytvorí nulové Stripe položky. Podľa [dokumentácie Stripe pre nulové objednávky](https://docs.stripe.com/payments/checkout/no-cost-orders?ui=checkout-form) formulár pri celkovej sume 0 nevyžaduje kartu. Prístup sa vytvorí až z podpísanej udalosti `checkout.session.completed` po načítaní relácie cez Stripe API: `status=complete`, `payment_status=no_payment_required`, suma 0, správna mena, režim účtu, väzba na serverový pokus a potvrdený voucher v metadata. Nulová relácia nemá PaymentIntent. Opakovaná udalosť nevytvorí ďalšiu objednávku; opakovaný samostatný nákup má vlastné heslo a šifrovaný doručovací záznam.

Starý adaptér Payment Links a ručné doručovanie sa nepoužívajú. Voucher neobchádza kontrolu pripravenosti Stripe ani e-mailového odosielateľa.

## Kupón na nákup za 1 €

Kód `1e` nerozlišuje veľké písmená ani okolité medzery a nastavuje celý nákup na presne **1 €**, vrátane kníh a prípadnej druhej hry. V súhrne sa zobrazuje aktuálna zľava a „nákup za 1 €“. Pole pre kód je spoločné s existujúcim `free`; uplatnenie jedného nahradí druhý.

Server rozdelí 100 centov pomerne medzi hlavnú a druhú objednávku a následne medzi platené položky. Zaokrúhlenie metódou najväčších zvyškov zachová celé centy a presný súčet; Atlas zostáva za 0 €. Pri hre s knihami a druhou hrou ide o 67 centov hlavnej objednávky a 33 centov druhej. Každá objednávka má vlastný prístup, heslo a e-mail. Úplný refund zneplatní obe.

Migrácia `0009_one_euro_voucher.sql` pridá `fixed_total_voucher` bez prepisovania existujúcich objednávok či obmedzenia pôvodného `free`. Kód `1e` je uložený v serverovom pokuse aj v metadata Stripe. Prístup vyžaduje podpísanú udalosť a znovu načítanú reláciu Stripe so stavom `complete`, `payment_status=paid`, sumou 100 centov a správnym kódom. `no_payment_required` kupón `1e` nesplní. Existujúce otvorené relácie zachovajú uložené ceny.

## Overenie

`admin/tests/customer-access.test.mjs` kontroluje dva nezávislé nákupy rovnakého e-mailu, idempotenciu, prihlásenie, rozdielne knihy, podpis platobnej udalosti a odstránenie obsahu doručovacej fronty. `tests/customer-journey.test.cjs` overuje skutočný portál, všetkých sedem úloh a hodnotenie v izolovanom Workers/D1 prostredí. Tieto testy nenahrádzajú platbu kartou a doručenie cez živého poskytovateľa.

`node --test tests/email-dns.test.mjs` overuje názvy odosielacích DNS záznamov vrátane ochrany ostatných subdomén.

`node --test tests/commerce-credentials.test.mjs` overuje skryté zadávanie, opakovanie výzvy, rozlíšenie chýb a obnovenie terminálu po zrušení bez vypísania zadanej hodnoty.

`PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-payment.test.cjs` a `tests/checkout-recovery.test.cjs` spúšťajú skutočný klient v Chromium; `QA_BROWSER=webkit` volí WebKit. Testy overujú mobilné šírky 360/390/430 px a desktop 1360 px, ceny, vouchery, e-mail, opakované kliknutie, stratenú odpoveď, chyby HTTP, návrat/späť, polling, oneskorený úspech a e-mail, refund, starý checkout, zakázaný storage, cudzí redirect a bezpečné textové vykreslenie. Používajú náhradné HTTP odpovede, nie vymyslené Stripe SDK.

`npm test --prefix admin` overuje izolované objednávky, súbeh, podpísané webhooky, nulové a eurové vouchery, dve objednávky, heslá, doručovanie, refund, overenie relácie a serverové zámky. `node --test tests/static-assets.test.cjs` kontroluje hranicu verejného a plateného obsahu.

Opt-in `STRIPE_HOSTED_SMOKE=1 PLAYWRIGHT_MODULE=/cesta/k/playwright node --test tests/stripe-hosted-live.test.mjs` používa existujúce environment credentials. Vytvorí a hneď expiruje neúčtované relácie 14,99 €/1 €/0 € v izolovanej lokálnej databáze. Na skutočnej stránke Stripe overí prázdnu/neúplnú/neplatnú kartu, expirovaný dátum a neúplné CVC a pokračovanie po chybe. Browser blokuje odoslanie údajov karty aj potvrdenia; Stripe API po kontrole musí stále ukazovať `payment_intent=null` a `unpaid`. Nič neplatí ani neposiela e-mail. Možno použiť `QA_BROWSER=webkit`. Platený E2E test, bankové 3-D Secure a natívny Apple Pay/Google Pay na fyzických zariadeniach tým nie sú potvrdené.
