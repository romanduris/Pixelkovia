# Inventúra a plán nasadenia – čaká na schválenie

**Stav k 18. 10. 2026: iba GET inventúra, lokálne migrácie, lokálne demo a dry-run balenie. Žiadny produkčný Cloudflare zdroj nebol vytvorený ani zmenený.**

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

## Navrhnuté oddelené zdroje

| Prostredie | Worker: admin + API | Databáza | Binding |
| --- | --- | --- | --- |
| Lokálne, už vytvorené iba na disku | `treasurequest-local` | lokálny SQLite D1 simulátor | `TQ_DB` |
| Testovacie, zatiaľ len návrh | `treasurequest-admin-preview` | `treasurequest-db-preview` | `TQ_DB` |
| Produkčné, zatiaľ len návrh | `treasurequest-admin` | `treasurequest-db` | `TQ_DB` |

API a administrácia sú v jednom Workeri. Nevzniká tretí nepotrebný `treasurequest-api` Worker. Obe navrhované Worker mená a obe DB mená boli pri inventúre voľné; pred vytvorením sa preveria znovu.

Navrhovaná produkčná URL: `https://treasurequest-admin.livingstones-romanduris.workers.dev`.
API: rovnaký host pod `/api/admin/` a neskôr `/api/customer/`.
Preview má vlastný host `treasurequest-admin-preview.livingstones-romanduris.workers.dev` a oddelený AUD/DB.
**Ide o návrhy, nie o funkčné publikované odkazy.**

Pre administráciu môže neskôr používateľ zvoliť vlastnú subdoménu. Tento plán **nepridáva DNS záznamy ani routes na `rodulab.com`** a nepresúva existujúcu ChatGPT Site.

## Schvaľovací bod 1 – pred prvým Cloudflare zápisom

Vyžiadať výslovné potvrdenie:

1. Account ID uvedeného účtu.
2. Nové Worker a D1 názvy pre produkciu aj preview.
3. Presnú e-mailovú adresu administrátora, prípadne ďalších administrátorov.
4. Zapnutie Cloudflare Access / Zero Trust a vytvorenie **iba nových** TreasureQuest aplikácií/politík; existujúce pravidlá sa nemenia.
5. Použitie navrhnutých `workers.dev` adries bez DNS zmien.
6. Že sa nevytvára platené predplatné ani nesúhlasí s navýšením plánu automaticky.

Až potom pripraviť token na zápis, obmedzený na tento jediný účet. Potrebné oblasti budú Workers Scripts, D1, Access Apps/Policies a podľa možností onboarding Access. Oprávnenie na Workers Scripts je účtové; samo osebe neizoluje existujúce Workery. Preto sa pred každým zápisom overí povolený zoznam **nových** názvov. Žiadne DNS Edit, mazanie zdrojov ani úprava existujúcich projektov nie sú súčasťou súhlasu.

Access onboarding môže vyžadovať, aby používateľ v dashboarde vybral organizáciu/plán a potvrdil podmienky. Tieto osobné a prípadné platobné potvrdenia sa neobchádzajú API. Po dokončení onboardingu možno aplikácie a politiky nastaviť cez API.

## Presné poradie po schválení

1. Zopakovať GET inventúru a potvrdiť ten istý účet a voľné nové názvy. Ak sa stav zmenil alebo meno už existuje, zastaviť sa; nepripojiť sa automaticky k rovnomennému zdroju.
2. Vytvoriť iba `treasurequest-db` a `treasurequest-db-preview` cez D1 API. Uchovať vrátené nové UUID. Nevytvárať R2/KV.
3. **Schvaľovací bod 2:** ukázať presné mená a nové UUID oboch databáz a vyžiadať výslovné potvrdenie pred vzdialenými migráciami. Toto schválenie nemožno nahradiť menom databázy či pôvodným všeobecným súhlasom.
4. Po tomto potvrdení aplikovať iba `0001_initial.sql` a `0002_product_catalog.sql` na potvrdené nové DB. Nevkladať demo zákazníkov do produkcie.
5. Vytvoriť nové Access aplikácie pre celé dva admin hosty a politiky s konkrétnymi povolenými e-mailmi. Žiadne anonymné Allow, Everyone ani Bypass. Overiť, že politika zahŕňa assety aj `/api/admin/*`. Uchovať skutočný issuer a AUD každého prostredia.
6. Z príkladu `wrangler.production.example.jsonc` pripraviť ignorovaný `wrangler.production.jsonc` s overeným Account ID, **novými** DB UUID, presnými admin e-mailmi, team domain a AUD. Nepridávať `CUSTOMER_AUTH` ani platobné/e-mailové secrets, pokiaľ tieto služby neboli samostatne pripravené a schválené. `DEMO_MODE=false`, `ENVIRONMENT=production` alebo `preview`; `workers_dev` a preview URL sú spočiatku vypnuté.
7. Lokálne zopakovať testy a dry-run; porovnať binding `TQ_DB` s potvrdeným UUID. Ak sa objaví ID `livingstones-db`, okamžite zastaviť postup.
8. Nasadiť iba nové Workery cez Wrangler/API s ochranou v kóde a vypnutými verejnými routes. Po overení Access konfigurácie zapnúť výlučne schválené nové hosty. Server musí odmietnuť všetko bez správneho Access JWT ešte pred akýmkoľvek čítaním osobných údajov.
9. Otestovať z neprihláseného profilu HTML, JS/CSS a všetky admin API: žiadne dáta, len Access challenge alebo 401/403. Podvrhnutá e-mailová hlavička ani JWT nesmú stačiť. Potom overiť konkrétneho administrátora a prázdnu produkčnú DB.
10. Až po úspešnom chránenom nasadení zapísať schválenú admin URL do `SITE_CONFIG.management.url` a aktualizovať storyboard/pôvodnú Site. Funnel ani rodičovský portál nedostanú administrátorský odkaz.
11. Na záver znovu prečítať existujúce Worker nastavenia, bindings, doménu a DB a potvrdiť, že nesúvisiace projekty neboli zmenené. Uchovať presné nasadené verzie a migračný audit.

Všetky operácie GitHubu zostávajú na `main`, s bežným push bez force. `admin/` nie je súčasťou statického deploymentu Site. Aktualizácia Site nemôže nahradiť schválenie Cloudflare produkčných operácií.

## Náklady a limity

Zatiaľ nevznikli žiadne nové vzdialené zdroje ani zmeny tarify. Pre malý admin môže byť východiskom Workers Free; uplatňujú sa limity účtu a existujúce projekty môžu čerpať rovnakú kvótu. Workers Paid má podľa aktuálnej dokumentácie minimálny mesačný poplatok 5 USD; nezapína sa automaticky. D1 Free zahŕňa denné kvóty čítania/zápisu, ktoré treba sledovať najmä pri analytických dotazoch.

Pred schváleným spustením preveriť plán konkrétneho účtu a aktuálne ceny: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/), [Access plány](https://www.cloudflare.com/plans/zero-trust-services/). Tento návrh nezaručuje nulové náklady a neautorizuje platené služby.

Agregačné prehľady aktuálne načítavajú filtrovanú kohortu a vypočítajú medián na serveri. Pred veľkými objemami treba zaviesť SQL agregácie/window funkcie alebo inkrementálne súhrny a preveriť D1/Worker limity; prototyp sa nevydáva za neobmedzený analytický systém.

## Čo ešte nie je zapojené

- Cloudflare produkčné/preview zdroje, skutočný Access účet a app AUD.
- Zákaznícka identita, Magic Link, bezpečný transfer telefónu.
- Overený platobný webhook a reálne objednávky.
- Napojenie aktuálnej statickej hry na serverové oprávnenia a udalosti.
- Produkčná ochrana a súkromné doručovanie existujúcich herných PDF/JS.
- E-mailový poskytovateľ, odhlasovanie a personalizované diplomy.
- Schválený limit nedokončenej hry.

Tieto body sa nesimulujú vo verejnom webe. Všetky zobrazené demo udalosti vznikli výlučne v lokálnej testovacej DB.
