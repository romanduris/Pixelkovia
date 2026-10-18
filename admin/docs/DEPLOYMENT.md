# Cloudflare nasadenie TreasureQuest

Používateľ 18. 10. 2026 schválil samostatné zdroje v nižšie uvedenom účte a zvolil **prihlásenie iba heslom bez e-mailu a Access**. Po vytvorení databáz výslovne potvrdil obe presné UUID a migrácie. Pôvodný všeobecný súhlas nenahrádzal toto druhé potvrdenie.

## Overený účet a existujúce zdroje

Účet: `Roman.duris@gmail.com's Account`, Account ID `033ec39e1948bd5785d92d1993a8036f`.

| Typ | Existujúci názov / identifikátor | Overené väzby a stav |
| --- | --- | --- |
| Worker | `flightscanner-contact` (script ID je názov) | Email binding `EMAIL`, Analytics Engine binding `ENGAGEMENT`, Turnstile a kontaktné konfiguračné položky; hodnoty secrets sa nečítali |
| Worker | `livingstones-api` (script ID je názov) | Binding `DB` → existujúca databáza `livingstones-db`; tiež `EMAIL` |
| D1 | `livingstones-db` / `abc06c1b-e845-434a-b105-0b17b7f82908` | Používa `livingstones-api`; nikdy nebude bindingom TreasureQuest |
| Pages | žiadne projekty | Úspešne prečítaný prázdny zoznam |
| KV | žiadne priestory | Úspešne prečítaný prázdny zoznam |
| R2 | služba nie je aktivovaná podľa API | Žiadne buckets sa nevytvárali; pre túto etapu sa nevyžaduje |
| Access | služba nie je aktivovaná podľa API | Žiadna aplikácia ani politika sa nevytvárala |
| Doména | `rodulab.com` / zone ID `e21f155e1a6e43b9a57bd7a093f1ee42` | Aktívna, bez zmien DNS |
| Workers subdoména účtu | `livingstones-romanduris.workers.dev` | Overený existujúci namespace; iba návrh nového hosta pod týmto účtom |

Zoznam vlastných Workers domén je prázdny. Čítanie Workers routes pre `rodulab.com` vrátilo 403, preto ich väzby nie sú potvrdené a nebudú sa nastavovať ani meniť.

Detailná inventúra vrátane názvov bindings je lokálne v ignorovanom `cloudflare-inventory.local.json`. Účel aplikácií nie je overovaný z ich kódu ani z obsahu DB; názvy nie sú dôvod na žiadne úpravy. Existujúce Workery, DB, e-mailové bindings, secrets a doména zostávajú bez zásahu.

## Oddelené zdroje a schválené databázy

| Prostredie | Worker: admin + API | Databáza | Presné D1 UUID |
| --- | --- | --- | --- |
| Produkcia | `treasurequest-admin` | `treasurequest-db` | `a92475ad-b1e6-4a92-90dd-76e9b8e95b7a` |
| Preview | `treasurequest-admin-preview` | `treasurequest-db-preview` | `992a2f73-b515-456a-97a6-d277eadd27c8` |

Každý Worker má binding `TQ_DB` výhradne na svoju TreasureQuest databázu. Oba názvy boli pred vytvorením znovu overené ako voľné. Lokálny `treasurequest-local` ostáva v SQLite simulátore. Nevznikajú R2/KV, nové domény ani tretí API Worker.

Produkcia: https://treasurequest-admin.livingstones-romanduris.workers.dev

Preview: https://treasurequest-admin-preview.livingstones-romanduris.workers.dev

API používa rovnaký host pod `/api/admin/`. Budúce `/api/customer/` ostáva vypnuté bez privátneho identity service bindingu. Verejná hra a rodičovský portál neodosielajú produkčné udalosti. Produkcia ani preview neobsahujú demo zákazníkov.

## Vykonané a overované poradie

1. GET inventúra potvrdila účet, pôvodné dva Workery a pôvodnú DB. Používateľ schválil nové zdroje a heslovú ochranu.
2. D1 API vytvorilo iba dve nové databázy uvedené vyššie. Používateľ následne potvrdil mená a obe UUID.
3. Wrangler aplikoval migrácie `0001_initial.sql`, `0002_product_catalog.sql`, `0003_admin_password_sessions.sql` výlučne na tieto UUID. Bez demo seedu, zákazníkov alebo objednávok.
4. Ignorované konfigurácie `wrangler.production.jsonc` a `wrangler.preview.jsonc` obsahujú overený účet a D1 UUID. `ENVIRONMENT=production` alebo `preview`, `DEMO_MODE=false`, `ADMIN_AUTH_MODE=password`. Zdrojový príklad má zástupné UUID.
5. Prvý upload Workera má vypnuté `workers_dev` a preview URL. Potom sa cez chránený dočasný súbor nahrajú iba secrets `ADMIN_PASSWORD_RECORD`, `ADMIN_PASSWORD_PEPPER`; pôvodné heslo sa neposiela na Cloudflare. Pred zapnutím hosta sa cez API overia mená secrets a správny D1 binding.
6. Až s pripravenou serverovou ochranou sa zapne schválená `workers.dev` adresa. Náhodné version preview URL zostávajú vypnuté. Konfigurácia si po zapnutí uloží `workers_dev=true` pre ďalšie schválené nasadenia.
7. Verejné kontroly musia potvrdiť: dashboard a jeho JS/CSS bez cookie presmerujú na login, všetky dátové admin API vrátia 401, podvrhnutá e-mailová hlavička nestačí. Verejné sú iba login assety. Nesprávny Origin pri POST vráti 403. Prihlásenie overí heslo serverovo; odhlásenie zneplatní reláciu aj pri opakovanom použití cookie.
8. Prihlásený prehliadač overí prázdny dashboard, zákazníkov, objednávky, analytiku, e-mailové koncepty a interné odkazy. Bez produkčných platieb či e-mailov.
9. Až po úspešnom chránenom spustení sa nastaví `SITE_CONFIG.management.url`; odkaz používa iba interný storyboard. Zdrojové súbory sa pushnú do GitHub `main`, existujúca Site sa publikuje s nezmeneným publikom a ID.
10. Záverečná GET inventúra porovná pôvodné Worker modification timestamps, bindings, pôvodnú DB a doménu. Nasadené Worker verzie a výsledky kontrol sú uvedené v závere tejto stránky.

## Heslo a budúce aktualizácie

Na prihlásenie stačí používateľom uložené heslo. Platí 8-hodinová maximálna a 30-minútová neaktívna relácia, serverové odhlásenie, ochrana Origin a limity pokusov. Podrobnosti sú v [README](../README.md#zabezpečenie).

Token je mimo repozitára: `CLOUDFLARE_API_TOKEN` alebo chránený dočasný súbor `/tmp/treasurequest-cloudflare-token`. Potrebuje **Workers Scripts Edit/Write** a **D1 Edit/Write** len pre tento účet; Account Settings Read stačí na inventúru. Ostatné oprávnenia nemusia mať zápis. Access sa v schválenom heslovom režime nepoužíva.

Príkaz `node admin/scripts/prepare-admin-password.mjs` číta `/tmp/treasurequest-admin-password` s právami 600 a pripraví `/tmp/treasurequest-admin-secrets.json` s právami 600. Hodnoty sa nevypisujú. Zmena hesla vyžaduje vytvorenie nového záznamu a nahratie **oboch** secrets na príslušný nový Worker. Zmena verzie záznamu zneplatní staré relácie; počas výmeny musí ochrana pri nezhode odmietnuť prístup. Po dokončení sa dočasný pôvodný password aj JSON so secrets odstránia.

Pred každou ďalšou migráciou porovnať názov aj UUID so schváleným prostredím, nikdy nekopírovať ID `livingstones-db`. Nové produkčné databázy a zmeny DNS vyžadujú osobitný súhlas. Zápisové oprávnenie tokenu je účtové, preto každý deployment musí overiť povolený zoznam dvoch TreasureQuest Worker názvov.

Obnova existujúcej lokálnej konfigurácie: skopírovať `wrangler.production.example.jsonc` do ignorovaného súboru, vložiť overený Account ID a správne nové D1 UUID, skontrolovať produkčné/preview vars a binding, potom dry-run a schválený deploy cez Wrangler. Dočasne vypnutý verejný hostname zapnúť až po kontrole ochrany. Žiadne secrets v Git ani v shell argumentoch.

## Náklady a limity

Platené predplatné ani zmena tarify sa nezapínajú. Uplatňujú sa existujúce kvóty účtu, ktoré zdieľajú aj pôvodné projekty. Aktuálne podmienky: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/). Nasadenie negarantuje neobmedzené využitie.

Agregačné prehľady načítavajú filtrovanú kohortu a počítajú medián na serveri. Pri veľkých objemoch treba SQL agregácie alebo inkrementálne súhrny a preverenie limitov. Globálny limit prihlasovania môže pri útoku dočasne zablokovať aj správcu; chráni náročné overovanie hesla pred neobmedzenými pokusmi.

## Čo ešte nie je zapojené

- Zákaznícka identita, Magic Link, bezpečný transfer telefónu.
- Platobný webhook a reálne objednávky.
- Napojenie statickej hry na serverové oprávnenia a udalosti.
- Súkromné produkčné doručovanie existujúcich herných PDF/JS.
- E-mailový poskytovateľ, odhlasovanie a personalizované diplomy.
- Schválený limit nedokončenej hry.

Tieto body sa nesimulujú vo verejnom webe. Fiktívne udalosti ostávajú iba v lokálnej demo DB.

## Výsledok nasadenia 18. 10. 2026

Oba hosty sú nasadené a overené. Aktívne verzie pri odovzdaní:

| Worker | Verzia (100 % prevádzky) | Deployment ID |
| --- | --- | --- |
| `treasurequest-admin` | `db770201-7e90-4836-a514-1be9ab6f456c` | `00b866ee-1556-4bca-abdc-b6a7bf65202a` |
| `treasurequest-admin-preview` | `65cf436b-f238-4daf-80d2-04c23ec3680a` | `9ec951bc-5c44-4d61-b3e8-c5f062d5583d` |

- V oboch D1 sú evidované všetky tri migrácie; nulový počet zákazníkov, objednávok a hier. Testovacie prihlásenia sa odhlásili a nezanechali aktívne relácie.
- Všetkých 16 backendových testov prešlo vrátane skutočného `workerd`/D1. Produkčný browser test prešiel loginom, šiestimi sekciami, bezpečnou cookie a odhlásením; rozloženie sa overilo v šírkach 320/390/768/1512.
- Živé HTTP kontroly oboch hostov potvrdili 401 pre anonymné admin API, presmerovanie chránených assetov, funkčné login assety, odmietnutie nesprávneho hesla a cudzieho Origin, zneplatnenie odhlásenej cookie a 501 pre nezapojené zákaznícke API.
- Testy etapy 1 a hernej logistiky prešli po nastavení odkazu zo storyboardu.
- Záverečná inventúra potvrdila pôvodné modification timestamps a bindings `flightscanner-contact` a `livingstones-api`, pôvodné D1 UUID, Pages, KV a domény bez zmien. DNS sa nemenilo.
