# Rodinná galéria – 26. 10. 2026

Tri veľké portrétové zábery: pôvodné skladanie signálov, pôvodné papierové rovnice s mobilnou mriežkou a nový záber opravy pixelových vzorov so zadávaním čiastočného kódu. Fotografie zostávajú celé. Okraj susednej snímky, šípky a tri bodky naznačujú ďalšie obrázky bez textového návodu. Galéria podporuje natívne posunutie prstom, klávesy šípok, Home/End a obmedzenie animácií podľa nastavenia zariadenia. Nemá automatické prehrávanie.

Nový obrázok vytvoril vstavaný **imagegen**. [Presný prompt, referencie a uložené varianty](funnel-gallery.json). Hlavný súbor: [family-code-mobile.webp](../assets/sales/family-code-mobile.webp), varianty 640 a 960 px sú v rovnakom adresári. Pôvodné schválené fotografie sa nemenili. Ide o označené ilustračné scény, nie recenzie zákazníkov ani kompletné zadania úloh.

## Overenie

- Verejný funnel: Chromium, 320/360/390/430/768/1366/1440 px; tri snímky, viditeľná susedná fotka, 44 px ovládanie, šípky, bodky, klávesnica, obmedzené animácie a skutočné dotykové posunutie cez CDP pri 390 px. Zároveň FAQ, checkout, všetky kombinácie cien, neaktívna platba, žiadne odoslanie údajov a 404 pre súkromné súbory.
- Súkromný náhľad: celý sales/checkout test prešiel v Chromium vo všetkých siedmich rozmeroch.
- Vizuálne skontrolované mobilné prvá/tretia snímka a desktop. Všetky verejné obrázky sa dekódujú a stránka nemá vodorovné pretečenie.
- 176 chránených súborov, herný obsah, PDF, komerčné pravidlá a 19 odpovedí FAQ zodpovedajú pôvodným kontrolným súčtom. 63 publikovaných JS/CSS adries má správne verzie.
- Limit prostredia: lokálny Playwright WebKit hlási `PAGE CRASH` aj na pôvodnej verejnej verzii a pri vypnutom `sales-interactions.js`. Kontrolu Safari preto nepovažujeme za úspešne dokončenú; výsledok Chromium ju nenahrádza.

Verejný balík obsahuje iba explicitných 24 schválených assetov. Hra, celé PDF a riešenia sa na verejný funnel nenahrávajú.
