# Dokončiť Meta Ads výdavky a overenie Purchase

Stav k 10. 11. 2026. Používateľ výslovne zadal implementáciu výdavkov a CAC a potvrdil overenie Purchase skúšobnou platbou. Predreklamný obsah, UTM rozbeh a Cloudflare/mobilné prevádzkové kontroly zostávajú na jeho pokyn odložené. V následnej odpovedi 10. 11. vlastník odložil vytvorenie tokenu a aktiváciu živého napojenia na neskôr („neviem ako na to, vráťme sa k tomu neskôr“). Dokončenie a nasadenie pripraveného kódu zostáva v zadaní. Toto zadanie nepovoľuje spustenie ani zmeny reklám.

## Potvrdené

- Dataset / Pixel **Pixelkovia – web**, ID `1120983200688486`, je nasadený na webe so samostatným marketingovým súhlasom.
- Reklamný účet **Pixelkovia**, ID `1141555698571585`, je priradený datasetu. ID reklamného účtu sa nesmie zameniť za Pixel ID.
- Používateľova snímka Meta Test events potvrdila dve PageView a jednu InitiateCheckout (Prechod do pokladnice), prijaté z prehliadača so stavom Spracované.
- Nákup používa existujúce overenie zaplatenej Stripe Session, sumu zo servera v EUR a ochranu pred duplicitami. Vlastník 10. 11. potvrdil overenie Purchase skutočnou skúšobnou platbou. Presná suma a osobitný scenár darčeka neboli v tomto potvrdení uvedené; ich serverové pravidlá sú pokryté automatizovanými testami.
- Automatické udalosti a Automatic Advanced Matching sú podľa používateľových snímok vypnuté. Conversions API nie je nakonfigurované.
- Reklamné náklady a CAC sú v dashboarde správne označené ako Nedostupné. Import a CAC sú implementované, ale bez serverového tokenu nie sú živé dáta dostupné.

## Zostávajúce TODO

- [ ] Pokračovať na `https://developers.facebook.com/apps/`: zistiť, či už existuje vhodná firemná aplikácia pre Marketing API. Výsledok pôvodného otvorenia zoznamu aplikácií zatiaľ nemáme.
- [x] Preveriť dostupné environment premenné, Codespaces a Cloudflare secrets. Kontrola 10. 11. overila dostupné environment premenné, zoznam Codespaces secrets a produkčný Worker secrets endpoint (HTTP 200); žiadny Meta Ads token nie je nakonfigurovaný.
- [ ] Po obnovení odloženej úlohy pomôcť vlastníkovi vytvoriť systémového používateľa s prístupom ku konkrétnemu reklamnému účtu a oprávnením `ads_read`; nežiadať správu kampaní iba pre čítanie výdavkov.
- [ ] Uložiť prístupový token pod názvom `META_ADS_ACCESS_TOKEN` ako serverový Cloudflare secret a Codespaces secret pre obnovu prostredia. Token nevkladať do chatu, frontendu, Git histórie ani logov. Overiť skutočné oprávnenia a identitu účtu cez API.
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
- Token uložiť v Cloudflare Dashboard → Workers → treasurequest-admin → Settings → Variables and Secrets ako **Secret**, a do osobných GitHub Codespaces secrets s prístupom iba k `romanduris/Pixelkovia`. Nevkladať ho do chatu ani do zdrojových súborov. Cloudflare secret sa sprístupní Workeru; Codespaces kópia slúži obnove prostredia.
- Po doplnení tokenu treba živým GET overiť účet, EUR a časové pásmo Europe/Bratislava alebo Europe/Prague, načítať výdavky a porovnať ich s Ads Managerom. Bez tokenu táto kontrola nie je vykonaná.

## Čo je viditeľné po odmietnutí súhlasu

Pri odmietnutí oboch nepovinných účelov sa nezaznamenáva nová návštevná analytika ani Meta Pixel. Zostávajú potrebné serverové záznamy prípravy platby, overenej úhrady, objednávky, tržby a doručenia prístupu. Bez existujúcej dovolenej atribúcie je nákup v Ostatné / neznáme; nejde o Nákup z návštev a nevstupuje do konverzie nameraných návštev. Samotné otvorenie stránky alebo checkoutu bez vytvorenia platobnej relácie sa v tomto prípade do marketingového prehľadu nezapočíta.

Analytický a marketingový súhlas sú nezávislé: analytika áno / marketing nie umožňuje vlastné návštevy a UTM bez Pixelu; analytika nie / marketing áno umožňuje Pixel, ale nepridáva vlastnú návštevnú atribúciu. Odvolanie nezmaže už oprávnene uloženú históriu ani obchodné záznamy.
