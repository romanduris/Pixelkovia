# Aktuálna ponuka

Katalóg v `site-config.js` obsahuje iba hru, dve knihy a Atlas. Odvodený `purchase-config.js` sa generuje pre verejný funnel zo spoločného zdroja.

| Výber k hre | Zľava | Celkom |
| --- | ---: | ---: |
| Bez kníh | 0,00 € | 14,99 € |
| Prvá alebo druhá kniha | 0,00 € | 19,98 € |
| Obe knihy | −4,98 € | 19,99 € |

Samostatne stojí každá kniha 4,99 €, obe bez hry 9,98 €. Atlas je predvolene zaškrtnutý za 0 €; jeho bežný checkbox možno odškrtnúť a znova zaškrtnúť bez zmeny ceny. Odobratie ho skryje aj zo súhrnu. Plánovaná samostatná cena Atlasu je 2,99 €. Plánovaná cena hry po úvodnej ponuke je 29,99 €; nejde o cenu, za ktorú sa predtým predávala. Súčet plánovaných samostatných cien všetkého je 42,96 €.

Dva platené doplnky sa nepredvyberajú. Výber oboch kníh automaticky zapína zľavu; odobratie jednej ju ruší. Ukážkové okná nemenia cenu ani výber. Hra aj knihy fungujú samostatne. Platby a odosielanie objednávok sú vypnuté.

Kompaktný checkout zvýrazňuje **celý balík za 19,99 €** oproti aktuálnemu súčtu samostatných položiek **24,97 €**, s úsporou **4,98 €**. Kliknutie na ponuku označí obe knihy aj Atlas; opakovaný klik nepridáva ďalšie položky. Knihy aj Atlas možno následne upravovať samostatne. Pri samostatnej knihe sa herný balík neponúka. Doplnky majú malé obálky a priamu ukážku; základná hra uvádza „7 úloh“.

Pod nákupným tlačidlom je odkaz **Voucher** s dialógom. Dočasný vývojový kód `free` odpočíta 100 % ceny po zľave za balík, vrátane vybraných kníh; funguje aj pri samostatnom nákupe kníh. Okolité medzery ani veľkosť písmen nerozhodujú. Výber doplnkov ponechá výsledok 0 €, odstránenie voucheru obnoví aktuálnu cenu. Kód zostáva iba v otvorenej stránke a po obnovení sa odstráni. Nevytvára objednávku ani prístup k obsahu. Návrh skutočného checkoutu a doručovania je v [pláne platieb](payment-setup.md).

Verejné ukážky obsahujú obálky, anotácie, odhad čítania a po dva úvodné odseky prvej rozprávky. Plné knihy ani herné súbory sa do verejného balíka nekopírujú.
