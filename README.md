# Pixelkovia

Jediná aktívna aplikácia: **https://pixelkovia.rodulab.com**.

- `/` a `/checkout`: predaj hry, dvoch kníh a bezplatného Atlasu.
- `/Supervisor`: rodičovský portál, samostatné prihlasovacie údaje pre každý nákup, PDF materiály, knižnica, tri potvrdenia prípravy, rozbaľovací zoznam siedmich úkrytov, postup úlohami a hodnotenie. Príprava aj jednotlivé úkryty sa ukladajú na server ku konkrétnej hre. Umiestnenia sa pri zostavení preberajú z rodičovského návodu a zostávajú za plateným prístupom.
- `/hra`: pôvodná hra so siedmimi nezmenenými úlohami. QR odkazy smerujú sem s parametrom `signal`.
- `/admin`: produktová administrácia, objednávky, priebeh hrania a hodnotenia. `/admin/storyboard` vyžaduje to isté administrátorské prihlásenie.

Rodičovský portál označuje prípravnú časť „Príprava na hru“. Po spustení hry je príprava zbalená nad tlačidlom „Spustiť hru“ a priebehom tímu; tlačidlo pokračuje v existujúcej relácii.

Tlačidlo „Koniec hry“ v závere uloží ukončenie a otvorí hodnotenie v rodičovskom portáli aj pri chýbajúcom zázname úlohy alebo chybe synchronizácie. Počet vyriešených úloh vychádza zo skutočne uložených záznamov; ukončenie nedopĺňa chýbajúce riešenia. Chyba samotného ukončenia ponechá možnosť skúsiť ho znova. Zatvorenie okna po jednotlivej úlohe iba uloží postup. Autorizácia nákupu a herného telefónu zostáva povinná.

## Zostavenie a nasadenie

Node.js 24+, Python s `pypdf`; závislosti backendu sú pripnuté v `admin/package-lock.json`.

```sh
npm ci --prefix admin
node scripts/prepare-static.mjs
npm run build:check --prefix admin
npm test --prefix admin
# Po commite a pushi na origin/main:
node scripts/deploy-backend.mjs
WRANGLER_BIN=admin/node_modules/wrangler/bin/wrangler.js node scripts/deploy-funnel.mjs
```

Zdroje sú koreňové HTML/CSS/JS, `books-content/` a `assets/`. `dist/funnel/` je jediný nasadzovaný balík aplikácie. Pages Worker povoľuje presný zoznam verejných súborov a pred každým chráneným súborom overuje serverové oprávnenie. Priame URL pod `_protected/` sa nikdy neobsluhujú. Backend používa pôvodnú produkčnú D1; nevzniká druhý zákaznícky systém.

Pôvodná owner-private ChatGPT Site obsahuje iba oznam o presune, zostavený do `dist/client/`. Nie je druhým náhľadom aplikácie.

## Platby a e-maily

Platba zostáva priamo v pôvodnom tmavom formulári pod súčtom objednávky. Stripe Payment Element a Express Checkout používajú jeden spoločný tok pre hru aj samostatné knihy. Opravené sú duplicitný návratový parameter, rozlišovanie validácie a zamietnutia a obnova neistého výsledku. Nový nákup s rovnakým e-mailom po dokončenej platbe nevyžaduje ďalšiu potvrdzovaciu obrazovku. Detaily sú v [audite P0](MD/P0-google-pay-timeout-apple-pay-audit.md). E-mail je povinný ešte pred vytvorením platby. Server vypočíta cenu podľa spoločného katalógu; podpis webhooku a skutočná zaplatená relácia rozhodujú o vytvorení objednávky. Každá vytvorená objednávka má vlastný prístup. Dva nákupy s rovnakým e-mailom vytvoria dva oddelené účty s rôznymi heslami.

V checkoute je pod tlačidlom kúpiť odkaz na voucher. Schválený kód `free` pokryje celú vybranú objednávku vrátane kníh. Server uloží použitý kód a nulovú sumu; prístup vytvorí až podpísaná udalosť pre dokončenú nulovú reláciu overenú cez Stripe API. Karta sa pri nulovej objednávke nevyžaduje. Samotný kód v prehliadači ani návratová URL prístup neudeľujú.

Kupón `1e` upraví celú vybranú objednávku na 1 € aj pri druhej hre. Stále vyžaduje skutočné zaplatenie a overenie Stripe na serveri; existujúci `free` zostáva za 0 €.

Kompaktný checkout zbiera iba e-mail. Nasledujú tri stručné doplnky: Atlas zdarma, obe ilustrované knihy za 4,99 € (presne za polovicu) s existujúcou spoločnou ukážkou a darčekové dobrodružstvo za 9,99 €. Súhrn má jeden zelený panel so šírkou najviac 660 px. „Pokračovať k platbe“ rozbalí pôvodný integrovaný formulár v zelenom súhrne. Finálne tlačidlo „Zaplatiť“ zobrazuje overenú sumu; neplatné údaje zostávajú opraviteľné vo formulári. Výsledok platby overuje server. Súhrn uvádza ceny položiek po zľave; zľavy na knihy a na druhú hru oproti ich aktuálnym samostatným cenám sprístupní rozbalenie „Ako sa vypočítala cena?“. Na mobile je cena aj tlačidlo platby dostupné aj v spodnom paneli. Druhá hra má samostatnú objednávku a vlastný účet bez kníh či Atlasu; kupujúcemu prídu dva oddelené e-maily s rôznymi heslami. Druhý e-mail môže preposlať ďalšej rodine. Jedna overená Stripe relácia vytvorí obe objednávky v jednej databázovej transakcii. Voucher pokrýva aj druhú hru.

Prístupový e-mail z `Piko@pixelkovia.rodulab.com` posiela Resend. Heslo sa uchováva ako hash; šifrovaná správa v doručovacej fronte sa po odoslaní odstráni. Worker opakuje neúspešné odoslania každých desať minút.

Nastavenie: [docs/payment-setup.md](docs/payment-setup.md). Bez overených kľúčov a e-mailovej domény zostáva nákup vypnutý.

## Overenie

```sh
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/supervisor-mobile.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright QA_BROWSER=webkit node tests/supervisor-mobile.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/customer-journey.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright QA_BROWSER=webkit node tests/customer-journey.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/finale-recovery.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright QA_BROWSER=webkit node tests/finale-recovery.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/checkout-payment.test.cjs
PLAYWRIGHT_MODULE=/cesta/k/playwright QA_BROWSER=webkit node tests/checkout-payment.test.cjs
node tests/books-content.test.cjs
node tests/static-assets.test.cjs
node tests/digital-identity.test.cjs
node tests/paper-puzzles.test.cjs
```

Mobilný test portálu overuje dotykové ovládanie pri 320/360/390/430 px, desktop pri 1280 px, rozbalenie úkrytov a vysvetlenia telefónu, individuálne aj spoločné potvrdenie, obnovu po chybe ukladania a prepnutie medzi dvoma nákupmi s rovnakým e-mailom.

Predvolené testy používajú Chromium; `QA_BROWSER=webkit` volí WebKit. Dňa 28. 10. 2026 prešla celá cesta aj platobné scenáre v oboch prehliadačoch. Test celej cesty používa izolované Workers a D1, skutočné prihlasovacie relácie, prípravu, všetkých sedem pôvodných úloh, návrat do portálu, hodnotenie, druhý telefón a administráciu. Checkout kontroluje šírky 360, 390, 430 a 1360 px, ceny, návrat k objednávke a chybové stavy s riadenou náhradou Stripe SDK. Testy nevytvárajú produkčných zákazníkov ani platby; neoverujú fyzické zariadenie, banku ani doručenie skutočného e-mailu. Prístupové údaje fixture zostávajú v testovacom procese.

Dňa 2. 11. 2026 v Chromium prešli `customer-journey`, `finale-recovery`, `cipko-mobile-fit` a `supervisor-mobile`, vrátane mobilných obrazoviek a výpadkov pri ukončení hry. Opätovné overenie vo WebKit 27.2 (Playwright 1.64.1) v tomto Codespace zablokoval pád stránky, reprodukovaný aj na `data:text/html,<h1>ok</h1>` bez kódu aplikácie. Tieto kontroly preto nepotvrdzujú aktuálny výsledok na iPhone/Safari.

## QR a tlač

```sh
QRCODE_MODULE=/cesta/k/qrcode node scripts/generate-qr.cjs
SHARP_MODULE=/cesta/k/sharp PLAYWRIGHT_MODULE=/cesta/k/playwright node scripts/export-printables.cjs
```

PDF má rodičovský návod ako prvú stranu, sedem pracovných listov a diplom, každé na jednej A4. Pri zmene QR sa obnovia aj dotknuté PDF, obrázkové náhľady a spoločný balík. Pravidlá servera a checklist sa odvodzujú zo spoločných zdrojov cez `admin/scripts/sync-game.mjs` a `sync-checklist.mjs`; ceny cez `scripts/sync-catalog.mjs` pri zostavení.
