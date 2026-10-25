# TreasureQuest Admin – V5 / Etapa 2

Samostatná administrácia a Worker API v existujúcom repozitári Pixelkovia. Frontend je čisté HTML/CSS/JS, Worker používa D1. Na žiadosť používateľa je produkčné prihlásenie iba heslom; voliteľný režim Cloudflare Access zostáva samostatne otestovaný. Verejný web, rodičovský portál a hra zostávajú v koreňových súboroch a v pôvodnej ChatGPT Site. `admin/` sa nekopíruje do `dist/` a nesmie byť publikovaný obyčajným statickým hostingom.

**Stav nasadenia a presné identifikátory:** pozri [DEPLOYMENT.md](docs/DEPLOYMENT.md). Používateľ schválil vytvorenie oddelených zdrojov, prihlásenie iba heslom a následne presné nové D1 UUID pred migráciami.

[Ukážka dashboardu s fiktívnymi dátami](docs/dashboard-preview.png) · [Plán nasadenia a inventúra](docs/DEPLOYMENT.md)

## Lokálne spustenie

Vyžaduje Node.js 24+. Z koreňa repozitára:

```bash
npm ci --prefix admin
npm run migrate:local --prefix admin
npm run dev --prefix admin
```

Admin sa spustí na loopback adrese, iba v lokálnom režime. Bez seeding príkazu je databáza prázdna. Nevznikajú demo zákazníci ako náhrada chýbajúcich produkčných dát.

Voliteľné, iba pre **prázdnu lokálnu databázu**:

```bash
npm run demo:local --prefix admin
npm run dev --prefix admin -- --port 8787 --var DEMO_MODE:true
```

Seed vytvorí 18 fiktívnych rodín s adresami `@example.invalid`: zakúpené/neaktivované, rozpracovaný checklist, úloha 4, dokončené, opakovanie aj exspirované práva. V UI je výrazný banner **LOKÁLNE DEMO**. Seed nemá vzdialenú voľbu, neprijíma token a odmietne neprázdnu DB. Jeho údaje sú iba v ignorovanej `.wrangler/`. Lokálnu administráciu nezverejňujte cez verejný tunel ani všeobecný HTTP server.

## Funkcie

- Desať metrík: unikátni zákazníci, zaplatené objednávky, tržby po menách, zakúpené oprávnenia, neaktivované/aktivované, aktívne/dokončené relácie, priemer a medián trvania.
- Grafy nákupov, prvých aktivácií a dokončení, priechod ôsmimi úlohami; dostupné sú aj tabuľky grafových dát.
- Zákazníci: vyhľadávanie, stavové filtre, bezpečné radenie, DB stránkovanie po 20 položkách. Jeden riadok predstavuje produkt objednávky. Zákazník môže mať viac oprávnení.
- Detail: objednávky a rozšírenia, návštevy portálu, checklist, aktivácie, expirácia, každé samostatné hranie, osem etáp s časmi/pokusmi/chybami/nápovedami a najnovších 200 udalostí.
- Objednávky: najnovších 200 filtrovaných objednávok, bez checkoutu alebo ručnej simulácie platieb v admin UI.
- Analytika úloh: začaté/vyriešené relácie, úspešnosť, priemer/medián elapsed, priemer active, nesprávne odpovede, priemerné nápovedy a posledné nedokončené hrania.
- Osem e-mailových konceptov, história udalostí a príznak vypnutého odosielania. Marketingové koncepty majú zástupný odhlasovací odkaz. Poskytovateľ ani produkčné odosielanie nie sú zapojené.
- Produktové odkazy Pixelkovia v administrácii obsahujú iba Funnel, Customer page a Storyboard; otvárajú sa v novej karte s `internalPreview=1`. Atlas Pixelkov a Tlačové materiály sú dostupné z navigácie storyboardu, tiež v novej karte. Samotné prekliky nevytvárajú aktivácie ani udalosti. Storyboard ponúka návrat na nasadenú chránenú administráciu.
- Frontend má desktopové tabuľky, zákaznícke karty na mobile, ovládanie klávesnicou a zrozumiteľné prázdne/chybové stavy.

## Význam metrík a časov

Všetky dátumy v DB sú Unix epoch **milisekundy v UTC**. UI zobrazuje `Europe/Bratislava`, aj hranice dátumového filtra berú toto pásmo vrátane letného času. Denné body grafov sú výslovne označené ako UTC dni.

Filtre dashboardu, zákazníkov, objednávok a analytiky tvoria **kohortu podľa času vytvorenia nákupu** (`from` vrátane, `to` bez hranice). Graf potom zobrazuje skutočné dni udalostí tejto kohorty; aktivácia môže byť neskôr než dátum nákupu. E-maily a história najnovších udalostí sú globálne a dátumový formulár sa pri nich nezobrazuje.

Zákazník je jedinečné zákaznícke ID. Zakúpené oprávnenie je jedna jednotka položky zaplatenej objednávky. Herná relácia je jedno hranie; opakovanie nikdy neprepisuje prvé hranie. Počet dokončení teda môže byť vyšší než počet zákazníkov. Tržby sa nesčítavajú cez rôzne meny. Pri filtrovaní produktu sa sčítajú jeho zaplatené položky, nie celý obsah zmiešanej objednávky. Refundy sa nepočítajú ako zaplatené objednávky.

Návšteva portálu vzniká iba explicitným volaním `portal-visits`, nie načítaním obrázkov/CSS. Rovnaký klientsky kľúč a menej než 30 minút nečinnosti tvoria jednu návštevu. Po prekročení intervalu vznikne nová. Načítanie checklistu, návšteva a prezeranie materiálov hru neaktivujú.

**Elapsed time:** prvé otvorenie → úspešné vyriešenie vrátane prestávok. **Active time:** približný odhad z heartbeat udalostí pri viditeľnom hraní, maximálne 30 sekúnd na interval. Medzery nad 90 sekúnd sa nezapočítajú; viacdňová prestávka nie je aktívne hranie. Závisí od budúceho klienta a nie je dôkazom sústredenia ani prítomnosti dieťaťa.

Príprava má rovnakých 12 krokov a potvrdenie telefónu ako existujúci portál. ID a znenie sa odvodzujú z `prep-store.js`; serverové herné pravidlá sa odvodzujú z nezmeneného `game-data.js`:

```bash
node admin/scripts/sync-checklist.mjs
node admin/scripts/sync-game.mjs
```

Tieto serverové pravidlá a odpovede nie sú v adresári admin verejných assetov. Pôvodný **statický prototyp hry stále obsahuje svoje pôvodné klientské dáta**. Toto nie je migrácia hry na produkčne súkromné doručovanie; pred skutočným predajom sa musí zapojiť serverové API a ochrana platených HTML/JS/PDF.

## Zabezpečenie

`run_worker_first: true` vedie všetky admin assety aj API cez Worker. Produkcia používa `ADMIN_AUTH_MODE=password`: verejné sú iba prihlasovacie HTML/CSS/JS a login/logout endpointy. Dashboard, jeho assety a všetky dátové admin API vyžadujú serverom overenú reláciu. E-mail ani Cloudflare Access sa v tomto režime nevyžadujú.

Heslo (16–128 znakov) sa číta zo súboru s právami 600 a nikdy sa neposiela do Cloudflare v pôvodnom znení. `node admin/scripts/prepare-admin-password.mjs` vytvorí chránený dočasný JSON pre dva Worker secrets: `ADMIN_PASSWORD_RECORD` a `ADMIN_PASSWORD_PEPPER`. PBKDF2-SHA256 so 100 000 iteráciami používa náhodnú soľ a vstup cez HMAC s oddeleným náhodným serverovým pepperom. Počet iterácií rešpektuje limit nasadeného Workers WebCrypto. Tieto secrets nepatria do Git, konfigurácie ani verejných assetov.

Prihlásenie povoľuje najviac 5 pokusov na IP za 15 minút a 100 globálne; databáza ukladá iba HMAC identifikátor IP. Náhodná 256-bitová cookie `__Host-tq-admin` má `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`. D1 obsahuje iba hash tokenu. Relácia vyprší po 8 hodinách alebo 30 minútach nečinnosti; odhlásenie ju odstráni na serveri a zmena heslových secrets zneplatní staré relácie. POST vyžaduje rovnaký `Origin`; login nepovoľuje CORS.

Voliteľný režim Access ostáva dostupný pri jeho samostatnej konfigurácii: RS256 podpis, issuer tímu, AUD aplikácie, expirácia a povolený e-mail. Hlavička s e-mailom sama nestačí. Chýbajúca konfigurácia nikdy neotvorí administráciu. CSP, `no-store`, `nosniff`, zákaz embedovania a `noindex` chránia assety; SQL používa bind parametre a whitelist radenia.

Jediná lokálna výnimka vyžaduje súčasne `ENVIRONMENT=local` a loopback hostname. Lokálny režim sa na vzdialenom hoste odmietne **pred** assetmi aj API. Produkcia nikdy nepoužíva lokálny admin bypass.

Zákaznícke API je oddelené od admin API a vyžaduje budúci **privátny service binding `CUSTOMER_AUTH`**. Bez neho vracia 501 a neumožní aktiváciu či čítanie údajov. Neakceptuje zákaznícke ID z neoverenej vstupnej hlavičky. Budúci identity Worker musí bezpečne overiť session a vrátiť iba oprávneného zákazníka. Nie je súčasťou tejto etapy.

Aktivácia skontroluje platbu, vlastníctvo oprávnenia a všetkých 13 potvrdení. Vygeneruje náhodný token telefónu, uloží iba SHA-256 digest a token pošle iba ako `__Host-tq-run` cookie (`HttpOnly`, `Secure`, `SameSite=Strict`). DB povoľuje iba jednu aktívnu reláciu na oprávnenie. User-agent ani localStorage nie sú bezpečnostná hranica.

Server overuje postupnosť aj správnosť odpovede; verejný `events` endpoint neprijme klientom vymyslený úspech. Pokusy sa ukladajú bez surových odpovedí. Jedinečné ID udalosti spolu s hashom požiadavky zabezpečujú opakovateľnosť požiadaviek a odmietnutie konfliktov. Batch zápisy sú transakčné.

Prvé úspešné dokončenie nastaví pevnú hranicu `first_completed_at + 24 hodín`. Ďalšie hrania ju nepredlžujú. Limit nedokončenej hry je bez schválenia **nezadaný**; budúca konfigurácia `UNFINISHED_TTL_HOURS` ho môže nastaviť. Bezpečný prenos na nový telefón je explicitný nezapojený integračný bod, nie obchádzka kontrol.

## API a nezapojené integračné body

| Rozhranie | Stav |
| --- | --- |
| `POST /api/admin/login`, `/logout` | Prihlásenie heslom a zrušenie serverovej relácie, kontrola Origin |
| `GET /api/admin/context`, `/products`, `/dashboard`, `/customers`, `/customers/:id`, `/orders`, `/analytics`, `/events`, `/emails` | Implementované; serverová admin autorizácia pri každej požiadavke |
| `GET /api/customer/entitlements` | Implementované za budúcim overením zákazníka |
| `GET/POST /api/customer/checklist` | Načítanie a serverové uloženie bez aktivácie |
| `POST /api/customer/portal-visits` | Používateľské návštevy, nie asset requesty |
| `POST /api/customer/activate`, `/replay` | Vedomá aktivácia; samostatné hranie a token telefónu |
| `GET /api/customer/progress` | Iba správny zákazník a zariadenie |
| `POST /api/customer/events`, `/answer`, `/complete` | Overené herné udalosti a serverové odpovede |
| `POST /api/customer/device-transfer` | 501; vyžaduje budúci bezpečný prenos |
| `CUSTOMER_AUTH` | Nie je pripojený; Magic Link ani zákaznícke účty sa neimplementujú |
| `createOrder()` | Serverová funkcia testovaná pre budúce overené platobné webhooky; nie je verejný platobný endpoint |
| E-mailový poskytovateľ, doručovanie, odhlásenie, personalizované PDF | Koncepty a DB pripravené; nevykonávajú sa |
| Klientské sledovanie na existujúcom webe | Nie je zapnuté; interné náhľady a staré hrania neposielajú falošné udalosti |
| QR odkazy | Model počíta so spoločnými QR a bezpečnou serverovou reláciou; pôvodná maketa Úloha 1 sa nemení |

Prepojenie aktuálnej Site s budúcou zákazníckou cookie vyžaduje samostatne navrhnutý same-origin gateway/doménu. Budúci zákaznícky hostname/gateway musí mať zákaznícke overenie oddelené od ochrany admin hosta. Nepovoľujeme všeobecný CORS ani treťostranné cookies ako skratku.

## Testy

```bash
npm run build:check --prefix admin
npm test --prefix admin
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node admin/tests/browser.test.cjs
```

Backendové testy používajú lokálny SQLite adaptér a samostatný integračný test v skutočnom `workerd`/D1 simulátore Miniflare. Integrácia vyžaduje predchádzajúci `build:check`; nepoužíva Cloudflare účet ani API token. Testuje migrácie, objednávku, checklist, aktiváciu, cookie telefónu, overenie odpovede a duplicitu. Testy overujú aj heslový login/logout, cookies, zneplatnenie relácií, expiráciu, limity pokusov, zmenu hesla a odmietnutie CSRF. Testy overujú tiež prázdny stav, 18 demo rodín, izoláciu zákazníkov, anonymný a podvrhnutý Access, platné aj neplatné RS256 JWT, radenie/SQL injection, stránkovanie, transakčný rollback, elapsed/active čas, opakovanie a pevných 24 hodín.

Browser test vyžaduje bežiaci lokálny demo Worker na 8787. Overuje reálne D1 dáta, vyhľadávanie, stavové aj produktové filtre, detail, grafy/analytiku, mobilné karty a šírky 320/390/768/1512. Pôvodné testy `tests/` zostávajú samostatné a overujú celú hru, portál, PDF, médiá, staré uloženia a navigáciu.

## Inventúra bez zmien

```bash
node admin/scripts/inventory-cloudflare.mjs
node admin/scripts/deployment-plan.mjs
```

Token je v Codespaces secret premennej `PIXELKOVIA_TOKEN`, štandardnej premennej `CLOUDFLARE_API_TOKEN` alebo v chránenom súbore `/tmp/treasurequest-cloudflare-token`; nikdy v argumentoch, zdrojovom kóde alebo Git commitoch. Inventúra podporuje oba názvy premenných. Wrangler používa štandardný názov `CLOUDFLARE_API_TOKEN`; pri nasadzovaní sa hodnota z `PIXELKOVIA_TOKEN` odovzdá procesu v pamäti bez vypisovania. Inventarizačný skript odosiela iba GET, nečíta hodnoty secrets a výsledok ukladá do ignorovaného `admin/docs/cloudflare-inventory.local.json`. Účel existujúcich projektov neháda. Pri viacerých účtoch sa zastaví pred inventúrou a vyžiada konkrétne Account ID. Nasadzovací plán je iba výpis – nenasadzuje ani nemigruje nič.

Heslový browser test je výslovne spúšťaný proti zvolenému hostu; číta heslo iba z chráneného súboru, neprijíma ho v argumentoch a po overení sa odhlási:

```bash
ADMIN_BASE_URL=https://treasurequest-admin.livingstones-romanduris.workers.dev \
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright \
TQ_ADMIN_PASSWORD_FILE=/tmp/treasurequest-admin-password \
node admin/tests/password-browser.test.cjs
```

## Výslovne vyžiadaných 15 FAKE zákazníkov

Používateľ po nasadení výslovne požiadal o 15 fiktívnych zákazníkov v produkčnej TreasureQuest DB: päť iba s nákupom, päť s rozhranou hrou (úlohy 2–6) a päť s dokončenými ôsmimi úlohami. Toto je samostatná výnimka na označené skúšobné dáta; pôvodný 18-členný lokálny demo seed ostáva výhradne lokálny.

Zákazníci majú vymyslené slovenské mená a priezviská, napríklad `FAKE · Jana Kováčová`, `FAKE · Peter Novák` a `FAKE · Tomáš Baláž`. Úplný zoznam je vo fixture `FAKE_NAMES`. Adresy sú `@example.invalid`, objednávky majú FAKE referencie. Každý zákazník má audit `fake_customer_created`; administrácia podľa neho zobrazuje trvalé upozornenie, že prehľady vrátane tržieb zahŕňajú simulované údaje. Neuskutočnia sa platby, odosielanie e-mailov ani zákaznícke prihlásenia.

`node admin/scripts/prepare-fake-customers.mjs` vygeneruje fixture iba v pamäti a exportuje INSERT-only `/tmp/treasurequest-fake-customers.sql`. Overí import a cudzie kľúče lokálne; sám nekontaktuje Cloudflare. Vzdialený import je samostatná výslovne autorizovaná operácia iba proti presnému `treasurequest-db` UUID z deployment dokumentácie, po kontrole existujúcich záznamov a kolízií. Žiadne DROP, UPDATE alebo mazanie existujúcich zákazníkov. Opakovaný import sa nesmie slepo opakovať; najprv preveriť audit a prefix `fake-tq-15-v1-`, aby nevznikli duplicity. Preview DB zostáva bez týchto zákazníkov.

## Digital Product Administration

Administrácia má produktové záložky: Pixelkovia je predvolený aktívny produkt; Phone Off a QR Apartments sú neaktívne vzory. V navigácii ostávajú Overview, Objednávky a Herná analýza. Pôvodné odkazy `#customers`, `#emails` a `#events` otvoria spoločnú hernú analýzu.

`GET /api/admin/customers?view=journey` vracia jeden riadok na zákazníka, najnovšie aktívne hranie (inak posledné hranie), skutočné návštevy rodičovskej stránky a osem herných úloh. Existujúci formát API bez `view=journey` ostáva zachovaný. Filtre `state`, `version=base|extensions|full`, `portal=opened|unopened`, vyhľadávanie a nákupná kohorta sa kombinujú pred stránkovaním; aktívni zákazníci majú prednosť, dokončení sú na konci. Dokončenie sa zachová aj po uplynutí času na opakovanie. Žiadne záznamy sa automaticky nemažú.

Hviezdička základu a hviezdičky jednotlivých rozšírení vychádzajú z unikátnych zaplatených produktov, vrátane obsahu kompletného balíka. Vrátené a nezaplatené objednávky ich nepridávajú. Detail sa načíta až po rozbalení riadku a obsahuje nákupy, rodičovské návštevy/checklist, jednotlivé hrania a pokusy, e-mailové udalosti a históriu. Čas rodičovských návštev je interval medzi prvou a poslednou zaznamenanou aktivitou, nie presne meraný aktívny čas; história checklistu predstavuje jeho posledný uložený stav. Nové meranie, zákaznícke prihlásenie ani odosielanie e-mailov sa touto úpravou nezapínajú.

Rozšírenie na celú šírku skryje bočnú navigáciu a zobrazí názvy všetkých krokov. Tlačidlo Zmenšiť alebo Escape obnoví pôvodný pohľad. Na menších obrazovkách sa tabuľka posúva samostatne.
