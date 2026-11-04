# Pixelkovia – BACKLOG

> Centrálny zoznam otvorených úloh, nápadov a pripomienok. Stav je orientačný, nie potvrdenie implementácie. Codex vykonáva iba úlohy, ktoré mu výslovne zadáš.
>
> Podrobné technické zadania pre Codex zostávajú v `MD/`. Zmeny produktu alebo architektúry schvaľuje MASTER DESIGNER.

## P0 – Kritické pred ostrým spustením

- [ ] **Management – rozbehať a overiť kompletné monitorovanie priebehu platby pred platenou reklamou.** Vidieť počty otvorení formulára, začatého a dokončeného zadávania údajov, potvrdení, úspešných úhrad a zlyhaní aj odchody medzi krokmi. Nadviazať na existujúci prehľad platieb; najprv preskúmať, čo a ako spoľahlivo merať cez Stripe a server bez údajov karty, potom doplniť a otestovať meranie pre hru aj knihy. [Plán a kritériá dokončenia](../MD/P0-monitorovanie-platobneho-funnelu.md).

## P1 – Dokončiť / preveriť pred spustením

- [ ] **Facebook + Instagram – predreklamný obsah a dvojtýždňový rozbeh.** Pripraviť **14 príspevkov** so scenármi (poradie, formát, vizuál, text, CTA) a počas **minimálne 14 dní pred platenou reklamou** pravidelne publikovať. Obsah má ukazovať jednu skutočnú hru Pixelkovia – Stratený signál: ako hra vyzerá a funguje doma, papierové úlohy, mobilné interakcie, postavy, prípravu, vek, trvanie, rodinný zážitok a ponuku. Vizuály typu **cover C** využiť na vysvetľujúci obsah a reklamy; **cover B** ponechať ako brandový Facebook cover (upraviť mobilné orezanie). Vychádzať z originálnych assetov a implementovaných funkcií. Cieľ = dôvera, predaj a merateľné výsledky, nie iba lajky. Scenáre schváliť pred publikovaním.
- [ ] **Rodičovská stránka – hodnotenie po dohraní hry.** Ukončenie cez „Koniec hry“, presmerovanie na portál a dobrovoľné hviezdičky s komentárom sú implementované. Oprava z 2. 11. 2026 povoľuje ukončenie aj pri chýbajúcom zázname úlohy, zachováva skutočné počty a umožňuje opakovať neúspešné ukončenie; overenie je v `tests/finale-recovery.test.cjs`. Knižnica je dostupná aj bez hodnotenia. **Zostáva** spracovanie recenzií pred zverejnením a prepojenie na verejné hodnotenie; preto celá položka zostáva otvorená.
- [ ] **Po hodnotení – zvýrazniť knižnicu v rodičovskom portáli.** Po odoslaní alebo preskočení hodnotenia prehľadne zobraziť dostupné zakúpené knižky na čítanie a ponuku dokúpenia nezakúpených. Nezablokovať prístup ku knižnici, ak rodič hodnotenie nechce vyplniť.
- [ ] **Cloudflare Observability – kontrola spotreby a ceny.** Pred ostrým spustením preveriť logy, traces, sampling, retenciu, plán a možné poplatky od 1. 12. 2026. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Cloudflare API prístup pre Codex.** Overiť, či vie Codex čítať Observability metriky; podľa potreby zriadiť samostatný read-only token s minimálnymi oprávneniami. Žiadna zmena billing nastavení bez schválenia. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Mobilné UX a knižky – záverečné testovanie.** Na mobiloch overiť nákup knižiek, zobrazenie v rodičovskom portáli, čitateľnosť a priechodnosť celej cesty.

- [ ] **Pred spustením nasadiť analytiku: Google Analytics 4, Microsoft Clarity a Meta Pixel.** Merať návštevy a zdroje návštevnosti, kroky nákupného funnelu, výber doplnkov, spustenie a výsledok platby, odchody a základné UX správanie. Nastaviť správne eventy, UTM, testovacie konverzie a ochranu pred duplicitným počítaním nákupov. Zabezpečiť GDPR/ePrivacy súhlas pred spustením nepovinných analytických a marketingových skriptov, nezbierať heslá ani citlivé platobné údaje a pri Clarity maskovať osobné údaje. Overiť fungovanie na mobile aj desktope. **P1 – pred ostrým spustením.**

## P2 – Nápady na posúdenie (nie schválené na implementáciu)

- [ ] **RoduLab – jednoduchý zastrešujúci web (po PoC).** Potvrdený názov **RoduLab** (bez „s“) a doména **rodulab.com**. Neskôr pripraviť stručnú dôveryhodnú stránku interaktívneho/digitálneho štúdia: kto sme, čo robíme, kontakt a krátke prezentácie projektov **Pixelkovia, BTS Radar a Living Stones (kamienky)**. Pri každom uviesť len overené skutočnosti a pravdivý stav (hotový projekt vs. experiment); bez fiktívnych klientov, referencií alebo tvrdenia o registrovanej firme. Teraz nie je prioritou – najskôr predaj Pixelkovie.
- [ ] **Možnosť „bumoferu“ – preskúmať, či to chceme.** Pracovný názov podľa poznámky; najprv upresniť význam, prínos pre hráča, náročnosť a rozhodnúť áno/nie. Bez automatickej implementácie.
- [ ] **Vianočný darčekový nákup / darčekový poukaz.** Preskúmať jednoduché darovanie hry ako vianočného darčeka, prípadne nadväznosť na druhú licenciu.
- [ ] **Zber a využitie spätnej väzby.** Po nazbieraní skutočných recenzií vyhodnotiť opakujúce sa pripomienky a použiť ich pri zlepšovaní prvej hry.

---

**Pravidlá backlogu:** Pridávame stručný názov a jednu až dve vety. Po overení funkčnosti hotovú položku odstránime; v backlogu zostávajú iba otvorené veci. Podrobné realizačné zadania vytvárať osobitne v `MD/`. Nový nápad nie je automaticky schválenou funkcionalitou.
