# Platby a doručenie Pixelkovia

Odporúčaný postup pre existujúci checkout: **Stripe Checkout + Cloudflare Worker**, následne **Resend** na transakčné e-maily. Súčasný web zostáva na Cloudflare Pages. Toto je plán integrácie; živé platby, objednávky a odosielanie sa touto zmenou nezapínajú.

## Výber najjednoduchšej cesty

| Možnosť | Kedy sa hodí |
| --- | --- |
| Ko-fi Shop s pripojeným Stripe | Najrýchlejší samostatný obchod: Ko-fi spracuje nákup a ponúkne doručenie digitálneho súboru alebo odkazu. Znamená presun nákupu do Ko-fi a samostatné prepojenie prístupu do hry. |
| Stripe Payment Link | Najrýchlejší pokus s jednou pevnou ponukou: v Stripe vytvoriť produkt/cenu a vložiť platobný odkaz. Doručenie a prístup treba prepojiť osobitne. |
| Stripe Checkout cez Worker | Odporúčanie pre tento web: zachová výber samostatných kníh, doplnkov a automatický balík za 19,99 €. Worker z vybraných ID zostaví presný nákup a presmeruje na hotovú platobnú stránku Stripe. |

## Krok 1 — testovanie platby kartou

1. V Stripe použiť sandbox a vytvoriť ceny pre aktuálnu hru a obe knihy. Atlas zostáva zahrnutý zdarma. Pre kompletný balík zachovať zľavu 4,98 € v serverovom výpočte. Serverový katalóg musí zodpovedať `site-config.js` a existujúcim produktovým ID.
2. Pridať serverový endpoint na vytvorenie Checkout Session. Prehliadač odošle iba výber produktov a prípadný voucher. Worker overí povolené produkty, cenu a zľavu zo serverového katalógu; neprijíma výslednú sumu z HTML alebo klientského JavaScriptu.
3. Tlačidlo presmeruje zákazníka na Stripe Checkout. Kartu zadáva na stránke Stripe. Stripe vyzbiera e-mail potrebný na potvrdenie a prístup; súčasný formulár treba napojiť alebo zjednodušiť tak, aby sa údaje nezadávali dvakrát.
4. V testoch overiť všetky kombinácie doplnkov, samostatné knihy, úspech, zamietnutie karty, zrušenie a 3D Secure. Kým nie je pripravené skutočné doručenie a ochrana obsahu, zostať v sandboxe.

Tajný Stripe API kľúč patrí do Worker secrets. Verejný funnel teraz blokuje sieťové API volania cez CSP; pri integrácii cielene povoliť potrebný endpoint a presmerovanie. Herné súbory a platené materiály zostávajú mimo verejného `dist/funnel/`.

## Krok 2 — potvrdenie objednávky a e-mail

1. Stripe pošle podpísaný webhook `checkout.session.completed`. Worker overí podpis nad pôvodným telom požiadavky, prostredie, menu, produkty, sumu a stav platby. Prístup sa prizná iba pri stave `paid` alebo pri overenej nulovej objednávke `no_payment_required`.
2. Checkout Session ID bude jedinečný kľúč objednávky. Opakovaný či súbežný webhook nesmie vytvoriť ďalšiu objednávku, oprávnenie ani e-mail. Nadviazať na existujúce serverové `createOrder()` a D1, upraviť model podľa overených Stripe identifikátorov.
3. Uložiť objednávku, položky a oprávnenia spolu s požiadavkou na doručenie. Samostatné opakovanie neúspešného e-mailu nesmie znovu vytvárať nákup. Pri prípadnom rozšírení na oneskorené platobné metódy spracovať aj úspešné/asynchrónne zlyhanie; stav `unpaid` nesmie odomknúť obsah.
4. Resend odošle potvrdenie s prehľadom nákupu a bezpečným odkazom do zákazníckeho portálu. Overiť odosielaciu doménu cez DNS v Cloudflare, API kľúč uložiť medzi Worker secrets a použiť existujúce e-mailové koncepty ako základ.
5. Pred ostrým predajom dokončiť zákaznícke overenie, ktoré dnes chýba (`CUSTOMER_AUTH`), a chránené doručovanie hry, kníh a PDF. E-mail nemá obsahovať univerzálny verejný odkaz na platené súbory ani smerovať na súkromný owner-only náhľad Sites.

Návrat zákazníka na stránku „Ďakujeme“ môže ukázať stav objednávky. Objednávka a e-mail vznikajú z overeného webhooku, aj keď zákazník po platbe zatvorí kartu.

## Vývojový voucher `free`

Aktuálne iba upraví zobrazenú cenu v checkoutovej stránke na 0 €. Nákupné tlačidlo zostáva neaktívne a údaje sa neodosielajú. Kód nie je tajný a nedáva prístup do hry.

Pri napojení Stripe vytvoriť v sandboxe 100 % kupón/promo kód a overovať ho serverovo. Stripe podporuje nulové objednávky bez zadania karty; takéto nákupy treba dokončiť cez Checkout Session, pretože nemajú PaymentIntent. Rovnaké overené vytvorenie objednávky a doručenie potom obslúži zaplatený aj bezplatný nákup. Vývojový kód vypnúť pred ostrým predajom; prípadné ostré vouchery spravovať oddelene.

## Podklady

- [Stripe Checkout](https://docs.stripe.com/payments/checkout)
- [Stripe Payment Links](https://docs.stripe.com/payment-links)
- [Overené doručenie cez webhook](https://docs.stripe.com/checkout/fulfillment)
- [Nulové objednávky](https://docs.stripe.com/payments/checkout/no-cost-orders)
- [Cloudflare Workers a Resend](https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/)
- [Ko-fi Shop a digitálne produkty](https://help.ko-fi.com/hc/en-us/articles/360009712917-Ko-fi-Shop-Sell-digital-physical-products)
