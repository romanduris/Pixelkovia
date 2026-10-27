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

Heslá majú PBKDF2-SHA256 so soľou a serverovým pepperom. Relácie obsahujú náhodné tokeny a D1 ukladá ich hashe. Zákaznícke cookies sú `HttpOnly; Secure; SameSite=Lax`, aby fungovali vstupy z vytlačených QR; meniace požiadavky kontrolujú presný Origin. Administrátorská cookie zostáva `SameSite=Strict`. Prihlasovanie má limity pokusov. Odhlásenie zákazníka zruší identitu; token telefónu sám prístup k údajom neposkytuje a umožní obnovenie po opätovnom prihlásení na tom istom telefóne.

Krátky prístupový e-mail posiela Resend z `Adam@pixelkovia.rodulab.com`. Kým čaká na odoslanie, údaje sú šifrované AES-GCM; po odoslaní sa zašifrovaná správa odstráni. Neúspešné doručenia opakuje desaťminútový cron. Knihy nezávisia od časového okna opakovania hry. Pôvodná hranica opakovania zostáva prvé dokončenie + 24 hodín; nedokončená hra nemá nový automatický limit.

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
