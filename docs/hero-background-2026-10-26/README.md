# Návrat ilustrácie cez celý úvod

Následná oprava po CRO úprave z 26. 10. 2026. Porovnanie vychádza z commitu `ffebb8aad092aabd575158f71238a2c2b20393c0`.

Schválená obývačková scéna znovu vypĺňa celú úvodnú plochu. Tablet už nepoužíva vložený obdĺžnik s obrázkom medzi dvomi tmavými blokmi. Obrázok má pri každej šírke `inset: 0` a `object-fit: cover`; text sa zobrazuje cez ilustráciu. Na mobile sú popis, fakty a cena vyššie, medzi nimi a CTA zostáva priestor na postavy. Existujúci mobilný aj desktopový zdroj obrázka sú nezmenené. Pri inom pomere strán sa prirodzene orežú okraje scény.

Zostáva kratší osemsekciový funnel, nové texty, ponuka po ukážke, všetkých 19 FAQ, ceny, neaktívne platby aj ostré neklikateľné náhľady. Herné súbory, PDF a uložený postup sa nemenili.

| Rozmer | Pred opravou | Po oprave |
| --- | --- | --- |
| Mobil 390 × 844 | [Snímka](390-before.jpg) | [Snímka](390-after.jpg) |
| Tablet 875 × 1054 | [Snímka](875-before.jpg) | [Snímka](875-after.jpg) |

Snímky pred opravou vznikli znovu načítaním pôvodného CSS z uvedeného commitu pri rovnakom HTML, viewportoch a načítaných fontoch. Po oprave sa zachytil aktuálny zdroj. Nejde o retušované vizualizácie.

Kontrola v Chromium overila vyplnenie celej plochy, `cover`, oddelenie horného a dolného textu a absenciu horizontálneho pretekania pri šírkach 320, 360, 390, 430, 700, 701, 768, 875, 1050, 1051, 1366 a 1440 px. Vizuálne boli skontrolované mobilné, tabletové a desktopové snímky. Na tablete sa výška úvodu vrátila z 850 na 710 px; mobilné výšky ostali 750/800 px podľa šírky. Obrázok vypĺňa celý úvod, nie nutne celú fyzickú výšku každého displeja.

Existujúci test predajnej stránky a checkoutu na finálnom statickom výstupe overuje sedem rozmerov, CTA, FAQ, lištu, ceny, doplnky, neaktívny nákup a zachovanie postupu. Kontrolné súčty 176 chránených súborov a 62 publikovaných URL zostávajú platné. WebKit nebol v tejto vizuálnej oprave opätovne testovaný; predchádzajúca havária je zaznamenaná v [CRO audite](../cro-audit-2026-10-26/README.md).
