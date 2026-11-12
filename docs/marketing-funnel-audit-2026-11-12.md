# Audit kompaktného FB/IG funnelu · 12. 11. 2026

Audit pred implementáciou nad commitom `36b0cad` pre zadanie `MD/P1-predajny-funnel-kompaktny-FB-IG-dashboard.md`.

## Existujúce meranie a finančný základ

- `funnel-metrics.js` rozlišuje `facebook`/`fb` a `instagram`/`ig`; reklamu označuje len pri platenom UTM médiu. Samotné `fbclid` nie je dôkaz reklamy. Prvá atribúcia sa pri opakovaných udalostiach neprepisuje.
- Návštevná relácia a otvorenia checkoutu vznikajú po analytickom súhlase. Checkout odovzdáva existujúce náhodné identifikátory; `linkMarketingAttempt` kontroluje dvojicu ID a platnosť návštevy a prepája ju s pokusom. Verejný checkout ani zber sa v tejto úlohe nemenia.
- `attemptsCTE` vytvára jeden riadok na Stripe transakciu vrátane darčekovej druhej hry. Nákup potvrdzujú serverové platobné záznamy alebo zaplatené objednávky; bezplatné transakcie sú oddelené. Refundovaná úhrada zostáva historickým nákupom a refundácia sa vykazuje samostatne.
- Aktuálna karta sa volá **Tržby**, nie Zisk. Hodnota je `metrics.revenueCents`, teda hrubé inkaso bez odpočítania refundácií, poplatkov alebo reklamy. Kontext **Reklama − …** je samostatný údaj. Premenovanie na zisk alebo nové odčítanie by zmenilo význam existujúcej metriky; karta a jej vzorec preto zostávajú zachované.
- Konverzia používa návštevnú kohortu; unikátny režim používa kupujúce prehliadače / prehliadače kohorty. CAC používa existujúce priradenie Meta kampaní a reklamných návštev. Žiadny z týchto finančných ani konverzných vzorcov sa nemení.
- Štyri horné kroky používajú kalendárne obdobie. Nemusia tvoriť uzavretú kohortu: checkout môže patriť staršej návšteve a neskoršia platba môže patriť do iného obdobia. Nedopočítavajú sa percentá strát.

## Živé overenie Meta pred implementáciou

Použitý existujúci environment secret `META_ADS_ACCESS_TOKEN`; žiadne nové oprávnenia ani credentials neboli potrebné. Iba GET na existujúci účet `1141555698571585`, Graph API v26.0:

- Account HTTP 200: správne ID, EUR, Europe/Bratislava.
- Insights HTTP 200: `fields=account_id,account_currency,campaign_id,date_start,date_stop,spend,impressions`, `level=campaign`, `time_increment=1`, `breakdowns=publisher_platform`, 30. 10.–12. 11. 2026.
- Výsledok: prázdne `data`, bez ďalšej stránky, teda úspešne overených **0 zobrazení** a žiadne riadky platforiem. Toto nepotvrdzuje nenulové rozdelenie ani nenulový CAC.
- Existujúci hodinový import už používa `publisher_platform` pre výdavky. Rozšíri sa jeho existujúca požiadavka a transakcia, nevznikne druhá integrácia.
- Pole `impressions` a breakdown `publisher_platform` uvádza aj [oficiálny Meta SDK](https://github.com/facebook/facebook-python-business-sdk/blob/main/facebook_business/adobjects/adsinsights.py). Meta dokumentácia breakdownov pri kontrole vrátila HTTP 429 a stránka [dynamických URL parametrov](https://www.facebook.com/business/help/2360940870872492) vyžadovala prihlásenie. Nastavenie makier v konkrétnych reklamách preto nie je týmto auditom overené. Bez zmeny reklám možno použiť už podporované explicitné zdroje `utm_source=facebook` alebo `instagram`, `utm_medium=paid_social` a priradenú `utm_campaign`.

## Medze atribúcie a rozsah implementácie

FB/IG rozpad webu znamená **priradené FB Ads / IG Ads**. Bežné sociálne odkazy, Meta bez rozlíšenia siete, direct, organic a nákupy bez dovolenej atribúcie zostávajú v **Ostatné / neznáme**. Nákupy bez súhlasu sa nestratia z celkového serverového počtu.

Pri unikátnych prehliadačoch sa v každom kroku vyberie prvý zodpovedajúci zdroj v danom období a aktívnych filtroch, aby jeden prehliadač nevstupoval do dvoch segmentov toho istého kroku. Nákupy zostávajú transakciami aj pri prepnutí unikátneho režimu.

Chýba živý reklamný nákup s overenou FB/IG atribúciou a nenulové porovnanie s Ads Managerom. Overenie celej platenej cesty na cieľových telefónoch a potvrdenie URL parametrov v Ads Manageri zostávajú pred pilotom. Nový endpoint, klientské identifikátory ani zmeny platobnej architektúry na tento rozpad nie sú potrebné.
