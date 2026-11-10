# Pixelkovia – BACKLOG

> Centrálny zoznam otvorených úloh, nápadov a pripomienok. Stav je orientačný, nie potvrdenie implementácie. Codex vykonáva iba úlohy, ktoré mu výslovne zadáš.
>
> Podrobné technické zadania pre Codex zostávajú v `MD/`. Zmeny produktu alebo architektúry schvaľuje MASTER DESIGNER.

## P1 – Dokončiť / preveriť pred spustením

- [ ] **Pripomenúť pri ďalšom otvorení projektu: dokončiť Meta Ads výdavky a overenie Purchase.** Pixel `1120983200688486` aj priradenie reklamného účtu `1141555698571585` sú potvrdené; Meta Test events prijal PageView a InitiateCheckout. Zostáva prístup na čítanie výdavkov, implementácia ich importu a výpočtu CAC a potvrdenie Purchase pri skutočnej overenej platbe. [Presný stav a zostávajúce kroky](../MD/DOKONCIT-meta-ads-a-purchase.md).
- [ ] **Facebook + Instagram – predreklamný obsah a dvojtýždňový rozbeh.** Pripraviť **14 príspevkov** so scenármi (poradie, formát, vizuál, text, CTA) a počas **minimálne 14 dní pred platenou reklamou** pravidelne publikovať. Obsah má ukazovať jednu skutočnú hru Pixelkovia – Stratený signál: ako hra vyzerá a funguje doma, papierové úlohy, mobilné interakcie, postavy, prípravu, vek, trvanie, rodinný zážitok a ponuku. Vizuály typu **cover C** využiť na vysvetľujúci obsah a reklamy; **cover B** ponechať ako brandový Facebook cover (upraviť mobilné orezanie). Vychádzať z originálnych assetov a implementovaných funkcií. Cieľ = dôvera, predaj a merateľné výsledky, nie iba lajky. Scenáre schváliť pred publikovaním.
- [ ] **Cloudflare Observability – kontrola spotreby a ceny.** Pred ostrým spustením preveriť logy, traces, sampling, retenciu, plán a možné poplatky od 1. 12. 2026. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Cloudflare API prístup pre Codex.** Overiť, či vie Codex čítať Observability metriky; podľa potreby zriadiť samostatný read-only token s minimálnymi oprávneniami. Žiadna zmena billing nastavení bez schválenia. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Mobilné UX a knižky – záverečné testovanie.** Na mobiloch overiť nákup knižiek, zobrazenie v rodičovskom portáli, čitateľnosť a priechodnosť celej cesty.

- [ ] **Marketingový funnel – príprava pred reklamou 18. 11. 2026.** MVP záložka Predajný funnel používa existujúcu D1 a overené platby. Nové návštevy a checkout sa merajú po analytickom súhlase, s krátkymi reláciami v sessionStorage. Denné grafy umožňujú samostatné anonymné rozlíšenie prehliadačov s identifikátorom do 90 dní; historické unikátne návštevy sa nedopočítavajú. Zostáva zjednotiť kampanové odkazy, overiť reálne prijímanie udalostí na cieľových zariadeniach a pre CAC doplniť autorizované skutočné reklamné výdavky; náklady a CAC sú zatiaľ výslovne nedostupné. Doplnky sa zobrazujú iba ako doložený výber pri príprave platby, bez tvrdení o kliknutiach. [Metodika a predreklamné kroky](../docs/marketing-funnel.md).


- [ ] **Pred spustením dokončiť analytiku.** Meta Pixel `1120983200688486` je pripravený so súhlasom a jedným browserovým Purchase na overenú platenú Session; PageView a InitiateCheckout sú potvrdené v Meta Test events. Zostáva potvrdiť prijatie Purchase a napojiť výdavky podľa [aktuálneho checklistu](../MD/DOKONCIT-meta-ads-a-purchase.md); CAPI nie je nakonfigurované. Google Analytics 4 a Microsoft Clarity nie sú nasadené. Merať návštevy a zdroje návštevnosti, kroky nákupného funnelu, výber doplnkov, spustenie a výsledok platby, odchody a základné UX správanie. Nastaviť správne eventy, UTM, testovacie konverzie a ochranu pred duplicitným počítaním nákupov. Zabezpečiť GDPR/ePrivacy súhlas pred spustením nepovinných analytických a marketingových skriptov, nezbierať heslá ani citlivé platobné údaje a pri Clarity maskovať osobné údaje. Overiť fungovanie na mobile aj desktope. **P1 – pred ostrým spustením.**

## P2 – Nápady na posúdenie (nie schválené na implementáciu)

- [ ] **RoduLab – jednoduchý zastrešujúci web (po PoC).** Potvrdený názov **RoduLab** (bez „s“) a doména **rodulab.com**. Neskôr pripraviť stručnú dôveryhodnú stránku interaktívneho/digitálneho štúdia: kto sme, čo robíme, kontakt a krátke prezentácie projektov **Pixelkovia, BTS Radar a Living Stones (kamienky)**. Pri každom uviesť len overené skutočnosti a pravdivý stav (hotový projekt vs. experiment); bez fiktívnych klientov, referencií alebo tvrdenia o registrovanej firme. Teraz nie je prioritou – najskôr predaj Pixelkovie.
- [ ] **Možnosť „bumoferu“ – preskúmať, či to chceme.** Pracovný názov podľa poznámky; najprv upresniť význam, prínos pre hráča, náročnosť a rozhodnúť áno/nie. Bez automatickej implementácie.
- [ ] **Vianočný darčekový nákup / darčekový poukaz.** Preskúmať jednoduché darovanie hry ako vianočného darčeka, prípadne nadväznosť na druhú licenciu.

---

**Pravidlá backlogu:** Pridávame stručný názov a jednu až dve vety. Po overení funkčnosti hotovú položku odstránime; v backlogu zostávajú iba otvorené veci. Podrobné realizačné zadania vytvárať osobitne v `MD/`. Nový nápad nie je automaticky schválenou funkcionalitou.
