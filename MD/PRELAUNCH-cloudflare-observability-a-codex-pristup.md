# Pred ostrým spustením – Cloudflare Observability a oprávnenia Codexu

**Stav:** TODO – povinná predprodukčná kontrola, nie potvrdené dokončenie.
**Vlastník:** WEB & BUSINESS / Codex. Schválenie nastavení a prípadných nákladov: MASTER DESIGNER.
**Termín:** Pred sprístupnením Pixelkovia platiacim zákazníkom.

## Prečo

Cloudflare oznámil od **1. decembra 2026** samostatné účtovanie Observability podľa objemu prijatých a uložených diagnostických dát. Pred verejným ostrým spustením potrebujeme potvrdiť, že logovanie Workers, traces a ďalších datasetov nevyvolá nečakané poplatky. Diagnostiku platieb a e-mailov však nesmieme oslabiť bez náhrady.

## Kontrolný zoznam

- [ ] Zistiť aktuálny plán Workers a Observability na účte projektu a skutočný objem ingestovaných/uložených logov.
- [ ] Porovnať spotrebu s aktuálnymi oficiálnymi cenami a limitmi; odhadnúť mesačné náklady pri MVP a zvýšenej návštevnosti.
- [ ] Skontrolovať zapnuté datasety, sampling, retention, zdroje nadmerných logov a možnosti upozornení na spotrebu.
- [ ] Zachovať účinnú diagnostiku Stripe webhookov, Google Pay / Apple Pay callbackov, serverových chýb a automatického doručovania e-mailov.
- [ ] Overiť, že logy neobsahujú osobné heslá, API kľúče, access tokeny ani citlivé údaje z platieb.
- [ ] Preveriť súčasný Cloudflare API token používaný v Codespaces. Zistiť, ktoré **konkrétne oprávnenia na čítanie** oficiálne API vyžaduje pre Observability usage, logs a nastavenia.
- [ ] Uprednostniť samostatný, minimálne privilegovaný **read-only token pre diagnostiku** pred rozširovaním existujúceho deploy tokenu. Rozšírenie/zmena tokenu musí prejsť súhlasom vlastníka a byť uložená iba v Secrets, nikdy do repozitára ani chatu.
- [ ] Codex má cez podporované Cloudflare API overiť, že dokáže prečítať potrebné metriky. Ak API niečo neposkytuje, zdokumentovať manuálnu kontrolu v Dashboarde; nežiadať zbytočné write/billing scopes.
- [ ] Pripraviť krátku správu: nameraná spotreba, očakávané náklady, odporúčaný plán, sampling/retention a chýbajúce oprávnenia.
- [ ] **Nemeň** Observability predplatné, platené limity, DNS ani produkčné logovanie bez schválenia.

Zdroj e-mailu Cloudflare dodaný vlastníkom: Free plán 0,5 GB ingested za deň so 7-dňovou retenciou; Paid 50 GB ingestovaných dát a 10 GB-mesiac uloženia v cene, nad limit $0.25/GB ingest a $0.10/GB-month storage. Čísla znovu overiť v aktuálnej dokumentácii pred rozhodnutím.

Dashboard: https://dash.cloudflare.com/033ec39e1948bd5785d92d1993a8036f/observability/usage

**Pravidlo:** Toto je kontrolný bod pred launchom, nie pokyn automaticky aktivovať platené funkcie alebo rozširovať produkčné oprávnenia.
