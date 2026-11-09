# Predajný funnel – MVP

Záložka: https://pixelkovia.rodulab.com/admin#marketing. Rovnaké prihlásenie, Worker `treasurequest-admin` a produkčná D1; žiadna externá analytická databáza.

## Používanie prehľadu

Kompaktný prehľad zobrazuje jeden súhrnný riadok (návštevy, checkout, platobné pokusy, nákupy a konverzia návštev), všetky zdroje návštevnosti a obchodný aj prevádzkový súhrn. Kliknutie alebo Enter na KPI a súhrnnej metrike rozbalí pôvodnú definíciu; metodika, dostupnosť a diagnostika sú v samostatných rozbaľovacích sekciách. Stav rozbalenia, triedenie a zobrazenie zdrojov sa zachovajú počas obnovy a zmeny filtrov v aktuálnej návšteve administrácie.

Obdobie je v hornej lište, ďalšie filtre pod tlačidlom **Filtre**; aktívny filter možno odobrať samostatne alebo resetovať na predvolených 14 dní. Vlastný rozsah otvorí dátumové polia. Tabuľka triedi iba existujúce hodnoty, chýbajúce hodnoty nezamieňa za nuly a zdroje nespája. Všetky kategórie zdrojov sú zobrazené stále, bez zbalenia na top 5; **Úhrady v období** pridá samostatný stĺpec s dátumom platby. Na mobile sa zdroje skladajú do čitateľných blokov. Report obsahuje aj `periodMetrics`: návštevy podľa začiatku relácie, checkout podľa prvého otvorenia v období, všetky vytvorené Stripe relácie a overené platené aj bezplatné nákupy podľa dátumu úhrady. Pôvodné kohortové metriky zostávajú dostupné pre atribúciu a konverziu. Zber, súhlas a Meta Pixel sa nemenia.

## Údaje a metodika

- **Návštevy**: prvostranné udalosti z `/` a `/checkout`, iba po explicitnom analytickom súhlase. Staršie záznamy pred zavedením panela vznikali bez tejto podmienky. Náhodné identifikátory zostávajú iba v `sessionStorage` aktuálnej karty; po 30 minútach medzi otvoreniami stránky sa obnovia. Refresh a prechod na checkout návštevu nezdvojujú; nová karta môže vytvoriť samostatnú reláciu. Celkový počet návštev bez JS, s blokovačom alebo nedostupným úložiskom nepoznáme.
- **Checkout**: unikátne identifikátory relácií s prvým otvorením checkoutu v období, aj keď návšteva začala skôr; nie fyzické osoby. V D1 je iba SHA-256 hash náhodného druhého identifikátora. Zachované staršie záznamy používali dlhodobý identifikátor prehliadača; zmena metodiky aj prestávka v meraní sú uvedené v prehľade.
- **Platobný pokus vo funneli**: jedinečná existujúca Stripe Session pripravená serverom v zvolenom období, aj bez návštevnej atribúcie. V podrobnostiach je samostatne počet pokusov priradených návštevnej kohorte. Nie zadanie karty ani bankové potvrdenie; tieto kroky MVP nesľubuje.
- **Nákupy a tržby**: existujúce serverom overené platené transakcie podľa `payment_observations.paid_at`, prípadne pôvodného overeného `orders.paid_at`. Jedna Session s darčekom = jeden nákup a celá jej suma. Objednávky a herné prístupy sa agregujú samostatne, bez násobenia cez JOIN. Bezplatné objednávky sa nepočítajú ako platené nákupy. Historické platby bez návštevnej atribúcie sú v neznámom zdroji.
- **Tržby**: hrubé inkaso v EUR pred refundáciami, poplatkami a nákladmi. Refundovaná platba zostáva historickou platenou transakciou a je tiež vo výslovne označenom počte refundácií; nejde o čisté tržby.
- **Konverzia návštev a tabuľka zdrojov**: kohorta podľa začiatku návštevy v období; neskoré platby tejto kohorty sa dopĺňajú do času aktualizácie. Konverzia = pripísané platené transakcie kohorty / namerané návštevy kohorty. KPI Nákupy a posledný stĺpec tabuľky používajú dátum úhrady, preto sa môžu líšiť od kohorty. Hlavný prehľad neopakuje kohortu v druhom riadku. Keďže kalendárne počty netvoria uzavretú cestu, neuvádza medzi nimi percentá odchodu. Konverzia zostáva pomerom pripísaných nákupov a nameraných návštev kohorty; môže presiahnuť 100 %.
- Filtre dátumov používajú kalendár Europe/Bratislava vrátane zmien letného času. Dnes/7/14/30 dní zahŕňajú aktuálny deň do času aktualizácie; vlastný rozsah má koncový deň vrátane, maximálne 366 dní. Produkt klasifikuje skutočný výber hry, kníh alebo kombinácie pri príprave platby. Produkt pri bežnej návšteve ešte nepoznáme, preto pri filtri produktu sú návštevy a konverzia nedostupné.
- Pred začiatkom zberu sa návštevy spätne nevytvárajú. Pri rozsahu obsahujúcom čas pred začiatkom zberu sa návštevy, návštevný funnel a konverzia počítajú iba od neskoršieho z dátumov začiatku filtra a začiatku zberu. Dashboard výslovne uvádza tento kratší interval pri KPI, funneli aj tabuľke. Nákupy a tržby naďalej používajú celé filtrované obdobie; historické nepriradené platby sa do konverzie nepridávajú. Celé obdobie pred zberom zostáva nedostupné. Pred prvou prijatou udalosťou sú aj návštevné kohorty nedostupné, nie nulové.
- Technické chyby: počet existujúcich deduplikovaných signálov, samostatne počet priradených pokusov. Nie presný počet jednotlivých incidentov. Vylučujú sa samostatne vykázané chyby doručenia; existujúca retencia logov je 90 dní. Pri dlhšom rozsahu je celková metrika nedostupná a zobrazuje sa len počet zachovaných signálov.
- Problémy prístupu: počet dotknutých zaplatených alebo chýbajúcich očakávaných objednávok a samostatne počet platených transakcií s chýbajúcim očakávaným počtom objednávok po 2 minútach, chýbajúcim alebo zlyhaným záznamom e-mailu, prípadne čakaním nad 10 minút. Odovzdanie poskytovateľovi nie je dôkaz doručenia do schránky.

## UTM pred reklamou

Používať technické názvy kampaní (1–80 znakov: písmená bez diakritiky, čísla, bodka, pomlčka, podčiarkovník, medzera), nikdy e-maily alebo iné osobné údaje.

- Facebook reklama: `/?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch-2026`
- Instagram reklama: `/?utm_source=instagram&utm_medium=paid_social&utm_campaign=launch-2026`
- Influencer: `/?utm_source=influencer&utm_medium=influencer&utm_campaign=partner-01`

Facebook/Instagram bez plateného UTM média sa neoznačuje ako reklama. Meta ostáva samostatný explicitný UTM zdroj. Priame návštevy = bez UTM a bez referrera; iné neznáme zdroje sa neodhadujú. Organic používa explicitné médium `organic` alebo referrer známeho vyhľadávača. Atribúcia je prvý zdroj v konkrétnej návšteve, nie viacdňový reklamný atribučný model. `fbclid`, plné URL a referrery sa neukladajú.

## Súhlas a bezpečnosť

Od verzie súhlasu `2026-11-09` sa nepovinná analytika aj marketing štandardne nespúšťajú. Panel ponúka rovnako dostupné prijatie a odmietnutie, samostatné voľby **Analytika návštev** a **Marketing · Meta Pixel** a opätovné otvorenie cez **Nastavenia súkromia** v pätičke. Odmietnutie neblokuje nákup ani hru. Platby, doručenie prístupu a nevyhnutná obnova objednávky fungujú nezávisle.

Voľbu potvrdzuje `/api/privacy/consent`. D1 uchováva iba hash náhodného tokenu, verziu, príznaky účelov a časy. Opaque cookie `__Host-pixelkovia-consent` má `HttpOnly`, `Secure`, `SameSite=Lax`, cestu `/` a platnosť 180 dní. Zmena voľby zruší predchádzajúci záznam; odvolanie sa prenesie aj do iných otvorených kariet. Cron odstráni doklady najneskôr 180 dní po skončení platnosti. Pri chybe API, chýbajúcej cookie, vypršaní alebo zablokovanom úložisku sa meranie nespustí. Server zamietne aj starého klienta bez príslušného súhlasu. `MARKETING_COLLECTION_ENABLED` zostáva nezávislý vypínač vlastnej analytiky.

Prijatie marketingu samo osebe nepovoľuje vlastnú analytiku a naopak. Historické návštevy sa neprepisujú na údaj so súhlasom. GA4 ani Clarity nie sú vložené.

### Meta Pixel a nákup

Pixel ID: `1120983200688486` (verejné ID, nie tajný token), potvrdené inštalačným kódom vytvoreného datasetu Pixelkovia – web. Reklamný účet má samostatné ID `1141555698571585`; nepoužíva sa pri inicializácii Pixelu. Po marketingovom súhlase sa na predajnej stránke a checkoute odošlú `PageView`, pri otvorení checkoutu `InitiateCheckout` a pri potvrdenej platenej transakcii `Purchase`. Hra, herné výsledky a administrácia marketingový skript nenačítavajú. Automatická konfigurácia Pixelu je vypnutá; neposielame automatické rozšírené párovanie, e-mail, heslo ani údaje platobných polí.

Meta SDK beží iba v skrytom dokumente `/assets/meta-pixel` bez query parametrov a s prázdnym referrerom. Rodičovská stránka posiela iba povolenú cestu `/` alebo `/checkout` a overené parametre udalosti. Platobné `session_id`, `client_secret`, ľubovoľné URL parametre ani obsah formulára nevstupujú do našich Meta payloadov. Pri skutočnom reklamnom `fbclid` sa až po súhlase môže vytvoriť `_fbc`; click ID nikdy nevymýšľame. Odvolanie súhlasu zruší rámec a odstráni hostiteľské `_fbp` a `_fbc`.

`POST /api/marketing/purchase` vyžaduje aktuálny marketingový súhlas udelený pred vytvorením pokusu. Server opätovne overí Session existujúcim Stripe mechanizmom a použije vlastnú sumu v EUR. D1 `meta_pixel_purchases` atómovo povolí jeden browserový event na pokus, aj pri dvoch súbežných kartách a opakovanom overení. `eventID` je stabilné `purchase-<attempt UUID>`. Darčekové dve objednávky tvoria jednu platbu s celou sumou. Nezaplatené, bezplatné, refundované, neznáme ani historické objednávky bez vtedajšieho súhlasu sa neodosielajú. Meranie nevytvára objednávky ani prístupy.

Nákup sa hlási až po načítaní Pixelu; pri zablokovanom SDK sa claim nevytvorí. Ide o browserový Pixel: bez návratu zákazníka, pri blokovaní reklamy alebo strate siete po pridelení udalosti môže konverzia chýbať. Atómový claim bráni opakovaniu, nie je potvrdením doručenia spoločnosti Meta. Conversions API nie je nakonfigurované a nepredstiera sa serverové doručenie. Nadviazanie CAPI si vyžiada príslušný serverový token a spoločné `event_id`; token nesmie byť vo frontende. Prijatie udalostí do správneho datasetu sa overuje v Meta Events Manageri cez Test events.

POST `/api/marketing/event` má strict origin, limit veľkosti JSON, povolené typy, režim relácie, formát náhodných identifikátorov a rate limit cez existujúci mechanizmus. Ide o klientské analytické signály, nie overených ľudí. Neukladá IP, UA, osobné údaje, obsah polí ani údaje karty. IP slúži iba na existujúci zahashovaný limit s tajným serverovým kľúčom. Prepojenie návštevy a platby vyžaduje aktuálny analytický súhlas, oba náhodné identifikátory a existujúci nákupný request key; opakovanie nemení prvú atribúciu. Výpadok atribúcie neblokuje checkout. Výpadok udalosti môže ponechať nákup nepriradený. Počas dočasného vypnutia zberu sa návštevy nemerali a chýbajúce udalosti sa spätne nedopĺňajú.

Čítanie reportu aj administrátorského JS vyžaduje existujúce prihlásenie. Zdrojová atribúcia a návštevy sa čistia po 366 dňoch existujúcim cron procesom. Obchodné záznamy sa nemažú. Uchované nákupy môžu po uplynutí analytickej retencie stratiť zdroj; historická atribúcia sa neodhaduje.

## Dostupnosť a predreklamné kroky

Pri implementácii boli overené názvy environment a Codespaces secrets aj existujúce Worker secrets: nie je nakonfigurovaný autorizovaný zdroj Meta Ads. Reklamné náklady a CAC preto zostávajú **Nedostupné**. MVP netvrdí automatický import ani nevytvára odhady. Existujúce snapshoty výberu sa používajú pre počty knižných doplnkov, druhých hier a Atlasov pri vytvorení platby (unikátne pokusy podľa dátumu vytvorenia). Nejde o meranie zobrazení, kliknutí alebo zmien výberu. Nezávislý počet všetkých návštev pre výpočet pokrytia nie je dostupný.

Pred reklamou 18. 11. 2026:

1. Zjednotiť UTM odkazy pre každú reklamu a influencer kampaň.
2. Overiť meranie návštevy → checkout na cieľových zariadeniach pri prijatí aj odmietnutí súhlasu. Produkčné skúšobné návštevy patria do reálnych dát; nepoužívať vymyslené návštevy alebo nákupy.
3. Pri porovnávaní rešpektovať skutočný uvedený interval merania konverzie; rozhodovať podľa dostatočného objemu, nie ilustračných čísel.
4. Pre CAC doplniť autorizovaný Meta Ads zdroj alebo samostatne zadané skutočné denné výdavky podľa kampane. Bez toho vyhodnocovať len návštevnosť a nákupy.
5. Dokončiť existujúce P0 overenie podrobných platobných krokov z `MD/P0-monitorovanie-platobneho-funnelu.md`; toto marketingové MVP ho nenahrádza.

Kontroly: backendové testy vrátane SQL kohorty/darčekov/refundácií/oneskorených úhrad, origin a autentifikácie; prehliadačové testy reálneho report API nad lokálnou D1, zberu po explicitnom súhlase, odvolania, krátkych relácií a atribúcie, filtrov a rozloženia 320–1512 px; regresie existujúceho checkoutu a administrácie. Aktualizácia prehľadu je manuálna a po 5 minútach sa zobrazí upozornenie na starý snapshot.

WebKit v tomto kontajneri vyžaduje virtuálne grafické prostredie: `xvfb-run -a env QA_BROWSER=webkit QA_HEADED=1 PLAYWRIGHT_MODULE=/cesta/k/playwright node tests/marketing-dashboard.test.cjs`. Samotný headless WebKit tu padá aj na minimálnom natívnom formulárovom poli. Overenie cez Xvfb prešlo; fyzický iPhone nebol použitý.

Súhlas a Pixel: `node --test admin/tests/privacy-meta.test.mjs`, prehliadačový `tests/meta-consent.test.cjs`, regresie predajnej stránky, checkoutu a marketingového dashboardu.
