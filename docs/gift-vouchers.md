# Darčekové poukazy KOVO, SANDY a ROSOS

Každý z troch kódov zníži celý aktuálny výber v pokladnici na **0 €** vrátane kníh, Atlasu a voliteľnej druhej hry. Každý možno použiť na **jednu dokončenú objednávku**, bez nastavenej expirácie. Nedokončená pokladnica poukaz nespotrebuje. Rozpracovaný nákup ho rezervuje; pri úprave objednávky alebo po skončení 30-minútovej relácie sa rezervácia uvoľní až po bezpečnom overení Stripe. Dokončená relácia ostáva rezervovaná aj počas čakania na webhook.

## Tlač a použitie

- [Náhľad a PDF v administrácii](https://pixelkovia.rodulab.com/admin/vouchers); odkaz „Darčekové poukazy“ je aj v navigácii administrácie.
- [PDF A4](https://pixelkovia.rodulab.com/admin/vouchers.pdf) vyžaduje prihlásenie správcu. Tlačiť na A4, v skutočnej veľkosti **100 %**, bez prispôsobenia a bez hlavičky/päty prehliadača. PDF už obsahuje farby.
- Papier rozstrihnúť pozdĺž dvoch prerušovaných osí. KOVO je vľavo hore, SANDY vpravo hore a ROSOS vľavo dole. Pravá dolná štvrtina je voľná.
- QR otvorí verejnú ponuku `https://pixelkovia.rodulab.com`. Obdarovaný si vyberie obsah, klikne na „Mám zľavový kód“, zadá kód a dokončí objednávku zdarma so svojím e-mailom. Prístup dostane existujúcim systémom doručovania.

## Zdroj a overenie

Zdroj tlače je `gift-vouchers.html` a `gift-vouchers.css`; obrázok je existujúci schválený Guardy. QR a jednopagové PDF obnoví `scripts/export-gift-vouchers.cjs`. Ako pri existujúcom exporte pracovných listov sa voliteľné autorské moduly Playwright a qrcode inštalujú mimo repozitára a odovzdajú cez `PLAYWRIGHT_MODULE` a `QRCODE_MODULE`.

Kódy sú v existujúcej produkčnej D1, migrácia `0028_gift_vouchers.sql`. Verejný katalóg ich neobsahuje; pokladnica overuje zadaný kód serverom. Unikátna rezervácia vzniká v rovnakej transakcii ako checkout. Spotrebovanie poukazu vzniká v rovnakej transakcii ako obe prípadné objednávky, oprávnenia a šifrované doručovacie údaje. Vyžaduje správnu rezerváciu a dokončenú nulovú Stripe Session; prístup vytvára existujúci podpísaný webhook. Opakované udalosti nevytvoria ďalšie objednávky. Administrácia v platbách zobrazuje konkrétny darčekový kód.

PDF, jeho náhľad, QR aj tlačové štýly majú serverovú rolu `admin`; priamy `_protected` prístup zostáva 404. Herné materiály, úlohy a nahrávky sa nemenia. Produkčné darčekové kódy sa pri overovaní nespotrebúvajú.
