# Otvorené úlohy – kontrola 10. 11. 2026

Podklad: aktuálny [backlog](../BACKLOG/BACKLOG.md), projektové zadania v `MD/`, zdrojový kód a commity z 9. a 10. 11. 2026. Toto je kontrola zachovaných projektových záznamov; úplný export ostatných včerajších rozhovorov nie je k dispozícii. Otvorený bod nie je automatické poverenie na jeho implementáciu.

## Implementácia, ktorá ešte čaká

1. **P0 – podrobný priebeh platby.** Existujú Stripe relácie, overené výsledky, diagnostika, doručenie a marketingový prehľad. Chýba celý dohodnutý pohľad na načítanie formulára, začiatok a dokončenie zadávania, potvrdenia a odchody medzi spoľahlivo pozorovateľnými krokmi. Vytvorenie Session ani otvorenie checkoutu tieto kroky nenahrádza. Najprv treba overiť podporované signály používaného SDK. [Zadanie](P0-monitorovanie-platobneho-funnelu.md).
2. **Meta Ads výdavky a CAC.** Potrebný je autorizovaný prístup na čítanie reklamných výdavkov, ich opakovateľný import a výpočet CAC. Priradený reklamný účet ani funkčný Pixel výdavky nenapájajú. Náklady a CAC sú zatiaľ správne nedostupné. [Checklist na pokračovanie](DOKONCIT-meta-ads-a-purchase.md).
3. **Zverejňovanie recenzií.** Odoslanie hviezdičiek a komentára po hre aj uloženie spätnej väzby existujú. Chýba spracovanie a schvaľovanie pred publikovaním a napojenie na verejné hodnotenie. Existujúci administrátorský endpoint spätnú väzbu iba číta.
4. **Knižnica po hodnotení.** Knižnica už existuje, overuje nákupy, ponúka čítanie aj dokúpenie a funguje bez hodnotenia. Osobitné zvýraznenie alebo presun ku knižnici po odoslaní/preskočení hodnotenia ešte nie je dokončený; aktuálny formulár po odoslaní obnoví portál a zobrazí poďakovanie.
5. **Predreklamný obsah Facebook/Instagram.** Zostáva pripraviť a schváliť 14 príspevkov a overiť začiatok dvojtýždňového rozbehu. Repozitár nedokladá, že už prebehlo 14 dní pravidelného publikovania. Ak rozbeh ešte nezačal, plánovaná reklama 18. 11. je v rozpore s požiadavkou celých 14 dní vopred.
6. **Ďalšia analytika.** GA4, Microsoft Clarity a Meta CAPI nie sú nasadené. V backlogu sú uvedené ako ďalšia práca; nie sú podmienkou existujúceho prvostranného grafu a nesmú sa predstierať ako hotové ani spúšťať bez zodpovedajúceho súhlasu a konfigurácie.

## Overenie a prevádzkové kontroly, ktoré ostávajú

- **Meta Purchase pri skutočnej platbe.** Browserový Purchase je implementovaný s overením platby a ochranou pred duplicitami. V Meta Test events boli potvrdené PageView a InitiateCheckout; prijatie skutočného plateného Purchase ešte nemáme doložené. Nejde o chýbajúcu implementáciu samotného eventu. [Presný stav](DOKONCIT-meta-ads-a-purchase.md).
- **UTM a reálne prijímanie udalostí.** Zjednotiť reklamné a partnerské odkazy a preveriť udalosti na cieľových zariadeniach. Automatizované skúšky nie sú potvrdenie príjmu v externých systémoch. [Metodika](../docs/marketing-funnel.md).
- **Cloudflare Observability.** Zostáva preveriť skutočnú spotrebu, plán, sampling, retenciu, náklady a prístup na čítanie metrík. Existujúce nasadzovacie oprávnenie samo nepotvrdzuje prístup k Observability. Konkrétne ceny ani budúce účtovanie táto kontrola neoverovala. [Zadanie](PRELAUNCH-cloudflare-observability-a-codex-pristup.md).
- **Mobilná cesta knižiek.** Zostáva záverečný priechod nákupom, prístupom v rodičovskom portáli a čítaním na cieľových zariadeniach. Existujúce automatizované regresie nie sú totožné s kompletným finálnym overením na fyzických telefónoch.

## Čo už netreba znovu implementovať

- Google Pay a Apple Pay: pôvodné opravy sú implementované; vlastník 2. 11. potvrdil úspešné reálne testovanie a schválil uzavretie. [Záznam opráv a overenia](P0-google-pay-timeout-apple-pay-audit.md).
- Automatické dokončenie hry, obnova po výpadku/refreshi a zobrazenie hodnotenia: nasadené 9. 11.; zvyšok položky recenzií sa týka publikovania.
- Súhlas pre analytiku/marketing, odvolanie cez pätičku a konfigurácia automatickej výzvy: implementované. Hotová zaškrtnutá položka bola pri tejto kontrole odstránená z backlogu podľa jeho pravidla ponechávať iba otvorené veci.
- Päť tlačidiel období, preklik Nákupy → zodpovedajúce platby, denný graf a prepínanie unikátnych prehliadačov: implementované 10. 11. Historické unikátne návštevy sa nedajú dopočítať; chýbajúce identifikátory nie sú dôkaz nulovej návštevnosti.

## Nápady bez schváleného zadania

RoduLab web, „bumofer“, vianočný darčekový poukaz a ďalšie využitie nazbieranej spätnej väzby ostávajú P2 nápadmi. Existujúca druhá nezávislá hra za 9,99 € už funguje; samostatný vianočný poukaz je iný, zatiaľ nerealizovaný nápad.
