# Pixelkovia – BACKLOG

> Centrálny zoznam otvorených úloh, nápadov a pripomienok. Stav je orientačný, nie potvrdenie implementácie. Codex vykonáva iba úlohy, ktoré mu výslovne zadáš.
>
> Podrobné technické zadania pre Codex zostávajú v `MD/`. Zmeny produktu alebo architektúry schvaľuje MASTER DESIGNER.

## P0 – Kritické pred ostrým spustením

- [ ] **Google Pay – odstrániť callback timeout po úspešnej platbe.** Dve reálne platby po 1 € boli úspešné, ale používateľ videl timeout a hrozilo opakované zaplatenie. Musí fungovať bezpečné potvrdenie, obnovenie stavu a ochrana proti dvojitej úhrade. [Detailné zadanie](../MD/P0-google-pay-timeout-apple-pay-audit.md).
- [ ] **Apple Pay – preventívny audit platobného toku.** Preveriť spoločný callback s Google Pay, doplniť simulované testy a pred verejným zapnutím naplánovať reálny test na Apple zariadení. [Detailné zadanie](../MD/P0-google-pay-timeout-apple-pay-audit.md).
- [ ] **Kompletný E2E test nákupu.** Preveriť checkout, doplnky, súčet, Stripe webhook, pridelenie prístupov, odoslanie e-mailu, rodičovskú stránku a zabránenie duplicitnému nákupu. Ostré platby nerobiť bez schválenia.

## P1 – Dokončiť / preveriť pred spustením

- [ ] **Checkout – zjednotiť súhrn a platobný formulár.** Jeden vizuálny panel, jediná hlavná platobná akcia, primerané opakovanie ceny a plná dostupná šírka na mobile. Zachovať bezpečné Stripe komponenty.
- [ ] **Skutočné recenzie namiesto ukážkových.** Upraviť prezentáciu hodnotení tak, aby zobrazovala iba autentické recenzie od reálnych hráčov. Nevytvárať fiktívne hodnotenia ani nezavádzať pri zatiaľ nízkom počte recenzií.
- [ ] **Rodičovská stránka – hodnotenie po dohraní hry.** Po ukončení posledného videa a kliknutí na tlačidlo typu „Koniec hry“ presmerovať hráča na rodičovskú stránku, kde sa zobrazí žiadosť o hodnotenie hviezdičkami a krátky komentár: čo sa najviac páčilo a čo sa nepáčilo / čo zlepšiť. Premyslieť jednoduchý UX, dobrovoľnosť hodnotenia a spracovanie recenzií pred publikovaním. Prepojenie s hviezdičkovým hodnotením zobrazeným vyššie na stránke; verejne zobrazovať iba skutočné, prípadne moderované hodnotenia.
- [ ] **Po hodnotení – zvýrazniť knižnicu v rodičovskom portáli.** Po odoslaní alebo preskočení hodnotenia prehľadne zobraziť dostupné zakúpené knižky na čítanie a ponuku dokúpenia nezakúpených. Nezablokovať prístup ku knižnici, ak rodič hodnotenie nechce vyplniť.
- [ ] **Cloudflare Observability – kontrola spotreby a ceny.** Pred ostrým spustením preveriť logy, traces, sampling, retenciu, plán a možné poplatky od 1. 12. 2026. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Cloudflare API prístup pre Codex.** Overiť, či vie Codex čítať Observability metriky; podľa potreby zriadiť samostatný read-only token s minimálnymi oprávneniami. Žiadna zmena billing nastavení bez schválenia. [Detailné zadanie](../MD/PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- [ ] **Mobilné UX a knižky – záverečné testovanie.** Na mobiloch overiť nákup knižiek, zobrazenie v rodičovskom portáli, čitateľnosť a priechodnosť celej cesty.

## P2 – Nápady na posúdenie (nie schválené na implementáciu)

- [ ] **Možnosť „bumoferu“ – preskúmať, či to chceme.** Pracovný názov podľa poznámky; najprv upresniť význam, prínos pre hráča, náročnosť a rozhodnúť áno/nie. Bez automatickej implementácie.
- [ ] **Vianočný darčekový nákup / darčekový poukaz.** Preskúmať jednoduché darovanie hry ako vianočného darčeka, prípadne nadväznosť na druhú licenciu.
- [ ] **Zber a využitie spätnej väzby.** Po nazbieraní skutočných recenzií vyhodnotiť opakujúce sa pripomienky a použiť ich pri zlepšovaní prvej hry.

## Hotové / referenčné (stav treba priebežne overovať)

- [x] **Stripe účet Pixelkovia a checkout – základná integrácia.** Platby boli v produkcii úspešne spracované; chyby mobilných peňaženiek zostávajú otvorené vyššie.
- [x] **Pripravený koncept knižného upsellu a druhej licencie.** Samotnú kvalitu a produkčné správanie treba potvrdiť v E2E testoch.

---

**Pravidlá backlogu:** Pridávame stručný názov a jednu až dve vety. Zaškrtnúť až po overení funkčnosti. Podrobné realizačné zadania vytvárať osobitne v `MD/`. Nový nápad nie je automaticky schválenou funkcionalitou.
