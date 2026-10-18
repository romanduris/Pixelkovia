# TreasureQuest Admin – V5 / Etapa 2

Samostatná administrácia a Worker API v existujúcom repozitári Pixelkovia. Frontend je čisté HTML/CSS/JS, Worker používa D1 a `jose` na overenie Cloudflare Access. Verejný web, rodičovský portál a hra zostávajú v koreňových súboroch a v pôvodnej ChatGPT Site. `admin/` sa nekopíruje do `dist/` a nesmie byť publikovaný obyčajným statickým hostingom.

**Stav: lokálne implementované a testované; produkčný Cloudflare deploy čaká na výslovné schválenie.** Neexistuje produkčná admin URL ani produkčná TreasureQuest databáza. Súčasný Cloudflare token bol použitý výlučne na GET inventúru.

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
- Interné odkazy na funnel, rodičovský test, storyboard, Atlas a tlačoviny majú `internalPreview=1`. Samotné prekliky nevytvárajú aktivácie ani udalosti. Storyboard ponúka návrat do lokálneho adminu len na loopback pôvode; produkčný odkaz zostáva neaktívny, kým nebude schválená chránená URL.
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

`run_worker_first: true` vedie všetky admin assety aj API cez Worker. Cloudflare Access musí pokrývať celý host vrátane `/api/admin/*`. Worker navyše kontroluje podpis RS256, issuer tímu, AUD konkrétnej aplikácie, expiráciu a výslovne povolený admin e-mail. Hlavička s e-mailom sama nestačí. Pri chýbajúcom Access nastavení sa administrácia odmietne. CSP, `no-store`, `nosniff`, zákaz embedovania a `noindex` sa nastavujú aj na odpovede; SQL používa bind parametre a whitelist radenia.

Jediná lokálna výnimka vyžaduje súčasne `ENVIRONMENT=local` a loopback hostname. Lokálny režim sa na vzdialenom hoste odmietne **pred** assetmi aj API. Produkcia nikdy nepoužíva lokálny admin bypass.

Zákaznícke API je oddelené od admin API a vyžaduje budúci **privátny service binding `CUSTOMER_AUTH`**. Bez neho vracia 501 a neumožní aktiváciu či čítanie údajov. Neakceptuje zákaznícke ID z neoverenej vstupnej hlavičky. Budúci identity Worker musí bezpečne overiť session a vrátiť iba oprávneného zákazníka. Nie je súčasťou tejto etapy.

Aktivácia skontroluje platbu, vlastníctvo oprávnenia a všetkých 13 potvrdení. Vygeneruje náhodný token telefónu, uloží iba SHA-256 digest a token pošle iba ako `__Host-tq-run` cookie (`HttpOnly`, `Secure`, `SameSite=Strict`). DB povoľuje iba jednu aktívnu reláciu na oprávnenie. User-agent ani localStorage nie sú bezpečnostná hranica.

Server overuje postupnosť aj správnosť odpovede; verejný `events` endpoint neprijme klientom vymyslený úspech. Pokusy sa ukladajú bez surových odpovedí. Jedinečné ID udalosti spolu s hashom požiadavky zabezpečujú opakovateľnosť požiadaviek a odmietnutie konfliktov. Batch zápisy sú transakčné.

Prvé úspešné dokončenie nastaví pevnú hranicu `first_completed_at + 24 hodín`. Ďalšie hrania ju nepredlžujú. Limit nedokončenej hry je bez schválenia **nezadaný**; budúca konfigurácia `UNFINISHED_TTL_HOURS` ho môže nastaviť. Bezpečný prenos na nový telefón je explicitný nezapojený integračný bod, nie obchádzka kontrol.

## API a nezapojené integračné body

| Rozhranie | Stav |
| --- | --- |
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
| QR odkazy | Model počíta so spoločnými QR a bezpečnou serverovou reláciou; pôvodná maketa P1 sa nemení |

Prepojenie aktuálnej Site s budúcou zákazníckou cookie vyžaduje samostatne navrhnutý same-origin gateway/doménu. Budúci zákaznícky hostname/gateway musí mať zákaznícke overenie oddelené od Access ochrany admin hosta. Nepovoľujeme všeobecný CORS ani treťostranné cookies ako skratku.

## Testy

```bash
npm run build:check --prefix admin
npm test --prefix admin
PLAYWRIGHT_MODULE=/tmp/pixelkovia-qa/node_modules/playwright node admin/tests/browser.test.cjs
```

Backendové testy používajú lokálny SQLite adaptér a samostatný integračný test v skutočnom `workerd`/D1 simulátore Miniflare. Integrácia vyžaduje predchádzajúci `build:check`; nepoužíva Cloudflare účet ani API token. Testuje migrácie, objednávku, checklist, aktiváciu, cookie telefónu, overenie odpovede a duplicitu. Testy overujú tiež prázdny stav, 18 demo rodín, izoláciu zákazníkov, anonymný a podvrhnutý Access, platné aj neplatné RS256 JWT, radenie/SQL injection, stránkovanie, transakčný rollback, elapsed/active čas, opakovanie a pevných 24 hodín.

Browser test vyžaduje bežiaci lokálny demo Worker na 8787. Overuje reálne D1 dáta, vyhľadávanie, stavové aj produktové filtre, detail, grafy/analytiku, mobilné karty a šírky 320/390/768/1512. Pôvodné testy `tests/` zostávajú samostatné a overujú celú hru, portál, PDF, médiá, staré uloženia a navigáciu.

## Inventúra bez zmien

```bash
node admin/scripts/inventory-cloudflare.mjs
node admin/scripts/deployment-plan.mjs
```

Token je v premennej `CLOUDFLARE_API_TOKEN` alebo v chránenom súbore `/tmp/treasurequest-cloudflare-token`; nikdy v argumentoch, zdrojovom kóde alebo GitHube. Inventarizačný skript odosiela iba GET, nečíta hodnoty secrets a výsledok ukladá do ignorovaného `admin/docs/cloudflare-inventory.local.json`. Účel existujúcich projektov neháda. Pri viacerých účtoch sa zastaví pred inventúrou a vyžiada konkrétne Account ID. Nasadzovací plán je iba výpis – nenasadzuje ani nemigruje nič.
