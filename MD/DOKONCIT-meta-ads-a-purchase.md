# Dokončiť Meta Ads výdavky a overenie Purchase

Stav k 9. 11. 2026. Používateľ požiadal úlohu odložiť a pripomenúť pri ďalšom začatí práce v projekte. Pred pokračovaním stručne pripomenúť otvorené kroky; tento dokument sám nepovoľuje automatickú implementáciu ani spustenie reklamy.

## Potvrdené

- Dataset / Pixel **Pixelkovia – web**, ID `1120983200688486`, je nasadený na webe so samostatným marketingovým súhlasom.
- Reklamný účet **Pixelkovia**, ID `1141555698571585`, je priradený datasetu. ID reklamného účtu sa nesmie zameniť za Pixel ID.
- Používateľova snímka Meta Test events potvrdila dve PageView a jednu InitiateCheckout (Prechod do pokladnice), prijaté z prehliadača so stavom Spracované.
- Nákup používa existujúce overenie zaplatenej Stripe Session, sumu zo servera v EUR a ochranu pred duplicitami. Lokálne testy prešli; prijatie Purchase v Meta pri skutočnej platbe ešte nie je potvrdené.
- Automatické udalosti a Automatic Advanced Matching sú podľa používateľových snímok vypnuté. Conversions API nie je nakonfigurované.
- Reklamné náklady a CAC sú v dashboarde správne označené ako Nedostupné. Samotné priradenie datasetu k účtu ich nenapája.

## Zostávajúce TODO

- [ ] Pokračovať na `https://developers.facebook.com/apps/`: zistiť, či už existuje vhodná firemná aplikácia pre Marketing API. Posledný krok pre používateľa bol otvoriť tento zoznam; jeho výsledok zatiaľ nemáme.
- [ ] Najprv preveriť dostupné environment premenné, Codespaces a Cloudflare secrets. Pri poslednej kontrole nebol nakonfigurovaný prístup pre Meta Ads. Ak stále chýba, nastaviť systémového používateľa s prístupom ku konkrétnemu reklamnému účtu a potrebným oprávnením `ads_read`; nežiadať správu kampaní iba pre čítanie výdavkov.
- [ ] Uložiť prístupový token ako serverový Cloudflare secret a Codespaces secret pre obnovu prostredia. Token nevkladať do chatu, frontendu, Git histórie ani logov. Overiť skutočné oprávnenia a identitu účtu cez API.
- [ ] Implementovať import skutočných výdavkov podľa dňa a kampane cez Marketing API do existujúceho backendu/D1. Zosúladiť menu, časové pásmo a filtre; opakovaný import nesmie násobiť náklady. Chýbajúci prístup alebo chyba API nesmú vyzerať ako nulové výdavky.
- [ ] Prepojiť kampane so zjednotenými UTM a zaviesť výpočet CAC nad porovnateľnými nákladmi a priradenými platenými nákupmi. Pri chýbajúcej atribúcii alebo nepodporovanom rozdelení podľa produktu/zariadenia uviesť obmedzenie alebo Nedostupné, neodhadovať hodnoty.
- [ ] Overiť import, obnovu dát a výpočty proti Meta Ads Manageru a následne nasadiť. Nezapínať, nevytvárať ani neupravovať reklamy v rámci napojenia reportingu.
- [ ] Pri najbližšej skutočnej overenej platbe s predchádzajúcim marketingovým súhlasom potvrdiť Purchase v Meta, správnu sumu/currency EUR a jednu udalosť na transakciu vrátane darčeka. Nevytvárať fiktívne Purchase ani platený test bez osobitného zadania; objednávka zdarma Purchase nevyvolá.

Conversions API je samostatná prípadná úloha. Token z jeho sekcie nenahrádza automaticky autorizovaný prístup na čítanie reklamných výdavkov. CAPI nesmie obchádzať odmietnutie marketingového súhlasu.

## Čo je viditeľné po odmietnutí súhlasu

Pri odmietnutí oboch nepovinných účelov sa nezaznamenáva nová návštevná analytika ani Meta Pixel. Zostávajú potrebné serverové záznamy prípravy platby, overenej úhrady, objednávky, tržby a doručenia prístupu. Bez existujúcej dovolenej atribúcie je nákup v Ostatné / neznáme; nejde o Nákup z návštev a nevstupuje do konverzie nameraných návštev. Samotné otvorenie stránky alebo checkoutu bez vytvorenia platobnej relácie sa v tomto prípade do marketingového prehľadu nezapočíta.

Analytický a marketingový súhlas sú nezávislé: analytika áno / marketing nie umožňuje vlastné návštevy a UTM bez Pixelu; analytika nie / marketing áno umožňuje Pixel, ale nepridáva vlastnú návštevnú atribúciu. Odvolanie nezmaže už oprávnene uloženú históriu ani obchodné záznamy.
