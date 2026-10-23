/* Single source for printable worksheets and their storyboard copy. */
(() => {
  'use strict';
  const sheets = {
  "p1": "<section class=\"sheet kvak-sheet\" id=\"p1\" aria-labelledby=\"kvak-sheet-title\">\n<div class=\"kvak-retained\">\n<div class=\"kvak-print-heading\"><div class=\"label\">PIXELKOVIA / ÚLOHA KÚPEĽŇA / OBÁLKA KÚPEĽŇA</div><h2 id=\"kvak-sheet-title\">KVAKOVE<br>ROZHÁDZANÉ SIGNÁLY</h2><span class=\"print-wave\" aria-hidden=\"true\">▂ ▄ ▆ ▃ ▅ ▂ ▇ ▄</span></div>\n<div class=\"kvak-print-story\"><span class=\"sheet-avatar kvak-print-avatar\" role=\"img\" aria-label=\"Kvak – oficiálna postavička Pixelkov\" style=\"--sprite-x:33.333333333333336%;--sprite-y:0%\"></span><h3>Ahojte, ľudskí pomocníci!</h3><p>Ja som <strong>Kvak</strong>, pixelkovský zachytávač signálov. Počujem aj veľmi slabé správy, ktoré ostatní Pixelkovia nevidia ani nepočujú.</p><p>Môj signál sa rozpadol a <strong>neviem sa spojiť s Pikom ani s ostatnými kamarátmi</strong>. Zachytil som šesť kúskov svojej správy, ale pomiešali sa!</p><p>Ak záznamy zoradíte podľa toho, <strong>kedy vznikli – od najstaršieho po najnovší</strong>, ich číslice vytvoria kód na obnovenie môjho spojenia. Prosím, pomôžte mi spojiť sa s ostatnými!</p></div>\n<div class=\"kvak-print-mission\"><h3>VAŠA MISIA</h3><ol><li><strong>Vystrihnite všetkých šesť signálov</strong> po prerušovaných čiarach.</li><li><strong>Otočte ich</strong> tak, aby ste prečítali dátum, čas aj číslicu.</li><li><strong>Zoraďte ich od najstaršieho po najnovší.</strong> Všetky sú z rovnakého roka.</li><li>Prečítajte číslice v tomto poradí a <strong>zapíšte šesťmiestny kód</strong>.</li><li><strong>Naskenujte QR kód</strong> telefónom a na otvorenej stránke <strong>skúste zadať svoj kód</strong>.</li></ol></div>\n<div class=\"kvak-print-controls\"><div class=\"kvak-code-panel\"><h3>KÓD NA OBNOVENIE SPOJENIA</h3><div class=\"code-boxes\" aria-label=\"Šesť prázdnych políčok na kód\"><span></span><span></span><span></span><span></span><span></span><span></span></div><p>Zapíšte číslice z ústrižkov v poradí od najstaršieho záznamu po najnovší.</p></div><div class=\"kvak-qr-panel\"><div class=\"qr-mockup\"><img src=\"assets/kvak-qr.svg\" alt=\"QR kód na otvorenie Kvakovho signálu\" width=\"72\" height=\"72\"><small>OTVORIŤ KVAKOV SIGNÁL</small></div><div><h3>AKTIVOVAŤ KVAKOV SIGNÁL</h3><p>Naskenujte QR kód telefónom. Na otvorenej stránke skúste zadať svoj šesťmiestny kód.</p></div></div></div>\n</div>\n<div class=\"kvak-cut-divider\"><span>✂ TU ODDEĽTE SIGNÁLY · HORNÚ ČASŤ SI ODLOŽTE</span></div>\n<div class=\"cutouts-heading\"><strong>ŠESŤ KÚSKOV STRATENÉHO SIGNÁLU</strong><span>Vystrihnite jednotlivé rámiky.</span></div>\n<div class=\"signal-cutouts\"><div class=\"signal-cutout\" data-date=\"14. 6.\" data-time=\"19:50\" data-digit=\"2\" style=\"--rotation:90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>14. 6.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>19:50</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>2</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"13. 3.\" data-time=\"20:10\" data-digit=\"4\" style=\"--rotation:180deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>13. 3.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>20:10</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>4</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"15. 12.\" data-time=\"08:40\" data-digit=\"6\" style=\"--rotation:-90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>15. 12.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>08:40</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>6</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"13. 3.\" data-time=\"20:15\" data-digit=\"1\" style=\"--rotation:-90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>13. 3.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>20:15</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>1</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"15. 9.\" data-time=\"08:35\" data-digit=\"9\" style=\"--rotation:90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>15. 9.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>08:35</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>9</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"13. 3.\" data-time=\"20:05\" data-digit=\"7\" style=\"--rotation:180deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>13. 3.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>20:05</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>7</b></div></div></div></div>\n\n<span class=\"footer\">ZÁHADA U VÁS DOMA · KVAKOV ZÁCHRANNÝ SIGNÁL · P1</span></section>",
  "p2": "<section class=\"sheet\" id=\"p2\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:66.66666666666667%;--sprite-y:0%\"></span><div class=\"label\">P2 / Obálka 2 pri okne / Iskrin dekódovací stroj</div><h2>Iskrin dekódovací stroj</h2><p>Iskra vie odhaliť skryté značky. Jej zašifrovaný odkaz prečítate pomocou dvoch kruhov. Načítajte QR kód. Vystrihnite oba kruhy po vonkajšej čiare a menší položte doprostred väčšieho. Nastavte <strong>vonkajšie D oproti vnútornému A</strong>. Stred pridržte prstom. Pre každé písmeno správy na vonkajšom kruhu prečítajte písmeno na vnútornom.</p><div class=\"circles\" id=\"circles\"></div><div class=\"code\" data-ciphertext=\"__ISKRIN_ODKAZ__\" data-shift=\"-3\">__ISKRIN_ODKAZ__</div><p class=\"note\">Rozlúštite celú vetu a choďte podľa nej hľadať obálku označenú Úloha 3. Ak nájdete obálku Úloha 7, zatiaľ ju nechajte zatvorenú. Okno neotvárajte a nikam nelezte.</p><p class=\"instructions\">Abeceda má 26 písmen A–Z, bez diakritiky. Medzera zostáva medzerou. Strihajte pod dohľadom dospelého; stred netreba prepichovať.</p><span class=\"footer\">ZÁHADA U VÁS DOMA · ISKRIN DEKÓDOVACÍ STROJ · P2</span></section>",
  "p3": "<section class=\"sheet\" id=\"p3\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:100.0%;--sprite-y:0%\"></span><div class=\"label\">P3 / Obálka Úloha 3 pod stoličkou / Šutkove symboly</div><h2>Tri tvary.<br>Jedna odpoveď.</h2><p>Šutko udrží priechod pevný pre celú partiu. Vysiela pomocou tvarov. Každý symbol si pamätá svoju hodnotu. Nemení sa, ani keď sa objaví v inom riadku.</p><div class=\"equations\"><div>△ + △ = 6</div><div>○ + △ = 5</div><div>□ + ○ = 6</div><hr><div>△ + ○ + □ = ?</div></div><p class=\"note\">Po vyriešení vezmite obálku 3 zo stola. Otvorte iba P4; P5 nechajte uzavretý až do úlohy 5. Lístkove pásiky P4 zoraďte podľa čísiel v rohoch.</p><span class=\"footer\">ZÁHADA U VÁS DOMA · ZÁCHRANNÉ LISTY · P3</span></section>",
  "p4": "<section class=\"sheet\" id=\"p4\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:0%;--sprite-y:100%\"></span><div class=\"label\">P4 / Obálka 3 / Lístkov roztrhaný odkaz</div><h2>Poskladajte Lístkov odkaz.</h2><p>Lístok rozumie reči signálov. Jeho správa sa však roztrhala na štyri pásiky. Zoraďte ich podľa čísiel v rohoch a prečítajte, kde čaká ďalšia stopa.</p><p class=\"instructions no-print\">Game master: pásiky vopred vystrihnite a premiešajte. Hornú časť s príbehom a obrázkami priložte k pásikom do obálky 3 na stole.</p><div class=\"strip\" data-order=\"3\"><span>3</span> KUBOV PLÁN.</div><div class=\"strip\" data-order=\"1\"><span>1</span> STÔL</div><div class=\"strip\" data-order=\"4\"><span>4</span> TERAZ HO OTVORTE.</div><div class=\"strip\" data-order=\"2\"><span>2</span> SKRÝVA</div><p class=\"note\">Keď odkaz zložíte, zadajte do telefónu hlavné miesto z odkazu. Až potom otvorte samostatný obal s Kubovým plánom P5.</p><span class=\"footer\">ZÁHADA U VÁS DOMA · LÍSTKOV ROZTRHANÝ ODKAZ · P4</span></section>",
  "p5": "<section class=\"sheet\" id=\"p5\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:33.333333333333336%;--sprite-y:100%\"></span><div class=\"label\">P5 / Obálka 3 / Kubova mapa signálu</div><h2>Nájdite cestu k jadru.</h2><p>Kubo podľa tohto plánu postaví návratovú cestu medzi obrazovkami. Prstom sledujte potrubie od VSTUPU k JADRU. Zapíšte tri čísla, ktorými vedie úspešná cesta, v poradí od vstupu. Čísla v slepých odbočkách preskočte.</p><svg class=\"maze\" viewBox=\"0 0 600 400\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"Potrubný plán. Hlavná trasa od vstupu cez 2, 4, 6 do jadra. Vedľajšie vetvy s 8 a 1 končia zaslepené.\"><g fill=\"none\" stroke=\"#445f53\" stroke-width=\"18\" stroke-linejoin=\"round\"><path d=\"M35 80H140V270H290V150H420V310H535\"/><path d=\"M140 140H260V55H380M290 220H360V350H235\"/></g><g fill=\"none\" stroke=\"#fdfcf2\" stroke-width=\"10\" stroke-linejoin=\"round\"><path d=\"M35 80H140V270H290V150H420V310H535\"/><path d=\"M140 140H260V55H380M290 220H360V350H235\"/></g><path d=\"M380 43v24M235 338v24\" stroke=\"#263c36\" stroke-width=\"5\"/><g fill=\"#fffdf7\" stroke=\"#445f53\" stroke-width=\"2\"><circle cx=\"140\" cy=\"205\" r=\"22\"/><circle cx=\"290\" cy=\"175\" r=\"22\"/><circle cx=\"420\" cy=\"250\" r=\"22\"/><circle cx=\"260\" cy=\"90\" r=\"22\"/><circle cx=\"360\" cy=\"305\" r=\"22\"/><circle cx=\"535\" cy=\"310\" r=\"37\"/></g><g text-anchor=\"middle\" fill=\"#263c36\" font-family=\"monospace\" font-size=\"24\"><text x=\"140\" y=\"213\">2</text><text x=\"290\" y=\"183\">4</text><text x=\"420\" y=\"258\">6</text><text x=\"260\" y=\"98\">8</text><text x=\"360\" y=\"313\">1</text><text x=\"535\" y=\"316\" font-size=\"15\">JADRO</text><text x=\"60\" y=\"50\" font-size=\"15\">VSTUP ↓</text></g></svg><div class=\"note\">Kubov odkaz pre Ryška:<br><strong>Nočný pokoj. Denné svetlo. Večerná hviezda.</strong><br>Toto je pozdrav pre Ryška. Pomôže vám obnoviť jeho slabý signál. Poradie si nechajte na ďalšiu úlohu.</div><span class=\"footer\">ZÁHADA U VÁS DOMA · KUBOVA MAPA SIGNÁLU · P5</span></section>",
  "p6": "<section class=\"sheet\" id=\"p6\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:0.0%;--sprite-y:0%\"></span><div class=\"label\">P6 / Obálka 4 / Sľub Pixelkov</div><h2>Začiatky prezradia najviac.</h2><p>Ochranné pole nás chránilo celý čas. Pred návratom do jeho bežného režimu musia byť všetci doma, aj Piko. Prvé písmená nášho sľubu vám pripomenú, ako to dokážeme. — Piko</p><div class=\"poem\"><div><strong>S</strong>polu spojíme svoje schopnosti.</div><div><strong>P</strong>riateľov nenecháme stratených.</div><div><strong>O</strong>dvahu si môžeme požičať.</div><div><strong>L</strong>en celá partia sa vráti domov.</div><div><strong>U</strong>kryjeme svet za svetielkami.</div></div><div class=\"card\"><span class=\"label\">Karta poradia / odložiť na finále</span><p>Písmená z úloh</p><strong>1 → 2 → 3 → 4 → 5 → 6</strong><p style=\"font-size:14px\">Šesť písmen. Jedno návratové heslo.</p></div><span class=\"footer\">ZÁHADA U VÁS DOMA · ZÁCHRANNÉ LISTY · P6</span></section>",
  "diplom": "<section class=\"sheet diploma\" id=\"diplom\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:0%;--sprite-y:0%\"></span><div class=\"label\">Pixelkovia / Stratený signál / Čestný tím záchrancov</div><h2>Veľké záhady<br>riešime spolu.</h2><p>Tento diplom patrí tímu</p><div class=\"write-line\"></div><p>za dôvtip, spoluprácu a bezpečný návrat všetkých siedmich Pixelkov.</p><div style=\"font-size:70px;margin:50px 0\">✧</div><p><em>„Každý vie niečo, bez čoho by to nešlo.“</em></p><p>Váš Piko</p><span class=\"footer\">ZÁHADA U VÁS DOMA · DIPLOM ZÁCHRANCOV PIXELKOV</span></section>"
};
  sheets.p2=sheets.p2.replaceAll('__ISKRIN_ODKAZ__',window.GAME.stages[2].ciphertext);
  // Story paragraphs are rendered from the same source as the phone game.
  const story=(id)=>window.STORY_TEXT.html(id);
  sheets.p1=sheets.p1.replace('PIXELKOVIA / ÚLOHA KÚPEĽŇA / OBÁLKA KÚPEĽŇA','PIXELKOVIA / P1');
  sheets.p1=sheets.p1.replace(/<div class="kvak-print-story">[\s\S]*?(<\/div>\n<div class="kvak-print-mission">)/, '<div class="kvak-print-story">'+window.STORY_TEXT.party('envelope')+'<h3>Kvakov odkaz</h3>'+story('envelope')+'$1');
  const sheetStages={p1:'envelope',p2:'document',p3:'symbols',p4:'cipher',p5:'maze',p6:'search'};
  for(const [id,stageId] of Object.entries(sheetStages)) {
    const stage=window.GAME.stages.find(stage=>stage.id===stageId);
    sheets[id]=sheets[id].replace(/(<div class="label">)([^<]+)/, '$1'+stage.label+' / $2');
    if(id!=='p1') {
      sheets[id]=sheets[id].replace('class="sheet"','class="sheet story-sheet"');
      sheets[id]=sheets[id].replace(/<span class="sheet-avatar"[^>]*><\/span>/,'');
      sheets[id]=sheets[id].replace(/(<h2>[\s\S]*?<\/h2>)/,'$1'+window.STORY_TEXT.party(stageId)+story(stageId));
    }
  }
  sheets.p2=sheets.p2.replace('Iskra vie odhaliť skryté značky. Jej zašifrovaný odkaz prečítate pomocou dvoch kruhov. ','');
  sheets.p3=sheets.p3.replace('Šutko udrží priechod pevný pre celú partiu. Vysiela pomocou tvarov. ','');
  sheets.p4=sheets.p4.replace('Lístok rozumie reči signálov. Jeho správa sa však roztrhala na štyri pásiky. ','');
  sheets.p5=sheets.p5.replace('Kubo podľa tohto plánu postaví návratovú cestu medzi obrazovkami. ','');
  sheets.p5=sheets.p5.replace('<div class="note">Kubov odkaz pre Ryška:', '<div class="note"><h3>'+window.GAME.stages[6].label+' / Ryškov pozdrav</h3>'+window.STORY_TEXT.party('digital')+story('digital')+'Kubov odkaz pre Ryška:');
  sheets.p6=sheets.p6.replace('<p>Ochranné pole nás chránilo celý čas. Pred návratom do jeho bežného režimu musia byť všetci doma, aj Piko. Prvé písmená nášho sľubu vám pripomenú, ako to dokážeme. — Piko</p>','');
  sheets.p6=sheets.p6.replace('<span class="label">Karta poradia / odložiť na finále</span>','<span class="label">'+window.GAME.stages[8].label+' / Karta poradia</span>'+story('code'));
  // P2–P6 use the same framed story, mission and signal-sheet language as Kvak's P1.
  const storyTitles={document:'Iskrin odkaz',symbols:'Šutkov odkaz',cipher:'Lístkov odkaz',maze:'Kubov odkaz',search:'Pikov odkaz'};
  const puzzleHeading=(title,detail='')=>`<div class="worksheet-puzzle-heading"><h3>${title}</h3>${detail?`<span>${detail}</span>`:''}</div>`;
  for(const [id,stageId] of Object.entries(sheetStages)) {
    if(id==='p1')continue;
    let html=sheets[id];
    const stage=window.GAME.stages.find(item=>item.id===stageId);
    const envelopeLabel=html.match(/<div class="label">([^<]+)<\/div>/)[1].replace(stage.label+' / ','');
    html=html.replace(/<div class="label">[\s\S]*?<\/div>(<h2>[\s\S]*?<\/h2>)/,`<div class="worksheet-heading"><div class="label">PIXELKOVIA / ${stage.label} / ${id.toUpperCase()}</div>$1<span class="print-wave" aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▂ ▇ ▄</span></div>`);
    const storyBlock=window.STORY_TEXT.party(stageId)+story(stageId);
    const framedStory=`<section class="worksheet-story"><h3>${storyTitles[stageId]}</h3>${storyBlock}</section>`;
    html=html.replace(storyBlock,framedStory);
    const missionStart=html.indexOf(framedStory)+framedStory.length;
    let remainder=html.slice(missionStart);
    if(id==='p6')remainder=`<section class="worksheet-mission"><h3>VAŠA MISIA</h3><p>${stage.task}</p></section>`+remainder;
    else remainder=remainder.replace(/^<p>([\s\S]*?)<\/p>/,'<section class="worksheet-mission"><h3>VAŠA MISIA</h3><p>$1</p></section>');
    html=html.slice(0,missionStart)+remainder;
    html=html.replace(/<p class="note">([\s\S]*?)<\/p>/,'<section class="worksheet-next"><h3>KEĎ TO VYRIEŠITE</h3><p class="note">$1</p></section>');
    if(id==='p2') {
      html=html.replace(/<span class="print-wave"[^>]*>[\s\S]*?<\/span>/,'<div class="worksheet-entry-qr"><img src="assets/iskra-qr.svg" alt="QR kód na otvorenie Iskrinej úlohy" width="80" height="80"><small>NAČÍTAJTE QR</small></div>');
      html=html.replace('<div class="circles" id="circles"></div>',`<section class="worksheet-puzzle decoder-puzzle">${puzzleHeading('DVA KRUHY. JEDEN STROJ.','VYSTRIHNITE PO VONKAJŠEJ ČIARE')}<div class="circles" id="circles"></div></section>`);
      html=html.replace(/(<div class="code"[^>]*>[\s\S]*?<\/div>)/,`<section class="worksheet-secret">${puzzleHeading('TAJNÁ SPRÁVA')}$1</section><section class="worksheet-answer" aria-label="Miesto na zapísanie rozlúštenej správy"><h3>ROZLÚŠTENÁ SPRÁVA</h3><div class="decoded-writing-line" aria-hidden="true"></div></section>`);
    }
    if(id==='p3') {
      const equations=html.match(/<div class="equations">[\s\S]*?<\/div><\/div>/)[0];
      const clues=[...equations.matchAll(/<div>([^<]+)<\/div>/g)].slice(0,3).map((match,index)=>[match[1],['△','○','□'][index]]);
      html=html.replace(/<div class="equations">[\s\S]*?<\/div><\/div>/,`<section class="worksheet-puzzle symbol-puzzle">${puzzleHeading('ŠUTKOV ZÁMOK','ROVNAKÝ TVAR = ROVNAKÁ HODNOTA')}<div class="equations">${clues.map(([equation,symbol],index)=>`<div class="equation-clue"><span class="equation-number">0${index+1}</span><div>${equation}</div><p class="equation-working">${symbol} = <span aria-label="Miesto na poznámku"></span></p></div>`).join('')}</div><div class="equation-result"><h3>VÝSLEDNÉ ČÍSLO</h3><div>△ + ○ + □ = <span class="result-box" aria-label="Zapíšte výsledok">?</span></div><p>Výsledok zadajte do hry v telefóne.</p></div></section>`);
    }
    if(id==='p4')html=html.replace(/((?:<div class="strip"[\s\S]*?<\/div>){4})/,`<section class="worksheet-puzzle strip-puzzle">${puzzleHeading('ŠTYRI KÚSKY ODKAZU','✂ STRIHAJTE IBA PO PRERUŠOVANÝCH ČIARACH')}$1</section>`);
    if(id==='p5') {
      html=html.replace(/(<svg class="maze"[\s\S]*?<\/svg>)/,`<section class="worksheet-puzzle maze-puzzle">${puzzleHeading('NÁVRATOVÁ CESTA','OD VSTUPU AŽ K JADRU')}$1</section>`);
      html=html.replace('<div class="note">','<div class="note worksheet-companion">');
    }
    if(id==='p6')html=html.replace(/(<div class="poem">[\s\S]*?<\/div><\/div>)/,`<section class="worksheet-puzzle pledge-puzzle">${puzzleHeading('NÁŠ SPOLOČNÝ SĽUB','ČÍTAJTE ZAČIATKY RIADKOV')}$1</section>`);
    html=html.replace(/<span class="footer">[^<]+<\/span>/,`<span class="footer">PIXELKOVIA · ${envelopeLabel}</span>`);
    sheets[id]=html;
  }
  const illustratedScenes={
    p1:{file:'p1-kvak-piko',caption:'Hľadáme spoločné spojenie.',alt:'Piko volá cez komunikátor a Kvak načúva slabému signálu.'},
    p2:{file:'p2-iskra',caption:'Posvietim nám na ďalšiu stopu.',alt:'Iskra svieti na dekódovací stroj a Piko s Kvakom jej pomáhajú.'},
    p3:{file:'p3-sutko',caption:'Podržím most, aby sme mohli ísť spolu.',alt:'Šutko podopiera most a pomáhajú mu Piko, Kvak a Iskra.'},
    p4:{file:'p4-listok',caption:'Spolu prečítame môj odkaz.',alt:'Lístok skúma knižku a pásiky spolu s Pikom, Kvakom, Iskrou a Šutkom.'},
    p5:{file:'p5-kubo-rysko',caption:'Opravujeme cestu a hľadáme Ryška.',alt:'Kubo s piatimi kamarátmi opravuje cestu a na jej konci sa ozýva Ryško.'},
    p6:{file:'p6-spolocny-navrat',caption:'Spolu sa pripravujeme na cestu domov.',alt:'Všetkých sedem Pixelkov spája svoje schopnosti pri návratovej bráne.'}
  };
  function speakerPortrait(stageId) {
    const stage=window.GAME.stages.find(item=>item.id===stageId);
    const character=window.GAME.characters.find(item=>item.id===(stage.character||'piko'));
    return `<figure class="worksheet-speaker"><span class="party-sprite worksheet-speaker-avatar" role="img" aria-label="${character.name}" style="--sprite-x:${character.tile%4*100/3}%;--sprite-y:${character.tile>=4?100:0}%"></span><figcaption>${character.name}</figcaption></figure>`;
  }
  for(const [id,stageId] of Object.entries(sheetStages)) {
    const scene=illustratedScenes[id];
    const illustration=`<figure class="worksheet-scene" data-scene="${scene.file}"><div class="worksheet-scene-label">SPOLU V PRÍBEHU</div><img src="assets/printable-scenes/${scene.file}.png" alt="${scene.alt}" width="1536" height="512"><figcaption>${scene.caption}</figcaption></figure>`;
    let html=sheets[id].replace(window.STORY_TEXT.party(stageId),speakerPortrait(stageId));
    if(id==='p5')html=html.replace(window.STORY_TEXT.party('digital'),speakerPortrait('digital'));
    const mission=id==='p1'?/<div class="kvak-print-mission">[\s\S]*?<\/ol><\/div>/:/<section class="worksheet-mission">[\s\S]*?<\/section>/;
    html=html.replace(mission,match=>`<div class="worksheet-visual-row">${match}${illustration}</div>`);
    if(id==='p1')html=html.replace('KVAKOVE<br>ROZHÁDZANÉ SIGNÁLY','KVAKOVE ROZHÁDZANÉ SIGNÁLY');
    sheets[id]=html;
  }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bathroom = {
    label: 'Úloha 1 – Kúpeľňa',
    placement: 'Stopu k úlohe Kúpeľňa schovajte medzi zložené uteráky, do dostupnej skrinky s uterákmi alebo za ľahký košík na suchej poličke. Po obnovení spojenia pokračujú deti QR kódom z P2.',
    hint: 'Deti vystrihnú a otočia šesť signálov. Zoradia ich od najstaršieho po najnovší: najskôr mesiac a deň, pri rovnakom dátume presný čas.'
  };
  const parentInstructions = {
    intro: {label:'Úvod', placement:'Telefón so spustenou hrou položte tam, kde ho deti objavia. Pikovo video si môžu prehrať aj viackrát. Nech samy zistia, kam ísť. Úvod končí videom; ďalej pokračujú QR kódom z P1.', hint:'Ak váhajú, nech si znova prehrajú záver Pikovej videosprávy.'},
    envelope: bathroom,
    document: {label:'Úloha pri okne · Iskra', placement:'P2 ukryte pri zatvorenom okne na dosah detí. Deti načítajú QR z P2 a po rozlúštení potvrdia nájdenie obálky Úloha 3.', hint:'Nastavte vonkajšie D oproti vnútornému A. Vonkajšie písmená odkazu čítajte na vnútornom kruhu.'},
    symbols: {label:'Úloha pod stoličkou · Šutko', placement:'P3 vložte do obálky Úloha 3 a prilepte pod sedadlo stoličky. P6 patrí pod inú stoličku v uzavretej obálke Úloha 7. Pomôžte s odlepením; nábytok sa nepresúva.', hint:'Rovnaký tvar má vždy rovnakú hodnotu. Začnite dvojicou trojuholníkov.'},
    cipher: {label:'Úloha pri stole · Lístok', placement:'Na stole je P4: horná časť s príbehom a štyri premiešané pásiky. P5 zostáva zvlášť uzavretý až do vyriešenia odkazu.', hint:'Malé čísla určujú poradie pásikov od 1 po 4. Zložená veta ukáže miesto s Kubovým plánom.'},
    maze: {label:'Kubova cesta · P5', placement:'Stopu P5 nechajte na stole uzavretú s označením „Úloha 5 – otvoriť po zložení odkazu“. Sprístupnite ju až po Lístkovej úlohe.', hint:'Sledujte potrubie od vstupu k jadru. Čísla v slepých odbočkách preskočte.'},
    digital: {label:'Ryškov pozdrav · P5', placement:'Novú obálku netreba. Nechajte deti čítať pozdrav pod Kubovým plánom P5 a zvoliť symboly v telefóne.', hint:'Nočný pokoj, denné svetlo a večerná hviezda určujú tri symboly aj ich poradie.'},
    search: {label:'Úloha pod stoličkou · Sľub', placement:'P6 je pod inou stoličkou než P3. Obálku 4 označte Úloha 7 – otvoriť až po Ryškovom pozdrave. Pri skoršom nájdení zostáva zatvorená.', hint:'Nech čítajú prvé písmená piatich riadkov zhora nadol. Kartu poradia si odložia.'},
    code: {label:'Spoločné heslo · P6', placement:'Novú stopu netreba. Použite kartu poradia P6 a písmená uložené v telefóne. Nech heslo vysloví celý tím.', hint:'Zoraďte šesť písmen podľa úloh 1 až 6. Šípka ani fajka do hesla nepatria.'},
    finale: {label:'Finále', placement:'Oslávte pomoc každého člena tímu, doplňte názov tímu na voliteľný diplom. Atlas si môžete prezrieť spolu.', hint:'Hra nemá časový limit. Nápovedy dávajte postupne; riešenia si nechajte pre seba.'}
  };
  for(const stage of window.GAME.stages)parentInstructions[stage.id].label=stage.label;
  function adultHelp(id='envelope', compact=false) {
    const entry=parentInstructions[id];
    return `<section class="adult-help" data-stage="${esc(id)}" aria-label="Inštrukcie pre Game mastra">${compact?'':'<h3>Inštrukcie pre Game mastra</h3>'}<p><strong>Spustenie:</strong> ${esc(entry.placement)}</p><p><strong>Nápoveda:</strong> ${esc(entry.hint)}</p>${entry.safety?`<p class="adult-safety">${esc(entry.safety)}</p>`:''}</section>`;
  }
  function solutionAnswer(stage) {
    if(stage.paperOnly)return stage.paperAnswer;
    const symbols={moon:'mesiac',sun:'slnko',star:'hviezda'};
    return (stage.answer||[]).map(answer=>answer.includes(',')?answer.split(',').map(value=>symbols[value]||value).join(' → '):answer).join(' / ');
  }
  function stageSolution(id,compact=false) {
    const stage=GAME.stages.find(stage=>stage.id===id),answer=solutionAnswer(stage);
    const text=compact&&id!=='envelope'?(id==='intro'?'Prvá obálka je v kúpeľni.':`${answer||'Úspech tímu'}.`):stage.solution;
    return `<p class="gm-solution${compact?' guide-answer':''}" aria-label="Riešenie etapy"><strong>Riešenie:</strong> ${esc(text)}</p>`;
  }
  function gameMasterInstructions(id,compact=false) {
    return `<section class="storyboard-solution gm-instructions" aria-label="Inštrukcie pre Game mastra">${compact?'':'<h3>Inštrukcie pre Game mastra</h3>'}${adultHelp(id,true)}${stageSolution(id,compact)}</section>`;
  }
  const bathroomSolution=()=>stageSolution('envelope');
  const bathroomInstructions=(compact=false)=>gameMasterInstructions('envelope',compact);
  function summary(id,stageId) {
    const document=new DOMParser().parseFromString(sheets[id]||'', 'text/html');
    if(id==='p1') {
      const story=document.querySelector('.kvak-print-story');story.querySelector('.sheet-avatar')?.remove();
      return story.innerHTML+document.querySelector('.kvak-print-mission').innerHTML;
    }
    const sheet=document.querySelector('.sheet');
    sheet.querySelectorAll('.quest-party figcaption').forEach(node=>node.remove());
    if(stageId==='digital')return sheet.querySelector('.note').outerHTML;
    if(stageId==='code')return sheet.querySelector('.card').outerHTML;
    sheet.querySelector('.worksheet-heading .label')?.remove();
    sheet.querySelector('.worksheet-heading .print-wave')?.remove();
    sheet.querySelectorAll('.sheet-avatar,.footer,.no-print,.worksheet-scene,svg,.circles').forEach(node=>node.remove());
    return sheet.innerHTML;
  }
  function parentGuide() {
    const materials={intro:'Telefón',envelope:'P1',document:'P2',symbols:'P3',cipher:'P4',maze:'P5',digital:'P5 · bez novej obálky',search:'P6',code:'P6 · karta poradia',finale:'Diplom · voliteľný'};
    const cards=GAME.stages.map((stage,index)=>{
      const character=GAME.characters.find(item=>item.id===stage.character)||GAME.characters[0];
      return `<section class="guide-stage" data-stage="${esc(stage.id)}"><div class="guide-stage-heading"><span class="guide-step ${index===0||index===9?'guide-step-label':''}" aria-hidden="true">${index===0?'ŠTART':index===9?'CIEĽ':String(index).padStart(2,'0')}</span><div><h3>${esc(parentInstructions[stage.id].label)}</h3><span class="guide-material">${esc(materials[stage.id])}</span></div><span class="guide-avatar" role="img" aria-label="${esc(character.name)}" style="--sprite-x:${character.tile%4*100/3}%;--sprite-y:${character.tile>=4?100:0}%"></span></div>${gameMasterInstructions(stage.id,true)}</section>`;
    });
    return `<section class="sheet parent-guide" id="rodicovsky-navod"><header class="guide-heading"><div><div class="label">PIXELKOVIA / LEN PRE DOSPELÝCH</div><h2>Návod pre Game mastra</h2><p>Pripravte dobrodružstvo. Potom už len pomáhajte, keď treba.</p></div><div class="guide-stamp">RODIČOVSKÝ<br><strong>ŤAHÁK</strong><span>ÚVOD → ÚLOHY 1–8 → FINÁLE</span></div></header><div class="guide-intro"><section><h3><span>1</span> Vytlačte</h3><p>Ak môžete, tlačte farebne – podklady budú krajšie. Hru však plnohodnotne zahráte aj s čiernobielou tlačou. Tlačte jednostranne na A4, v mierke 100 %.</p></section><section><h3><span>2</span> Pripravte pomôcky</h3><p>Pre deti pripravte detské nožnice a ceruzku. Z P4 vystrihnite štyri pásiky a premiešajte; priložte aj hornú časť s príbehom. P1 a kruhy P2 vystrihujú až deti. P3 a P5 nechajte samostatne uzavreté podľa pokynov nižšie.</p></section><section><h3><span>3</span> Zabaľte a ukryte</h3><p>Jednotlivé stopy vložte do obálok alebo škatuľiek, previažte stužkou, mašľou či gumičkou a až potom ich schovajte. Deti tak objavia balíček, nie iba voľný papier.</p></section></div><aside class="guide-safety"><strong>Bezpečné úkryty</strong><p>Vyberajte suché miesta na dosah detí. Stopy nedávajte do práčky ani sušičky, k elektrickým zariadeniam, liekom alebo čistiacim prostriedkom.</p></aside><div class="guide-section-label"><span>PRIEBEH HRY KROK ZA KROKOM</span><span>Nápovedu ponúkajte postupne. Riešenia si nechajte pre seba.</span></div><div class="guide-stages"><div class="guide-column">${cards.slice(0,5).join('')}</div><div class="guide-column">${cards.slice(5).join('')}</div></div><footer class="footer"><span>PIXELKOVIA · GAME MASTER · ÚVOD A VŠETKY ÚLOHY</span><span>Tento návod si nechajte pri sebe.</span></footer></section>`;
  }
  window.PRINT_MATERIALS={sheets,bathroom,parentInstructions,summary,adultHelp,stageSolution,gameMasterInstructions,bathroomSolution,bathroomInstructions,parentGuide};
})();
