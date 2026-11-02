# Pixelkovia – BACKLOG

> Centrálny zoznam otvorených úloh, nápadov a pripomienok. Stav je orientačný, nie potvrdenie implementácie. Codex vykonáva iba úlohy, ktoré mu výslovne zadáš.
>
> Podrobné technické zadania pre Codex zostávajú v `MD/`. Zmeny produktu alebo architektúry schvaľuje MASTER DESIGNER.

## P0 – Kritické pred ostrým spustením

- [ ] **Management – rozbehať a overiť kompletné monitorovanie priebehu platby pred platenou reklamou.** Vidieť počty otvorení formulára, začatého a dokončeného zadávania údajov, potvrdení, úspešných úhrad a zlyhaní aj odchody medzi krokmi. Nadviazať na existujúci prehľad platieb; najprv preskúmať, čo a ako spoľahlivo merať cez Stripe a server bez údajov karty, potom doplniť a otestovať meranie pre hru aj knihy. [Plán a kritériá dokončenia](../MD/P0-monitorovanie-platobneho-funnelu.md).
- [ ] **Google Pay – overiť reálnu platbu po oprave inline formulára.** Pôvodný inline formulár a natívny callback sú opravené; zachovanie elementov, návrat callbacku pred pollingom a ochrana pred dvojitou úhradou prešli automatizovanými testami. Odstránená je chybná závislosť od nepodporovaného `click` callbacku, ktorá po odtlačku odmietala autorizáciu. Zatvorenie hárku po autorizácii neruší rozbehnuté potvrdenie; výslovná obnova po čakaní vytvorí nový formulár až po overenom uzavretí nezaplatenej relácie. Zostáva potvrdiť natívnu platbu, čas odozvy, zrušenie a následnú kartu na podporovanom fyzickom zariadení. [Detailné zadanie](../MD/P0-google-pay-timeout-apple-pay-audit.md).
- [ ] **Apple Pay – reálny test na Apple zariadení.** Pôvodný inline Express Checkout je opravený, metóda je dostupná v používanej konfigurácii Stripe. Overiť natívny platobný hárok a výsledok na skutočnom iPhone/Safari; automatizované testy obnovy sú hotové. [Detailné zadanie](../MD/P0-google-pay-timeout-apple-pay-audit.md).
- [ ] **Kompletný E2E test nákupu.** Preveriť checkout, doplnky, súčet, Stripe webhook, pridelenie prístupov, odoslanie e-mailu, rodičovskú stránku a zabránenie duplicitnému nákupu. Ostré platby nerobiť bez schválenia.

## P1 – Dokončiť / preveriť pred spustením

- [x] **Checkout – zjednodušiť a vyladiť platobný tok.** Podľa upresnenia vlastníka sú pôvodný vzhľad, rozbalenie aj integrované polia Stripe obnovené v jednom zelenom paneli. Výrazné chyby, obnova a návrat prešli kontrolami na mobilných šírkach aj desktope; fyzické peňaženky zostávajú vyššie na overenie.
- [x] **Skutočné recenzie namiesto ukážkových.** Desať ilustračných textov nahradilo päť recenzií dodaných vlastníkom 2. 11. 2026: Lucia, Adam K., Jana, Zuzana a Martin, všetci 5/5. Znenie zachováva dodané texty; galéria uvádza mená a skutočný počet piatich hodnotení.
- [ ] **Rodičovská stránka – hodnotenie po dohraní hry.** Ukončenie cez „Koniec hry“, presmerovanie na portál a dobrovoľné hviezdičky s komentárom sú implementované. Oprava z 2. 11. 2026 povoľuje ukončenie aj pri chýbajúcom zázname úlohy, zachováva skutočné počty a umožňuje opakovať neúspešné ukončenie; overenie je v `tests/finale-recovery.test.cjs`. Knižnica je dostupná aj bez hodnotenia. **Zostáva** spracovanie recenzií pred zverejnením a prepojenie na verejné hodnotenie; preto celá položka zostáva otvorená.
- [ ] **Po hodnotení – zvýrazniť knižnicu v rodičovskom portáli.** Po odoslaní alebo preskočení hodnotenia prehľadne zobraziť dostupné zakúpené knižky na čítanie a ponuku dokúpenia nezakúpených. Nezablokovať prístup ku knižnici, ak rodič hodnotenie nechce vyplniť.
- [ ] **Cloudflare Observability – kontrola spotreby a ceny.** Pred ostrým spustením preveriť logy, traces, sampling, retenciu, plán a možné poplatky od 1. 12. 2026. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Cloudflare API prístup pre Codex.** Overiť, či vie Codex čítať Observability metriky; podľa potreby zriadiť samostatný read-only token s minimálnymi oprávneniami. Žiadna zmena billing nastavení bez schválenia. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Mobilné UX a knižky – záverečné testovanie.** Na mobiloch overiť nákup knižiek, zobrazenie v rodičovskom portáli, čitateľnosť a priechodnosť celej cesty.

- [ ] **Pred spustením nasadiť analytiku: Google Analytics 4, Microsoft Clarity a Meta Pixel.** Merať návštevy a zdroje návštevnosti, kroky nákupného funnelu, výber doplnkov, spustenie a výsledok platby, odchody a základné UX správanie. Nastaviť správne eventy, UTM, testovacie konverzie a ochranu pred duplicitným počítaním nákupov. Zabezpečiť GDPR/ePrivacy súhlas pred spustením nepovinných analytických a marketingových skriptov, nezbierať heslá ani citlivé platobné údaje a pri Clarity maskovať osobné údaje. Overiť fungovanie na mobile aj desktope. **P1 – pred ostrým spustením.**

## P2 – Nápady na posúdenie (nie schválené na implementáciu)

- [ ] **Možnosť „bumoferu“ – preskúmať, či to chceme.** Pracovný názov podľa poznámky; najprv upresniť význam, prínos pre hráča, náročnosť a rozhodnúť áno/nie. Bez automatickej implementácie.
- [ ] **Vianočný darčekový nákup / darčekový poukaz.** Preskúmať jednoduché darovanie hry ako vianočného darčeka, prípadne nadväznosť na druhú licenciu.
- [ ] **Zber a využitie spätnej väzby.** Po nazbieraní skutočných recenzií vyhodnotiť opakujúce sa pripomienky a použiť ich pri zlepšovaní prvej hry.

## Hotové / referenčné (stav treba priebežne overovať)

- [x] **Stripe účet Pixelkovia a checkout – základná integrácia.** Platby boli v produkcii úspešne spracované; chyby mobilných peňaženiek zostávajú otvorené vyššie.
- [x] **Pripravený koncept knižného upsellu a druhej licencie.** Samotnú kvalitu a produkčné správanie treba potvrdiť v E2E testoch.

---

**Pravidlá backlogu:** Pridávame stručný názov a jednu až dve vety. Zaškrtnúť až po overení funkčnosti. Podrobné realizačné zadania vytvárať osobitne v `MD/`. Nový nápad nie je automaticky schválenou funkcionalitou.
