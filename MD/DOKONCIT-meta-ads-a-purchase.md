# Dokončiť Meta Ads výdavky a overenie Purchase

Stav k 12. 11. 2026. Používateľ obnovil napojenie Meta Ads výdavkov a CAC a požiadal aj o overenie trvalého uloženia projektových credentials pre ďalšie Codespaces. Purchase potvrdil skúšobnou platbou 10. 11. Predreklamný obsah, UTM rozbeh a Cloudflare/mobilné prevádzkové kontroly zostávajú odložené. Toto zadanie nepovoľuje spustenie ani zmeny reklám.

## Potvrdené

- Dataset / Pixel **Pixelkovia – web**, ID `1120983200688486`, je nasadený na webe so samostatným marketingovým súhlasom.
- Reklamný účet **Pixelkovia**, ID `1141555698571585`, je priradený datasetu. ID reklamného účtu sa nesmie zameniť za Pixel ID.
- Používateľova snímka Meta Test events potvrdila dve PageView a jednu InitiateCheckout (Prechod do pokladnice), prijaté z prehliadača so stavom Spracované.
- Nákup používa existujúce overenie zaplatenej Stripe Session, sumu zo servera v EUR a ochranu pred duplicitami. Vlastník 10. 11. potvrdil overenie Purchase skutočnou skúšobnou platbou. Presná suma a osobitný scenár darčeka neboli v tomto potvrdení uvedené; ich serverové pravidlá sú pokryté automatizovanými testami.
- Automatické udalosti a Automatic Advanced Matching sú podľa používateľových snímok vypnuté. Conversions API nie je nakonfigurované.
- Aplikácia **Pixelkovia – reporting**, ID `1418601830255498`, používa Marketing API a patrí portfóliu Pixelkovia. Snímka detailu aplikácie potvrdila systémového používateľa **Pixelkovia**, ID `61596128686573`, s rolou Vyvíjať aplikáciu. Generovanie tokenu už ponúklo `ads_read`; vlastník zvolil platnosť Never a dostal pokyn vybrať iba `ads_read`.
- Produkčné Cloudflare API 12. 11. potvrdilo secret `META_ADS_ACCESS_TOKEN`. Token nie je v aktuálnom prostredí ani medzi repository Codespaces secrets. Automatický import 12. 11. o 10:20 (Europe/Bratislava) skončil bezpečnou chybou „Meta API je nedostupné alebo nevrátilo platnú odpoveď.“ D1 nemá úspešný import ani riadky výdavkov. Táto všeobecná chyba zatiaľ nerozlišuje zlyhanie sieťového volania od neplatnej odpovede; nepotvrdzuje chybný token ani chýbajúce oprávnenie.

## Zostávajúce TODO

- [x] Vytvoriť samostatnú firemnú aplikáciu pre Marketing API: Pixelkovia – reporting.
- [x] Preveriť dostupné environment premenné, repository Codespaces a Cloudflare secrets. Kontrola 12. 11. potvrdila produkčný Meta secret a chýbajúcu GitHub kópiu; [inventár ostatných credentials](../docs/project-secrets.md).
- [x] Vytvoriť systémového používateľa a priradiť mu rolu v aplikácii; generovanie tokenu už ponúka `ads_read`. Vlastník dostal pokyn udeliť reklamnému účtu iba Zobraziť úspešnosť; skutočný API prístup k účtu sa ešte musí overiť.
- [x] Uložiť `META_ADS_ACCESS_TOKEN` ako produkčný Cloudflare secret; overené cez API zoznamu secrets (HTTP 200).
- [ ] Uložiť rovnaký token ako repository Codespaces secret pre `romanduris/Pixelkovia`. Zatiaľ chýba aj v aktuálnom prostredí, Cloudflare API jeho hodnotu nevracia. Token nevkladať do chatu, frontendu, Git histórie ani logov.
- [x] Implementovať import skutočných výdavkov podľa dňa a kampane cez Marketing API do existujúceho backendu/D1. Zosúladiť menu, časové pásmo a filtre; opakovaný import nesmie násobiť náklady. Chýbajúci prístup alebo chyba API nesmú vyzerať ako nulové výdavky.
- [x] Implementovať explicitné priradenie Meta kampane k existujúcemu utm_campaign v administrácii a zaviesť výpočet CAC nad porovnateľnými nákladmi a priradenými platenými nákupmi. Pri chýbajúcej atribúcii alebo nepodporovanom rozdelení podľa produktu/zariadenia uviesť obmedzenie alebo Nedostupné, neodhadovať hodnoty.
- [ ] Po doplnení tokenu overiť živý import, obnovu dát a výpočty proti Meta Ads Manageru. Nasadenie implementácie bez tokenu toto overenie nenahrádza. Nezapínať, nevytvárať ani neupravovať reklamy v rámci napojenia reportingu.
- [x] Overiť Purchase pri skutočnej platbe: vlastník 10. 11. 2026 potvrdil „3 som overil (skúsil som platbu)“. Ide o potvrdenie vlastníka; pri tejto implementácii sa nevytváral ďalší platený nákup.

Conversions API je samostatná prípadná úloha. Token z jeho sekcie nenahrádza automaticky autorizovaný prístup na čítanie reklamných výdavkov. CAPI nesmie obchádzať odmietnutie marketingového súhlasu.

## Implementácia a bezpečné doplnenie prístupu

- Backend: `admin/src/meta-ads.mjs`, existujúci Worker/D1, migrácia `0020_meta_ads.sql`. Graph API v26.0, účet pevne `1141555698571585`; iba GET account/insights.
- Administrácia → Predajný funnel → Reklamné náklady: rozbaliť, obnoviť celé zvolené obdobie a priradiť existujúce `utm_campaign`. Zmena priradenia nemení reklamné odkazy ani historické návštevy.
- Cron skúša import raz za hodinu (prvýkrát 30 dní, následne posledných 7 dní vrátane dneška). Staršie obdobie sa obnoví tlačidlom, najviac 366 dní.
- Chýbajúci secret, API chyba, neúplné dni a dnešný import starší než dve hodiny znamenajú Nedostupné; chyby obsahujú bezpečné HTTP/Meta kódy bez surových odpovedí a tokenov.
- Token uložiť v Cloudflare Dashboard → Workers → treasurequest-admin → Settings → Variables and Secrets ako **Secret**, a do repository GitHub Codespaces secrets pri `romanduris/Pixelkovia`. Nevkladať ho do chatu ani do zdrojových súborov. Cloudflare secret sa sprístupní Workeru; trvalá GitHub kópia slúži aj ďalším oprávneným Codespaces tohto repozitára.
- Po doplnení tokenu treba živým GET overiť účet, EUR a časové pásmo Europe/Bratislava alebo Europe/Prague, načítať výdavky a porovnať ich s Ads Managerom. Samotné uloženie tokenu túto kontrolu nenahrádza. Produkčný cron `*/10 * * * *` a nasadený kód so `scheduledMetaAds` boli 12. 11. overené cez Cloudflare API.

## Čo je viditeľné po odmietnutí súhlasu

Pri odmietnutí oboch nepovinných účelov sa nezaznamenáva nová návštevná analytika ani Meta Pixel. Zostávajú potrebné serverové záznamy prípravy platby, overenej úhrady, objednávky, tržby a doručenia prístupu. Bez existujúcej dovolenej atribúcie je nákup v Ostatné / neznáme; nejde o Nákup z návštev a nevstupuje do konverzie nameraných návštev. Samotné otvorenie stránky alebo checkoutu bez vytvorenia platobnej relácie sa v tomto prípade do marketingového prehľadu nezapočíta.

Analytický a marketingový súhlas sú nezávislé: analytika áno / marketing nie umožňuje vlastné návštevy a UTM bez Pixelu; analytika nie / marketing áno umožňuje Pixel, ale nepridáva vlastnú návštevnú atribúciu. Odvolanie nezmaže už oprávnene uloženú históriu ani obchodné záznamy.
