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

E-mail je povinný pred vytvorením Checkout Session. Výber aj platba zostávajú na `/checkout`. Pôvodný tmavý formulár sa rozbalí pod súčtom v spoločnom zelenom paneli; farby, rozmery, sumy, tlačidlo a mobilný layout sú obnovené z verzie pred presunom na externú stránku. Chybové hlásenia majú samostatný červený štýl, ktorý nemení bežný vzhľad.

Jeden spoločný klient posiela `uiMode: elements` pre hru, samostatné knihy aj dokúpenie z rodičovského portálu. Server používa `ui_mode: elements`, existujúcu API verziu `2026-08-26.dahlia` a jediný `return_url`. Stripe.js `endive/stripe.js` inicializuje `initCheckoutElementsSdk`. `createPaymentElement` používa pôvodnú tému `night`, polia `condensed`, slovenčinu a predvoľby adresy pre Slovensko. Kartu spracúva výhradne iframe Stripe.

Pred kartovým potvrdením sa volá `actions.validateElements()`. `validation_errors[].message` sa zobrazí pri zachovanom formulári; žiadny pokus o úhradu ešte nevznikne. `actions.confirm({redirect: if_required})` už neposiela `returnUrl`, lebo návratová adresa je určená na serveri. Potvrdené zamietnutie rozlišuje skutočný Checkout formát `error.code: paymentFailed`. Iné chyby a výnimky najskôr overí server v pôvodnej relácii. Tým sú opravené obe preukázané príčiny blokovania.

Apple Pay a Google Pay používajú `createExpressCheckoutElement`; konfigurácia ich povoľuje a dostupnosť riadi Stripe podľa zariadenia. Handler odovzdá pôvodný `expressCheckoutConfirmEvent`. Po výsledku sa vráti pred pollingom; pôvodné prvky sa neničia. Ani pomalé bankové overenie po 20 sekundách nezatvorí či neskryje aktívne prvky a nikdy sa samo neoznačí ako neúspešná platba. `paymentFailed()` sa vyvolá pri potvrdenom zamietnutí, známej integračnej prekážke pred platbou; nie pri výpadku či neznámom výsledku.

Používaný `StripeCheckoutExpressCheckoutElement` nemá udalosti `click` a `availablepaymentmethodschange`; klient ich neregistruje a `confirm` neviaže na lokálne domnelé otvorenie. Platné potvrdenie môže prísť aj po zatvorení hárku. `cancel` počas neukončeného `confirm` iba overí výsledok; automaticky neexpiruje autorizovanú platbu. Po 20 sekundách potvrdenia sa pri bezpečnom nezaplatenom stave ponúkne výslovná obnova. Až potom server expiruje reláciu, znovu overí jej stav a obnoví rovnaký košík v novom inline formulári. Spracovanie, bankové overenie a potvrdená úhrada zakazujú náhradu. Obnova používa `retryPayment: true`; na rozdiel od vedomého ďalšieho nákupu nesmie pokračovať cez už zaplatený pokus. Neskoré callbacky vyradeného SDK nový formulár neovládajú. Návrat z aplikácie nemení už vložený checkout.

Dokončený starší nákup neblokuje nový nákup s rovnakým e-mailom. Nové kliknutie na nákup vytvorí nový identifikátor pokusu a vlastné prístupy bez ďalšej potvrdzovacej obrazovky. Opakovanie toho istého kľúča zostáva idempotentné; rozbehnuté alebo neisté spracovanie platby naďalej blokuje druhú platbu. Zaplatený lokálny pokus sa po serverovom potvrdení odstráni. Nová návšteva funnelu či dokúpenie knihy preto nezobrazí starý výsledok ako aktuálny košík. Návratová URL zostáva viazaná na vlastnú objednávku aj pri druhej záložke.

Stavové API znovu načíta Stripe, overí sumu, EUR, účet, voucher a väzbu na pokus; samotná URL ani lokálne úložisko neudeľujú prístup. Stratená odpoveď pri vytváraní sa opakuje s rovnakým obsahom a Stripe idempotency key. Ak po 30 minútach chýba uložené Stripe ID, bezpečné uzavretie najskôr dohľadá pôvodnú reláciu u poskytovateľa. Výpadok zámok neuvoľní. Zmena objednávky najprv bezpečne expiruje pôvodnú reláciu; `processing`, `requires_action` a neistý výsledok sa nesmú obísť novým pokusom.

Serverové vetvy `hosted`/`form` ostávajú iba pre presné opakovanie už začatých starších požiadaviek. Nový klient obnoví vlastný nezaplatený starší pokus, serverovo ho bezpečne uzavrie a potom otvorí inline formulár. Na novom checkoute sa na externú platobnú stránku nepresmerúva. Globálne nastavenia Stripe, dynamické platobné metódy s existujúcimi výnimkami, skrytý Link a vypnutá konverzia meny sa nemenia.

Ponuka používa jeden výber oboch kníh: hra 14,99 € a knihy spolu 4,99 € namiesto 9,98 € (položky 2,49 € a 2,50 €), spolu 19,98 €. Server odosiela rovnaký rozpis do Stripe a uloží presné jednotkové ceny pri vytvorení relácie. Dokončenie ich prenesie do položiek objednávky. Zľava 4,99 € sa medzi knihy rozdelí na celé centy. Už otvorené relácie zachovajú uložené jednotkové ceny aj pôvodnú celkovú sumu.

Migrácia `0010_checkout_requests.sql` pridáva atómový zámok aktívneho nákupu pre e-mail a jedinečný identifikátor pokusu. Opakované POST požiadavky s rovnakým pokusom vracajú pôvodnú reláciu a používajú rovnaký Stripe idempotency key. Pri novom kľúči z iného zariadenia sa pôvodný bezpečne uzatvoriteľný nezaplatený formulár najprv expiruje cez Stripe a expirácia sa znovu overí. Až potom vznikne náhrada; druhý prehliadač nedostane pôvodný client secret. Rozbehnuté spracovanie a bankové overenie sa neuzatvoria. Ak počas expirácie vyhrá potvrdenie úhrady, náhrada nevznikne. Súbežné náhrady nesmú ponechať dve otvorené platiteľné relácie; blokovanie dostane konkrétny dôvod a záznam v managemente. Nové kliknutie na nákup po overenej úhrade vytvorí nezávislý nákup bez ďalšej potvrdzovacej obrazovky. Stavové API overuje Stripe samostatne od webhooku a e-mailu, ale nevytvára účty ani oprávnenia. Webhook odovzdá posielanie správ do `context.waitUntil`.

## Spôsob úhrady v managemente

V `/admin#payments` má prehľad nákupov stĺpec **Spôsob úhrady**: Google Pay, Apple Pay, Karta, Iná peňaženka, Zdarma alebo Neznáme. Údaj pochádza z overenej Stripe Session s rozbaleným `payment_intent.latest_charge.payment_method_details.card.wallet.type`; zoznam povolených metód ani hlásenie prehliadača neurčujú skutočnú úhradu. Stripe opisuje peňaženku v [údajoch konkrétnej úhrady](https://github.com/stripe/stripe-python/blob/master/stripe/_charge.py).

Migrácia `0012_payment_methods.sql` uchováva iba pevné označenie metódy, väzbu na nákup a čas overenia. Neuchováva číslo karty, posledné číslice, odtlačok ani token peňaženky. Chýbajúce údaje nikdy neprepíšu už overenú metódu. Refund a premazanie 90-dňovej diagnostiky označenie zachovajú. Existujúca serverová kontrola postupne dopĺňa chýbajúcu metódu pri dokončených nákupoch z posledných siedmich dní. Staršie či nedostatočné údaje sa neodhadujú.

V záznamoch priebehu zostáva oddelený pokus hlásený prehliadačom od úhrady overenej cez Stripe; neúspešný pokus cez peňaženku nesmie označiť neskoršiu platbu kartou. Získanie metódy je súčasťou diagnostiky a zlyhanie jej uloženia neblokuje nákup ani vytvorenie prístupu.

## Platobné pokusy v managemente

`/admin#payments` číta existujúce `checkout_attempts`, vrátane záznamov pred vytvorením Stripe Session. E-mail sa znova neukladá do diagnostiky; sprístupňuje sa iba cez existujúce autorizované administrátorské API s `Cache-Control: no-store`. Verejný checkout, produkty, ceny a vytváranie prístupov zostávajú pôvodné.

Stavy: **Začatá**, **Opustená**, **Zrušená zákazníkom**, **Chyba platby**, **Úspešná**. **Odmietnutá bankou** je samostatný stav, aby sa bankové odmietnutie nevydávalo za technické zlyhanie. Ak Stripe potvrdí zlyhanie, ale neoznámi rozpoznanú príčinu, stav je **Neznáme** a dôvod zachová túto neistotu. Neúplné údaje, časový limit či chyba doručenia e-mailu samy osebe nemenia výsledok platby na technickú chybu.

Úspech vyžaduje podpísaný `checkout.session.completed` alebo `checkout.session.async_payment_succeeded` a nové serverové overenie relácie. Samotné načítanie zaplatenej relácie cez stavové API ponechá pokus začatý s poznámkou o čakaní na webhook. Schválený `free` voucher vyžaduje pôvodné overenie dokončenej nulovej relácie. Historické vytvorené objednávky zachová migrácia ako už serverovo potvrdené. Následný refund sa zobrazuje pri úspešnom pokuse osobitne.

Zrušenie vyžaduje overený PaymentIntent so `status=canceled` a `cancellation_reason=requested_by_customer`. `cancel` z prehliadača, návratová URL, `abandoned`, `automatic` ani expirácia nepotvrdzujú zákaznícke zrušenie. Stripe Checkout tento explicitný dôvod nemusí pri zatvorení peňaženky poskytnúť; preto môže počet zrušených pokusov zostať nulový. Štandardná Stripe relácia trvá 30 minút. Opustenie existujúcej relácie vyžaduje overenú expiráciu; bez vytvorenej relácie platí rovnaký časový limit. Potvrdená technická chyba má pred opustením prednosť.

Migrácia `0013_payment_attempt_outcomes.sql` pridáva jeden trvalý súhrn k existujúcemu ID pokusu a preberá známe historické chyby z bezpečného denníka. Uchováva iba časy, pevné typy, povolené chybové kódy a označenie metódy. Diagnostika sa naďalej maže po 90 dňoch; zmazanie nemení výsledok pokusu. Metóda úspešnej platby má prednosť pred metódou neúspešného pokusu a hlásením prehliadača. Chýbajúce údaje sú „Neznáme“.

Existujúci Stripe endpoint musí okrem pôvodných udalostí odoberať `checkout.session.expired` a `payment_intent.canceled`; URL ani podpisový secret sa nemenia. Zápis výsledku neúspešného webhooku predchádza jeho potvrdeniu v `payment_events`. Pri dočasnom výpadku sa webhook zopakuje s rovnakými identifikátormi, bez duplicitných nákupov. Staršie či oneskorené zlyhanie nezvráti webhookom potvrdený úspech.

Overená dokončená relácia s voucherom `free` môže mať od Stripe `payment_status=paid` aj `no_payment_required` a nemusí mať PaymentIntent. Obe možnosti vyžadujú podpísaný webhook, nulovú sumu, správnu menu, účet a väzbu na serverový pokus s rovnakým schváleným voucherom. V prehľade sa po úspešnom spracovaní zobrazí **Úspešná · zdarma** a zahrnie sa medzi úspešné pokusy.

Menu **Stĺpce** umožňuje pridať voucher (`free`, `1e` alebo nepoužitý), cenu pred zľavami, zľavu na balík, zľavu voucherom, stav a počet objednávok, prístupové e-maily, časy vytvorenia a odoslania, overený stav Stripe a potvrdenie webhookom. ID pokusu a Stripe relácia sú predvolene skryté. Vyhľadávanie stĺpcov neukladá zákaznícke údaje. Nové voliteľné polia zostávajú skryté aj pri načítaní staršieho uloženého rozloženia.

Migrácia `0014_checkout_price_snapshot.sql` uchováva presný cenový rozpis nových pokusov v čase začatia. Historické ceny a zľavy, ktoré neboli uložené, zostávajú „Neznáme“; nepočítajú sa z aktuálneho katalógu. Stav e-mailu znamená odovzdanie poskytovateľovi, nie potvrdené prijatie v schránke. Dve darčekové objednávky sa pri agregácii počítajú presne raz každá.

Filtre podporujú stav, obdobie 1/7/30 dní aj celé obdobie. Predvolené obdobie je posledných 30 dní. Obdobie, filtre, stĺpce, poradie, šírky, hustota, navigácia a rozbalenie monitoringu či denníka sa pamätajú jeden rok v bezpečnej cookie obmedzenej na `/admin`; existujúce nastavenia z localStorage sa prenesú. Cookie neobsahuje zákaznícke údaje ani ID pokusov. Pri blokovaných cookies zostáva uloženie nastavení v localStorage. Celú hlavičku stĺpca možno potiahnuť pred alebo za iný stĺpec; miesto vloženia označuje zvislá čiara. Pravý okraj hlavičky mení šírku samostatne bez zmeny šírky susedných stĺpcov. Úchyt podporuje šípky, Shift + šípky, Home/End a zrušenie rozbehnutého ťahania cez Escape. Obnovenie predvoleného rozloženia zruší aj vlastné šírky. Produkty používajú krátke štítky Base, Vznik, Záblesk, Atlas a +1 hra; tooltipy a detail obsahujú celé názvy. Súhrny sa počítajú zo všetkých pokusov v období, tabuľka filtruje stav a najprv zobrazí 40 najnovších riadkov. Ďalšie pripája po 40 cez tlačidlo; kurzor podľa času a ID zabraňuje duplicitám pri príchode nových pokusov. Obnova zachová načítaný rozsah, otvorené detaily a nastavenia stĺpcov. Farebné dlaždice zobrazujú počet a podiel a zároveň filtrujú stav. Darčekové dve objednávky zostávajú jedným platobným pokusom. Požiadavku, ktorá vôbec nedorazila na server, nemožno spätne spoľahlivo evidovať.

`admin/tests/payment-monitor.test.mjs` testuje všetky stavy, bankové/technické/neznáme zlyhania, podpisy, duplicity, oneskorené udalosti, obnovu po výpadku databázy, migráciu a stránkovanie. `tests/payment-admin.test.cjs` kontroluje skutočné administrátorské UI vrátane filtrov, e-mailov, výrazného červeného stavu, escapovania HTML, desktopu a šírky 390 px.

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

Server zapíše `voucher_code=free` a nulovú cenu do `checkout_attempts` a vytvorí nulové Stripe položky. Podľa [dokumentácie Stripe pre nulové objednávky](https://docs.stripe.com/payments/checkout/no-cost-orders?ui=checkout-form) formulár pri celkovej sume 0 nevyžaduje kartu. Prístup sa vytvorí až z podpísanej udalosti `checkout.session.completed` po načítaní relácie cez Stripe API: `status=complete`, `payment_status=paid` alebo `no_payment_required`, suma 0, správna mena, režim účtu, väzba na serverový pokus a potvrdený voucher v metadata. Nulová relácia nemá PaymentIntent. Opakovaná udalosť nevytvorí ďalšiu objednávku; opakovaný samostatný nákup má vlastné heslo a šifrovaný doručovací záznam.

Starý adaptér Payment Links a ručné doručovanie sa nepoužívajú. Voucher neobchádza kontrolu pripravenosti Stripe ani e-mailového odosielateľa.

## Kupón na nákup za 1 €

Kód `1e` nerozlišuje veľké písmená ani okolité medzery a nastavuje celý nákup na presne **1 €**, vrátane kníh a prípadnej druhej hry. V súhrne sa zobrazuje aktuálna zľava a „nákup za 1 €“. Pole pre kód je spoločné s existujúcim `free`; uplatnenie jedného nahradí druhý.

Server rozdelí 100 centov pomerne medzi hlavnú a druhú objednávku a následne medzi platené položky. Zaokrúhlenie metódou najväčších zvyškov zachová celé centy a presný súčet; Atlas zostáva za 0 €. Pri hre s knihami a druhou hrou ide o 67 centov hlavnej objednávky a 33 centov druhej. Každá objednávka má vlastný prístup, heslo a e-mail. Úplný refund zneplatní obe.

Migrácia `0009_one_euro_voucher.sql` pridá `fixed_total_voucher` bez prepisovania existujúcich objednávok či obmedzenia pôvodného `free`. Kód `1e` je uložený v serverovom pokuse aj v metadata Stripe. Prístup vyžaduje podpísanú udalosť a znovu načítanú reláciu Stripe so stavom `complete`, `payment_status=paid`, sumou 100 centov a správnym kódom. `no_payment_required` kupón `1e` nesplní. Existujúce otvorené relácie zachovajú uložené ceny.

## Overenie

`admin/tests/customer-access.test.mjs` kontroluje dva nezávislé nákupy rovnakého e-mailu, idempotenciu, prihlásenie, rozdielne knihy, podpis platobnej udalosti a odstránenie obsahu doručovacej fronty. `tests/customer-journey.test.cjs` overuje skutočný portál, všetkých sedem úloh a hodnotenie v izolovanom Workers/D1 prostredí. Tieto testy nenahrádzajú platbu kartou a doručenie cez živého poskytovateľa.

`node --test tests/email-dns.test.mjs` overuje názvy odosielacích DNS záznamov vrátane ochrany ostatných subdomén.

`node --test tests/commerce-credentials.test.mjs` overuje skryté zadávanie, opakovanie výzvy, rozlíšenie chýb a obnovenie terminálu po zrušení bez vypísania zadanej hodnoty.

`PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-payment.test.cjs` a `tests/checkout-recovery.test.cjs` spúšťajú skutočný klient v Chromium; `QA_BROWSER=webkit` volí WebKit. Kontrolujú pôvodný inline layout pri 360/390/430/1360 px, ceny, knihy, darček, vouchery, e-mail, presný kontrakt `validateElements`/`confirm`, návrat bez duplicitného `returnUrl`, neúplné údaje, zamietnutie, neznámy výsledok, sieťové chyby, opakovanie, pomalé natívne potvrdenie, zachovanie elementov, nedostupnú peňaženku, refresh a staré lokálne pokusy. Testujú aj prirodzený ďalší nákup a dokúpenie knihy po nákupe hry. SDK je v tejto vrstve nahradené podľa aktuálneho oficiálneho kontraktu.

`PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-device-recovery.test.cjs` prepája skutočný klient, Worker a izolovanú D1 z dvoch prehliadačových kontextov. Overuje obnovu 1 € hry aj oboch kníh na telefóne po otvorení na desktope, uzavretie pôvodného formulára, čakajúcu banku a potvrdenie počas uzatvárania. `QA_BROWSER=webkit` volí WebKit.

`PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-wallet-recovery.test.cjs` overuje zatvorenie s neukončeným potvrdením a následnú kartu v hre aj oboch knihách pre Google Pay/Apple Pay. Skutočný klient, Worker a databáza riešia súbeh úhrady, čakajúcu banku, stratené odpovede, výpadok, oneskorené a chýbajúce callbacky. `QA_BROWSER=webkit` volí WebKit. Testovacia náhrada používa iba udalosti podporované Checkout Elements SDK a odmietne napríklad `click`. Overuje `confirm` bez predchádzajúceho klikacieho callbacku aj zatvorenie po autorizácii. Natívny hárok a banková preprava sú v tejto vrstve nahradené; výsledok nenahrádza fyzický test.

`npm test --prefix admin` overuje izolované objednávky, súbeh, idempotenciu, podpísané webhooky, nulové a eurové vouchery, dve atómové objednávky, heslá, doručovanie, refund, overenie relácie, serverové zámky a ďalší nákup s rovnakým e-mailom bez extra príznaku. `node --test tests/static-assets.test.cjs` kontroluje hranicu verejného a plateného obsahu.

Opt-in `STRIPE_INLINE_SMOKE=1 PLAYWRIGHT_MODULE=/cesta/k/playwright node --test tests/stripe-inline-live.test.mjs` používa existujúce credentials. V izolovanej lokálnej databáze overí reálne Stripe relácie 14,99 €/1 €/0 € a skutočné iframe polia na našej stránke. Skontroluje neúplnú/neplatnú kartu, dátum a CVC aj opraviteľnosť po chybe; prázdne `confirm` preukáže odstránenie pôvodného konfliktu návratovej adresy. Navyše vyplní kompletné verejné testovacie údaje Stripe a overí, že potvrdenie dôjde až na zámerne blokovanú sieťovú hranicu bez `IntegrationError` pre nedodané billing údaje. Payment Element používa predvolený zber potrebných údajov Stripe, bez núteného `phone: never`, ktoré bránilo potvrdeniu. Všetky sieťové požiadavky na údaje karty a potvrdenie sú blokované, API musí ukazovať `payment_intent=null`, `unpaid`. Relácie sa expirujú, nič sa neplatí a e-maily sa neposielajú. Overenie bankovej úhrady, 3-D Secure a natívnych peňaženiek na fyzických zariadeniach zostáva samostatné.
