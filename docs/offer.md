# Aktuálna ponuka

Zdroj cien: `site-config.js`. Verejný katalóg aj serverové nacenenie sa odvodzujú z rovnakých údajov pri zostavení.

| Ponuka | Cena |
| --- | ---: |
| Hra | 14,99 € |
| Hra + jedna kniha | 19,98 € |
| Hra + obe knihy | 19,98 € |
| Jedna samostatná kniha | 4,99 € |
| Obe knihy bez hry | 9,98 € |

Obe knihy pri hre automaticky uplatnia zľavu 4,99 €. Atlas je voliteľný, predvolene označený a v aktuálnej ponuke zdarma. Samostatné produkty pred zľavou stoja spolu 24,97 €. Štandardná cena hry je 29,99 €; Early Access cena je 14,99 €. Druhá hra stojí 9,99 € so samostatnou zľavou 20 €. Knižky k hre stoja presne polovicu z 9,98 €, teda 4,99 €.

Platené doplnky sa nepredvyberajú. Jedným kliknutím možno vybrať celý balík a potom ho upraviť. Ukážky nemenia výber ani cenu. Každá kniha funguje samostatne, bez potreby vlastniť alebo dohrať hru.

Cenu kontroluje server pred vytvorením vloženého Stripe Checkout. Voucher `free` vyžaduje dokončenú, serverom overenú nulovú Stripe reláciu. Staré platobné odkazy sa nepoužívajú. Dostupnosť živého checkoutu určuje overená serverová konfigurácia.
