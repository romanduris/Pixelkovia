# Predajný funnel – MVP

Záložka: https://pixelkovia.rodulab.com/admin#marketing. Rovnaké prihlásenie, Worker `treasurequest-admin` a produkčná D1; žiadna externá analytická databáza.

## Údaje a metodika

- **Návštevy**: prvostranné udalosti z `/` a `/checkout` iba po dobrovoľnom analytickom súhlase. Jedna návšteva používa náhodné UUID; po 30 minútach medzi zaznamenanými otvoreniami stránky začína nová. Obnovenie ani ďalšia karta tú istú návštevu nezdvojujú. Celková návštevnosť bez súhlasu, bez JS alebo s blokovačom nie je známa.
- **Checkout**: unikátny pseudonymný identifikátor prehliadača s otvorením checkoutu v návštevnej kohorte. Nie fyzické osoby. Identifikátor prehliadača sa po 90 dňoch obnoví; v D1 je iba jeho SHA-256 hash.
- **Platobný pokus vo funneli**: jedinečná existujúca Stripe Session pripravená serverom a priradená návšteve. Nie zadanie karty ani bankové potvrdenie; tieto kroky MVP nesľubuje.
- **Nákupy a tržby**: existujúce serverom overené platené transakcie podľa `payment_observations.paid_at`, prípadne pôvodného overeného `orders.paid_at`. Jedna Session s darčekom = jeden nákup a celá jej suma. Objednávky a herné prístupy sa agregujú samostatne, bez násobenia cez JOIN. Bezplatné objednávky sa nepočítajú ako platené nákupy. Historické platby bez návštevnej atribúcie sú v neznámom zdroji.
- **Tržby**: hrubé inkaso v EUR pred refundáciami, poplatkami a nákladmi. Refundovaná platba zostáva historickou platenou transakciou a je tiež vo výslovne označenom počte refundácií; nejde o čisté tržby.
- **Funnel, tabuľka zdrojov a konverzia**: kohorta podľa začiatku návštevy v období; neskoré platby tejto kohorty sa dopĺňajú do času aktualizácie. Konverzia = pripísané platené transakcie kohorty / namerané návštevy kohorty. KPI Nákupy a posledný stĺpec tabuľky používajú dátum úhrady, preto sa môžu líšiť od kohorty. Prechody medzi návštevami, prehliadačmi, pokusmi a transakciami majú odlišné jednotky a môžu presiahnuť 100 %.
- Filtre dátumov používajú kalendár Europe/Bratislava vrátane zmien letného času. Dnes/7/14/30 dní zahŕňajú aktuálny deň do času aktualizácie; vlastný rozsah má koncový deň vrátane, maximálne 366 dní. Produkt klasifikuje skutočný výber hry, kníh alebo kombinácie pri príprave platby. Produkt pri bežnej návšteve ešte nepoznáme, preto pri filtri produktu sú návštevy a konverzia nedostupné.
- Pred začiatkom zberu sa návštevy spätne nevytvárajú. Pri rozsahu obsahujúcom čas pred začiatkom zberu je konverzia nedostupná; počet nameraných návštev je viditeľne neúplný. Pred prvou prijatou udalosťou sú aj návštevné kohorty nedostupné, nie nulové.
- Technické chyby: počet existujúcich deduplikovaných signálov, samostatne počet priradených pokusov. Nie presný počet jednotlivých incidentov. Vylučujú sa samostatne vykázané chyby doručenia; existujúca retencia logov je 90 dní. Pri dlhšom rozsahu je celková metrika nedostupná a zobrazuje sa len počet zachovaných signálov.
- Problémy prístupu: počet dotknutých zaplatených alebo chýbajúcich očakávaných objednávok a samostatne počet platených transakcií s chýbajúcim očakávaným počtom objednávok po 2 minútach, chýbajúcim alebo zlyhaným záznamom e-mailu, prípadne čakaním nad 10 minút. Odovzdanie poskytovateľovi nie je dôkaz doručenia do schránky.

## UTM pred reklamou

Používať technické názvy kampaní (1–80 znakov: písmená bez diakritiky, čísla, bodka, pomlčka, podčiarkovník, medzera), nikdy e-maily alebo iné osobné údaje.

- Facebook reklama: `/?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch-2026`
- Instagram reklama: `/?utm_source=instagram&utm_medium=paid_social&utm_campaign=launch-2026`
- Influencer: `/?utm_source=influencer&utm_medium=influencer&utm_campaign=partner-01`

Facebook/Instagram bez plateného UTM média sa neoznačuje ako reklama. Meta ostáva samostatný explicitný UTM zdroj. Priame návštevy = bez UTM a bez referrera; iné neznáme zdroje sa neodhadujú. Organic používa explicitné médium `organic` alebo referrer známeho vyhľadávača. Atribúcia je prvý zdroj v konkrétnej návšteve, nie viacdňový reklamný atribučný model. `fbclid`, plné URL a referrery sa neukladajú.

## Súhlas a bezpečnosť

`marketing-consent.js` spravuje dobrovoľné povolenie/odmietnutie/odvolanie. Bez súhlasu sa neposiela analytická udalosť ani nevytvára analytický identifikátor. Rozhodnutie sa pamätá 180 dní. Súhlas a nastavenia sú pri päte predajnej stránky a checkoutu; neblokujú nákup a nemenia cenu ani platobný formulár. Nie sú vložené žiadne GA4, Clarity alebo Meta Pixel skripty.

Verejný POST `/api/marketing/event` má strict origin, limit veľkosti JSON, povolené typy, formát náhodných identifikátorov a rate limit cez existujúci mechanizmus. Ide o klientské analytické signály, nie overených ľudí. Neukladá IP, UA, osobné údaje, obsah polí ani údaje karty. IP slúži iba na existujúci zahashovaný limit s tajným serverovým kľúčom. Prepojenie návštevy a platby vyžaduje oba náhodné identifikátory a existujúci nákupný request key; opakovanie nemení prvú atribúciu. Výpadok atribúcie neblokuje checkout. Výpadok udalosti môže ponechať nákup nepriradený.

Čítanie reportu aj administrátorského JS vyžaduje existujúce prihlásenie. Zdrojová atribúcia a návštevy sa čistia po 366 dňoch existujúcim cron procesom. Obchodné záznamy sa nemažú. Uchované nákupy môžu po uplynutí analytickej retencie stratiť zdroj; historická atribúcia sa neodhaduje.

## Dostupnosť a predreklamné kroky

Pri implementácii boli overené názvy environment a Codespaces secrets aj existujúce Worker secrets: nie je nakonfigurovaný autorizovaný zdroj Meta Ads. Reklamné náklady a CAC preto zostávajú **Nedostupné**. MVP netvrdí automatický import ani nevytvára odhady. Existujúce snapshoty výberu sa používajú pre počty knižných doplnkov, druhých hier a Atlasov pri vytvorení platby (unikátne pokusy podľa dátumu vytvorenia). Nejde o meranie zobrazení, kliknutí alebo zmien výberu. Nezávislý počet všetkých návštev pre výpočet pokrytia nie je dostupný.

Pred reklamou 18. 11. 2026:

1. Zjednotiť UTM odkazy pre každú reklamu a influencer kampaň.
2. Overiť prijatie návštevy a checkoutu so súhlasom, odmietnutie a odvolanie na cieľových zariadeniach. Produkčné skúšobné návštevy patria do reálnych dát; nepoužívať vymyslené návštevy alebo nákupy.
3. Vybrať rozsah po začiatku zberu pre porovnateľnú konverziu; rozhodovať podľa dostatočného objemu, nie ilustračných čísel.
4. Pre CAC doplniť autorizovaný Meta Ads zdroj alebo samostatne zadané skutočné denné výdavky podľa kampane. Bez toho vyhodnocovať len návštevnosť a nákupy.
5. Dokončiť existujúce P0 overenie podrobných platobných krokov z `MD/P0-monitorovanie-platobneho-funnelu.md`; toto marketingové MVP ho nenahrádza.

Kontroly: backendové testy vrátane SQL kohorty/darčekov/refundácií/oneskorených úhrad, origin a autentifikácie; prehliadačové testy reálneho report API nad lokálnou D1, súhlasu a atribúcie, filtrov a rozloženia 320–1512 px; regresie existujúceho checkoutu a administrácie. Aktualizácia prehľadu je manuálna a po 5 minútach sa zobrazí upozornenie na starý snapshot.

WebKit v tomto kontajneri vyžaduje virtuálne grafické prostredie: `xvfb-run -a env QA_BROWSER=webkit QA_HEADED=1 PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/marketing-dashboard.test.cjs`. Samotný headless WebKit tu padá aj na minimálnom natívnom formulárovom poli. Overenie cez Xvfb prešlo; fyzický iPhone nebol použitý.
