# Pixelkovia — backend a produktová administrácia

Administrácia: **https://pixelkovia.rodulab.com/admin**. Storyboard sa otvára jej interným odkazom na `/admin/storyboard`. Prihlásenie zostáva pôvodným administrátorským heslom; jeho secrets sa nemenia.

Existujúci Worker `treasurequest-admin` spravuje pôvodnú produkčnú D1 `treasurequest-db`. Pages ho volá cez privátny service binding `BACKEND`; samostatná workers.dev adresa je vypnutá. Identifikátory sú v sledovanej `wrangler.production.jsonc` a [nasadení](docs/DEPLOYMENT.md).

## Rozhrania

- `/api/admin/*`: prehľady, objednávky, zákazníci, sedem úloh, redakčné knihy a hodnotenia; vždy vyžadujú administrátorskú reláciu.
- `/api/customer/login` a `/logout`: prihlasovanie e-mailom a heslom daného nákupu. Opakované nákupy jedného e-mailu majú nezávislé zákaznícke ID a heslá.
- `/api/customer/portal`, `/library`, `/checklist`: materiály, oprávnenia, knižnica a tri kroky prípravy. Zobrazenie portálu ani stiahnutie PDF hru neaktivujú.
- `/api/customer/activate`, `/launch-context`: vedomý štart na hernom telefóne, kontrola prípravy a serverového tokenu zariadenia.
- `/api/customer/sync`, `/finish`, `/feedback`: postup z pôvodného hráča, ukončenie siedmich úloh a hviezdičky s komentárom. Telemetria nevytvára nákupné oprávnenia.
- `/api/checkout/config`, `/session`, `/status`: serverom nacenený vložený Stripe Checkout s povinným e-mailom a overeným stavom objednávky.
- `/api/stripe/webhook`: podpis Stripe, overenie zaplatenej relácie, idempotentné vytvorenie prístupu a doručovacia fronta.

## Monitorovanie platieb

Po prihlásení otvorte **Platby a chyby** (`/admin#payments`). Upozornenie je aj na Overview. Prehľad oddeľuje serverom overené peňažné platby, objednávky zdarma, vrátenia, rozpracované relácie, technické signály, neúspešné pokusy potvrdené Stripe a neoverené hlásenia prehliadača. Jedna úhrada s darčekovou hrou sa počíta ako jedna platba. Zatvorenie peňaženky, neúplné údaje a vypršanie relácie nie sú automaticky technická porucha. Historické chyby pred zapnutím monitorovania sa spätne nevymýšľajú.

Administrácia obnovuje údaje každých 30 sekúnd, keď je otvorená a viditeľná. Existujúci desaťminútový cron kontroluje nastavenie webhooku a po dávkach najdlhšie neoverené rozpracované relácie z posledných siedmich dní; nemení spôsob udeľovania prístupu. Kontrola staršia než 30 minút je neaktuálna. Upozornenia zahŕňajú aj zaplatenie bez vytvoreného prístupu po dvoch minútach a oneskorený prístupový e-mail po desiatich minútach. Ide o prehľad v administrácii, bez externých e-mailových upozornení.

`/api/checkout/diagnostic` prijíma len povolené typy udalostí, známe kódy a spôsob platby. Overuje Origin, obmedzuje počet požiadaviek a zoskupuje opakované signály. Neukladá obsah chýb poskytovateľa, údaje karty, e-mail, IP, heslo ani Stripe client secret. Prehliadač nikdy nepotvrdzuje zaplatenie a na doručenie diagnostiky sa pri platbe nečaká. Pri úplnom výpadku internetu jeho hlásenie nemusí doraziť. Pravidelné čistenie pri crone odstraňuje diagnostické záznamy staršie než 90 dní; účtovné objednávky zachováva.

Pri nasadení sa aplikuje migrácia `0011_payment_monitor.sql`. `node scripts/configure-payment-monitor.mjs` overí existujúci schválený Stripe účet a rozšíri iba existujúci Pixelkovia webhook o `payment_intent.payment_failed` a `checkout.session.async_payment_failed`; podpisové tajomstvo nemení. Overenie: `npm test --prefix admin`, `tests/payment-admin.test.cjs`, `tests/checkout-diagnostics.test.cjs` a pôvodné testy platby a obnovy v Chromium aj WebKit.

Heslá majú PBKDF2-SHA256 so soľou a serverovým pepperom. Relácie obsahujú náhodné tokeny a D1 ukladá ich hashe. Zákaznícke cookies sú `HttpOnly; Secure; SameSite=Lax`, aby fungovali vstupy z vytlačených QR; meniace požiadavky kontrolujú presný Origin. Administrátorská cookie zostáva `SameSite=Strict`. Prihlasovanie má limity pokusov. Odhlásenie zákazníka zruší identitu; token telefónu sám prístup k údajom neposkytuje a umožní obnovenie po opätovnom prihlásení na tom istom telefóne.

Krátky prístupový e-mail posiela Resend z `Piko@pixelkovia.rodulab.com`. Kým čaká na odoslanie, údaje sú šifrované AES-GCM; po odoslaní sa zašifrovaná správa odstráni. Neúspešné doručenia opakuje desaťminútový cron. Knihy nezávisia od časového okna opakovania hry. Pôvodná hranica opakovania zostáva prvé dokončenie + 24 hodín; nedokončená hra nemá nový automatický limit.

## Vývoj a overenie

```sh
npm ci --prefix admin
node scripts/sync-catalog.mjs
node admin/scripts/sync-checklist.mjs
node admin/scripts/sync-game.mjs
npm run build:check --prefix admin
npm test --prefix admin
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/customer-journey.test.cjs
```

Browser test si sám spustí izolovaný Worker a D1 s výslovne testovacími údajmi. Nezapája produkčné platby ani odosielanie. Demo a fixture nástroje sa používajú iba lokálne; produkcia má skutočné objednávky a nezobrazuje fiktívnych zákazníkov.
