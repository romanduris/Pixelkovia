# P0 – monitorovanie celého priebehu platby v managemente

**Stav:** Otvorené – najprv preskúmať možnosti merania, potom doplniť a overiť implementáciu. Tento plán nepotvrdzuje hotový nákupný funnel.
**Priorita:** Povinné pred spustením platenej reklamy a privádzaním platiacich zákazníkov.
**Požiadavka vlastníka:** V managemente vidieť, koľkokrát zákazníci otvorili platbu, zadávali údaje a koľko platieb prešlo alebo zlyhalo. Musí byť zrejmé, v ktorom kroku nákupy strácame.

## Východiskový stav

Existuje sekcia [Platby a chyby](https://pixelkovia.rodulab.com/admin#payments), serverové overovanie úhrad, podpísané Stripe udalosti a základné diagnostické záznamy. To samo osebe nepotvrdzuje kompletné meranie otvorenia formulára a zadávania údajov. Existujúce zoskupovanie rovnakých chybových signálov nie je presný počet jednotlivých pokusov o platbu.

Nadviazať na spoločný checkout hry, samostatných kníh aj dokúpenia kníh z rodičovského portálu. Zachovať pôvodný vložený formulár, jeho vzhľad a rozbaľovanie.

## 1. Preskúmať a navrhnúť meranie

- [ ] Prejsť aktuálne udalosti Stripe Checkout/Payment Element/Express Checkout, backend a už nasadené logovanie. V oficiálnej dokumentácii a skutočnom SDK overiť, čo možno spoľahlivo pozorovať pri karte, Apple Pay a Google Pay.
- [ ] Pre každý krok spísať presnú definíciu, zdroj udalosti, okamih zaznamenania, identifikátor pre deduplikáciu a známe obmedzenia. Rozlišovať klientské hlásenie od serverom overeného výsledku.
- [ ] Osobitne overiť možnosti bezpečného rozlíšenia „začal zadávať údaje“ a „polia sú kompletné“. Nesľubovať tieto metriky bez potvrdenia dostupných udalostí v používanom SDK; kliknutie na tlačidlo ani vytvorenie Stripe Session ich nenahrádza.
- [ ] Navrhnúť prehľad v managemente s počtami krokov, úspešnosťou, odchodmi a detailom zlyhaní. Neodvodzovať technickú poruchu iba z nedokončeného nákupu.

## 2. Požadované kroky a výsledky

| Krok / výsledok | Čo musí byť viditeľné a overené |
| --- | --- |
| Otvorenie platby | Počet otvorení zákazníckeho formulára a počet unikátnych nákupných pokusov. Oddeliť návštevu `/checkout`, vytvorenie Stripe Session a skutočné načítanie platobných polí. |
| Začiatok zadávania | Koľko pokusov dosiahlo preukázateľnú interakciu s platobnými poľami, ak to SDK umožňuje; bez čítania ich obsahu. |
| Kompletné údaje | Koľkokrát SDK oznámilo kompletnosť požadovaných polí. Kompletnosť údajov nie je schválenie bankou. |
| Potvrdenie platby | Počet unikátnych nákupov s potvrdením aj celkový počet pokusov vrátane opakovaní po zamietnutí. Pri peňaženkách samostatne dostupnosť, otvorenie, potvrdenie a zrušenie, pokiaľ ich SDK spoľahlivo poskytuje. |
| Úspešná úhrada | Výhradne serverom overené zaplatenie; prehliadač nesmie nákup sám označiť ako zaplatený. |
| Neúspešný pokus | Rozlíšenie chyby polí, zamietnutia bankou, technickej chyby formulára/servera/spojenia a problému potvrdenia alebo 3-D Secure, podľa dostupných overených signálov. |
| Čakajúci / neznámy výsledok | Viditeľné samostatne, vrátane následného neskorého potvrdenia. Timeout sám osebe nie je definitívne zlyhanie. |
| Odchod / vypršanie | Nedokončený krok, zatvorená peňaženka a expirovaná relácia oddelene od technického zlyhania. |
| Doručenie po úhrade | Potvrdená platba → vytvorený prístup → prístupový e-mail odovzdaný na odoslanie; zviditeľniť zdržanie alebo chybu po úspešnej úhrade. |

## 3. Počítanie a zobrazenie

- [ ] Stanoviť rozdiel medzi počtom udalostí, unikátnymi nákupnými pokusmi a pokusmi o potvrdenie tej istej platby. Refresh, dvojklik, súbežné karty, opakovaný webhook a obnova relácie nesmú nafukovať unikátne nákupy.
- [ ] Nový samostatný nákup počítať samostatne aj pri rovnakom e-maile. Úhrada hry s darčekom je jedna platba, hoci vytvorí dva prístupy. Objednávky zdarma a refundácie vykazovať osobitne.
- [ ] Umožniť prehľad podľa obdobia, produktu a platobnej metódy podľa dostupných dát. Pri konverzii presne definovať základ počtu a kohortu; platbu dokončenú po konci sledovaného obdobia nestratiť ani nezapočítať nesprávne.
- [ ] Viditeľne uviesť čerstvosť, začiatok zbierania dát a obmedzenia merania. Zistiť vplyv blokovania skriptov a straty internetu; chýbajúca klientská udalosť neznamená preukázaný odchod.
- [ ] Overiť kapacitu a pokrytie serverového auditu pri návštevnosti z reklamy, jeho dávkovanie, retenciu a náklady. Pri probléme alebo neaktuálnych dátach musí byť v managemente výrazné upozornenie.

## 4. Bezpečnosť a overenie dokončenia

- [ ] Neukladať číslo karty, CVC, obsah polí Stripe, heslá, client secrets ani iné platobné tajomstvá. Zaznamenávať len nevyhnutné udalosti a bezpečné kategórie/kódy. Diagnostika nesmie spomaľovať ani blokovať platbu.
- [ ] Použiť jeden spoločný mechanizmus pre všetky predajné vstupy. Prehľad a detailné logy sprístupniť iba prihlásenému administrátorovi.
- [ ] Otestovať otvorenie bez zadávania, neúplné údaje, opravu údajov, úspech, zamietnutie a následný úspech, zrušenie peňaženky, pomalé potvrdenie/3-D Secure, výpadok internetu, neskorý webhook, refresh, dvojklik a expiráciu.
- [ ] Overiť kartu aj podporované peňaženky, hru aj knihy, mobil aj desktop. Reálne ostré úhrady robiť iba s výslovným schválením.
- [ ] Porovnať očakávané počty zo známych testovacích scenárov s managementom, databázou a Stripe. Zdokumentovať podporované a nemerateľné kroky; nedostupný signál neprezentovať ako nameranú hodnotu.
- [ ] Označiť backlog za hotový až po nasadení a preukázaní správnych počtov celého dohodnutého priebehu. Samotná existencia logov alebo obrazovky nestačí.

Toto zadanie je plán rozšírenia existujúceho interného monitorovania. Nadväzujúca marketingová analytika (GA4, Clarity, Meta Pixel) má vlastnú položku v backlogu.
