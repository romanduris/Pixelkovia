# Platba kartou a upozornenie majiteľovi

Používateľ schválil reálne platby kartou, upozornenie na `roman.duris@gmail.com` a **ručné doručenie prístupu zákazníkovi**. Aktuálne je pripravený adaptér pre **Stripe Payment Links**; platby zostávajú vypnuté, pretože Stripe účet ešte nie je pripojený a neexistujú overené platobné odkazy. Pripojenie k Stripe bolo ponúknuté cez aplikáciu.

## Najkratší postup k spusteniu

1. Pripojiť existujúci Stripe účet. Overiť presný účet, jeho režim a možnosť prijímať reálne platby. Tajné kľúče nepatria do chatu, repozitára ani verejného JavaScriptu. Na samotné presmerovanie na Payment Links web žiadny API kľúč nepotrebuje.
2. V pripojenom účte vytvoriť alebo použiť platobné odkazy pre aktuálne ponuky. Ceny sú nižšie; každá ponuka má variant s Atlasom aj bez neho, spolu 14 odkazov. Atlas sa započítava za 0 €. Množstvo položiek je pevné, bez ďalších platených doplnkov či nastaviteľných súm na platobnej stránke.
3. Na Stripe stránke zbierať kartu aj kontaktný e-mail a uviesť: **„Prístup a materiály vám po potvrdení platby pošleme osobne e-mailom.“** Rovnaký text má byť aj v hostovanom potvrdení Stripe. Nepoužívať súkromný owner-only náhľad Sites ako zákaznícky prístup.
4. V profile Stripe otvoriť **Communication preferences** a zapnúť upozornenia na **Successful payments** pre používateľa s e-mailom `roman.duris@gmail.com`. Stripe tieto preferencie spravuje osobitne pre každého člena tímu. Potvrdenie o nastavení zatiaľ chýba; aplikácia ho nenastavila a e-mail neodoslala.
5. Overiť odkazy, produkty, sumy v EUR, účet a režim priamo zo Stripe. Záznamy uložiť do verejnej konfigurácie `payments` v `site-config.js`; obsahujú iba URL a overené údaje, žiadne credentials. Najprv overiť testovací nákup na Stripe a potom nastaviť reálny režim.
6. Nastaviť `mode: 'live'`, skutočný `accountId`, `chargesEnabled: true` a `merchantNotificationsConfirmed: true` až po ich overení. `offer.paymentsEnabled` sa vypočíta automaticky; ak niektorá kombinácia chýba alebo nesedí jej cena, menu, účet či režim, celý checkout zostane vypnutý.
7. Zostaviť súkromný aj verejný balík, otestovať, commitnúť a pushnúť na `origin/main`, zverejniť existujúcu súkromnú Site a samostatne `dist/funnel/`. Po reálnom nákupe majiteľ overí prijatú platbu v Stripe a odošle prístup zákazníkovi na e-mail z platby.

| Výber | Celkom |
| --- | ---: |
| Hra | 14,99 € |
| Hra + prvá kniha | 19,98 € |
| Hra + druhá kniha | 19,98 € |
| Hra + obe knihy | 19,99 € |
| Prvá kniha samostatne | 4,99 € |
| Druhá kniha samostatne | 4,99 € |
| Obe knihy bez hry | 9,98 € |

Každý riadok má platobný variant s Atlasom a bez Atlasu za rovnakú cenu. `paymentVariants()` vráti všetkých 14 variantov a `paymentKey()` ich jedinečné kľúče. Každý záznam `payments.links[key]` obsahuje skutočné `url`, `accountId`, `livemode`, `currency: 'eur'`, `priceCents` a `verified: true`. Nesmú sa dopĺňať odhadnuté ani testovacie zástupné odkazy do produkčného zdroja.

## Správanie checkoutu

- Prijíma iba oficiálne HTTPS odkazy `buy.stripe.com`, zodpovedajúce testovaciemu alebo reálnemu režimu. Neznámy hostiteľ, zlá suma, iný účet či chýbajúca kombinácia neaktivujú tlačidlo.
- Pri zapnutých platbách sa skryje duplicitný formulár mena a e-mailu. Údaje si zákazník vyplní priamo na Stripe; naša stránka iba vyberá obsah a presmeruje ho.
- Testovací režim je výrazne označený ako test bez strhnutia peňazí. Úspech sa nesimuluje cez URL, localStorage ani návrat zo Stripe. Ručné doručenie vychádza z platby overenej v Stripe Dashboarde.
- Vývojový voucher `free` naďalej funguje v neaktívnom náhľade ako nulový cenový prepočet. Pri spustených platbách funguje iba po vytvorení a overení zodpovedajúceho 100 % Stripe promo kódu, nastavení `promotionCode` a `promotionVerified: true`. Aplikácia ho vloží do `prefilled_promo_code`; bez overeného promo kódu sa ako aktívny voucher neponúka. Nulová cena v HTML sama neznamená bezplatnú objednávku.
- Atlas, knižné voľby, kompletný balík a uložený herný postup zostávajú zachované. Verejný funnel naďalej neobsahuje hru, platené knihy, celé PDF ani administráciu.

## Overenie

`node tests/payment-links.test.cjs` kontroluje kompletnosť a sumy všetkých variantov, bezpečné URL, režim, účet, menu, promo kód a podmienky reálneho spustenia. `tests/payment-checkout.test.cjs` používa iba pamäťovú konfiguráciu a zachytené presmerovania v prehliadači: overí mobil aj desktop v Chromium a WebKite, manuálne doručenie, výber Atlasu, voucher a zachovaný postup. **Tieto testy nevykonávajú reálnu Stripe platbu ani neoverujú doručenie e-mailu.** Tie čakajú na pripojenie účtu.

## Podklady

- [Stripe Payment Links](https://docs.stripe.com/payment-links)
- [Prispôsobenie platobnej stránky a promo kód v URL](https://docs.stripe.com/payment-links/customize)
- [Upozornenia na úspešné platby majiteľovi](https://support.stripe.com/questions/set-up-account-email-notifications)

Automatické doručovanie zákazníkom je samostatný ďalší krok: vyžaduje overené serverové platobné udalosti a zákaznícky prístup. Ručné doručenie zatiaľ nevytvára lokálne oprávnenia ani nenahrádza overenie nákupu.
