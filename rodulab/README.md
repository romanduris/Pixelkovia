# RoduLab — Digital Product Studio

Samostatná jednostránková prezentácia na **https://rodulab.com**. Názov je RoduLab, bez „s“. Toto nie je druhý predajný funnel Pixelkovie. Zdroj stránky, logo a obrázky sú v tomto priečinku; `dist/` sa nikdy neupravuje ručne.

## Obsah a identita

Teplý svetlý podklad, tmavá typografia Manrope, limetkový detail a geometrické R. Web opisuje malé štúdio bez tvrdení o počte členov, fiktívnych klientov alebo registrácii firmy. Aktuálne tri ukážky sú vlastné projekty. Living Stones a BTS Flight Scaner sú označené ako experimenty.

Screenshoty boli zachytené zo živých verejných stránok 13. 11. 2026: [Pixelkovia](https://pixelkovia.rodulab.com/), [Living Stones](https://livingstones.rodulab.com/), [BTS Flight Scaner](https://btsflightscaner.rodulab.com/). Zobrazujú skutočné rozhrania, nie vizuálne makety. BTS mapa obsahuje atribúciu OpenStreetMap. Manrope je lokálne hostovaný s licenciou `assets/OFL-Manrope.txt`. `assets/social.jpg` je záber úvodu tejto stránky pre zdieľanie.

## Build a publikovanie

1. `node scripts/prepare-static.mjs` z koreňa repozitára pripraví aj izolované `dist/rodulab/`.
2. `node --test admin/tests/studio-contact.test.mjs` overí formulár proti izolovanej SQLite, bez skutočných e-mailov.
3. Commit a push na `origin/main`.
4. `node scripts/deploy-backend.mjs` pri zmene backendu zachová existujúce secrets a D1.
5. `node scripts/deploy-rodulab.mjs` nasadí iba štúdio do samostatného Pages projektu `rodulab-studio`, overí artefakt a nastaví rodulab.com a www.rodulab.com. Druhá adresa presmeruje na prvú. Používa pripnutý Wrangler 4.151.1 a existujúci `PIXELKOVIA_TOKEN`.

Gateway povoľuje len explicitné verejné súbory a `POST /api/contact`. Všetky ostatné cesty vracajú 404. Všetky požiadavky prechádzajú gatewayom. Pixelkovia sa naďalej publikuje iba z `dist/funnel/` pôvodným skriptom; štúdio sa tam nekopíruje.

## Denná návštevnosť

Po úspešnom načítaní úvodnej stránky gateway cez súkromný service binding zvýši jediný denný čítač v existujúcej D1. Neukladá návštevné udalosti, cookies, identifikátory, IP adresy, odkazujúce stránky ani UTM. Počítajú sa načítania stránky, vrátane opakovaných; nejde o unikátnych ľudí. HEAD, statické súbory, presmerovania, chyby, prefetch a rozpoznané roboty sa vynechávajú. Zlyhanie čítača neblokuje web.

V administrácii Pixelkovie je Predajný funnel prvou aj predvolenou obrazovkou. Kompaktný prepínač **Pixelkovia / rodulab.com** vedľa voľby Unikátni prekreslí iba graf: pri výbere štúdia zobrazí jeho súčet otvorení za obdobie a denné počty v čase Bratislavy. Predajný funnel, metriky, zdroje, obchodné údaje, filtre a upozornenia naďalej zobrazujú Pixelkoviu. Pri zbalení grafu sa skryjú oba jeho ovládacie prvky. Voľba Unikátni patrí iba Pixelkovii; štúdio meria otvorenia, preto sa pri ňom neponúka. RoduLab počíta výhradne úvodnú stránku `rodulab.com/`; Pixelkovia, Livingstones ani iné subdomény sa nepripočítavajú. Počet zahŕňa aj opakované otvorenia a vlastné návštevy; jednotlivé návštevy ani identitu návštevníkov nepoznáme. Výber webu sa zachováva medzi obnoveniami. Dátum začiatku je uložený pri migrácii `0023_studio_traffic.sql`; staršie dni zostávajú neznáme, merané dni bez načítania sú nuly.

## Kontaktný formulár a pošta

Formulár cez service binding používa **existujúci** `treasurequest-admin`, produkčnú D1 a Resend. Správy smerujú iba na súkromnú adresu `SUPPORT_FORWARD_TO`, s adresou návštevníka v `Reply-To`. Odosielateľ `RoduLab <studio@pixelkovia.rodulab.com>` využíva už overenú doménu. API nepovolí zvoliť príjemcu ani odosielateľa z prehliadača. Obsah správ a kontakty sa neukladajú do D1 ani logov; ochrana proti zneužitiu používa honeypot, overenie pôvodu, obmedzenú dĺžku, tri pokusy za desať minút na denný hash IP a globálny limit 100 pokusov denne. Opakovaný rovnaký pokus má Resend idempotency key.

Príjem správ poslaných **priamo** na `info@rodulab.com` naďalej spravuje Websupport. Preposlanie tejto adresy do Gmailu je podľa vlastníka z 13. 11. 2026 odložené, ak ho nemožno nastaviť dostupným prístupom. Cloudflare token pri Email Routing vrátil HTTP 403 `Authentication error`; Websupport API credentials nie sú v prostredí. **Nemeňte hlavné MX/SPF ani existujúce schránky kvôli tomuto formuláru.** Runtime secrets už pretrvávajú v existujúcom Workeri a Codespaces, netreba ich kopírovať do nového projektu.

## Overenie 13. 11. 2026

Prešlo 146 testov backendu vrátane formulára a dennej návštevnosti, šesť testov zdrojov funnelu/DNS, kontrola gatewaya a produkčný build. Chromium bol vizuálne aj funkčne overený pri šírkach 320, 390, 768 a 1440 px: obrázky, odkazy, súkromie, zlyhanie formulára, opakovanie s rovnakým kľúčom a úspech. WebKit zobrazil úvod na 390 px, ale interakčné overenie v tomto prostredí blokuje pád jeho stránky; reprodukoval sa aj na samostatnom jednoduchom HTML bez zdrojov štúdia. Interakcie v Safari preto nie sú týmto behom potvrdené.
