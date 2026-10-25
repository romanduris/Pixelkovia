/* Single source for printable worksheets and their storyboard copy. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sheets = {
  "p1": "<section class=\"sheet miky-sheet\" id=\"p1\" aria-labelledby=\"miky-sheet-title\">\n<div class=\"miky-retained\">\n<div class=\"miky-print-heading\"><div class=\"label\">PIXELKOVIA / ÚLOHA KÚPEĽŇA / INDÍCIA KÚPEĽŇA</div><h2 id=\"miky-sheet-title\">MIKYHO<br>ROZHÁDZANÉ SIGNÁLY</h2><span class=\"print-wave\" aria-hidden=\"true\">▂ ▄ ▆ ▃ ▅ ▂ ▇ ▄</span></div>\n<div class=\"miky-print-story\"><span class=\"sheet-avatar miky-print-avatar\" role=\"img\" aria-label=\"Miky – oficiálna postavička Pixelkov\" style=\"--sprite-x:33.333333333333336%;--sprite-y:0%\"></span><h3>Ahojte, ľudskí pomocníci!</h3><p>Ja som <strong>Miky</strong>, pixelkovský zachytávač signálov. Počujem aj veľmi slabé správy, ktoré ostatní Pixelkovia nevidia ani nepočujú.</p><p>Môj signál sa rozpadol a <strong>neviem sa spojiť s Pikom ani s ostatnými kamarátmi</strong>. Zachytil som šesť kúskov svojej správy, ale pomiešali sa!</p><p>Ak záznamy zoradíte podľa toho, <strong>kedy vznikli – od najstaršieho po najnovší</strong>, ich číslice vytvoria kód na obnovenie môjho spojenia. Prosím, pomôžte mi spojiť sa s ostatnými!</p></div>\n<div class=\"miky-print-mission\"><h3>VAŠA MISIA</h3><ol><li><strong>Vystrihnite všetkých šesť signálov</strong> po prerušovaných čiarach.</li><li><strong>Otočte ich</strong> tak, aby ste prečítali dátum, čas aj číslicu.</li><li><strong>Zoraďte ich od najstaršieho po najnovší.</strong> Všetky sú z rovnakého roka.</li><li>Prečítajte číslice v tomto poradí a <strong>zapíšte šesťmiestny kód</strong>.</li><li><strong>Naskenujte QR kód</strong> telefónom a na otvorenej stránke <strong>skúste zadať svoj kód</strong>.</li></ol></div>\n<div class=\"miky-print-controls\"><div class=\"miky-code-panel\"><h3>KÓD NA OBNOVENIE SPOJENIA</h3><div class=\"code-boxes\" aria-label=\"Šesť prázdnych políčok na kód\"><span></span><span></span><span></span><span></span><span></span><span></span></div><p>Zapíšte číslice z ústrižkov v poradí od najstaršieho záznamu po najnovší.</p></div><div class=\"miky-qr-panel\"><div class=\"qr-mockup\"><img src=\"assets/miky-qr.svg\" alt=\"QR kód na otvorenie Mikyho signálu\" width=\"72\" height=\"72\"><small>OTVORIŤ MIKYHO SIGNÁL</small></div><div><h3>AKTIVOVAŤ MIKYHO SIGNÁL</h3><p>Naskenujte QR kód telefónom. Na otvorenej stránke skúste zadať svoj šesťmiestny kód.</p></div></div></div>\n</div>\n<div class=\"miky-cut-divider\"><span>✂ TU ODDEĽTE SIGNÁLY · HORNÚ ČASŤ SI ODLOŽTE</span></div>\n<div class=\"cutouts-heading\"><strong>ŠESŤ KÚSKOV STRATENÉHO SIGNÁLU</strong><span>Vystrihnite jednotlivé rámiky.</span></div>\n<div class=\"signal-cutouts\"><div class=\"signal-cutout\" data-date=\"14. 6.\" data-time=\"19:50\" data-digit=\"2\" style=\"--rotation:90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>14. 6.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>19:50</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>2</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"13. 3.\" data-time=\"20:10\" data-digit=\"4\" style=\"--rotation:180deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>13. 3.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>20:10</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>4</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"15. 12.\" data-time=\"08:40\" data-digit=\"6\" style=\"--rotation:-90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>15. 12.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>08:40</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>6</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"13. 3.\" data-time=\"20:15\" data-digit=\"1\" style=\"--rotation:-90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>13. 3.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>20:15</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>1</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"15. 9.\" data-time=\"08:35\" data-digit=\"9\" style=\"--rotation:90deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>15. 9.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>08:35</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>9</b></div></div></div>\n<div class=\"signal-cutout\" data-date=\"13. 3.\" data-time=\"20:05\" data-digit=\"7\" style=\"--rotation:180deg\"><span class=\"cut-mark\" aria-hidden=\"true\">✂</span><div class=\"cutout-content\"><span class=\"record-label\">ZÁZNAM SIGNÁLU</span><div class=\"record-date\"><small>DÁTUM</small><strong>13. 3.</strong></div><div class=\"record-time\"><small>PRESNÝ ČAS</small><strong>20:05</strong></div><div class=\"record-digit\"><small>ČÍSLICA</small><b>7</b></div></div></div></div>\n\n<span class=\"footer\">ZÁHADA U VÁS DOMA · MIKYHO ZÁCHRANNÝ SIGNÁL</span></section>",
  "p2": "<section class=\"sheet\" id=\"p2\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:66.66666666666667%;--sprite-y:0%\"></span><div class=\"label\">Úloha 2 / Indícia pri okne / Pixiin dekódovací stroj</div><h2>Pixiin dekódovací stroj</h2><p>Pixi vie odhaliť skryté značky. Jej zašifrovaný odkaz prečítate pomocou dvoch kruhov. Vystrihnite oba kruhy po vonkajšej čiare a menší položte doprostred väčšieho. Nastavte <strong>vonkajšie D oproti vnútornému A</strong>. Stred pridržte prstom. Pre každé písmeno správy na vonkajšom kruhu prečítajte písmeno na vnútornom.</p><div class=\"circles\" id=\"circles\"></div><div class=\"code\" data-ciphertext=\"__PIXIIN_ODKAZ__\" data-shift=\"-3\">__PIXIIN_ODKAZ__</div><p class=\"note\">Rozlúštite celú vetu a choďte podľa nej hľadať ďalšiu indíciu.</p><p class=\"instructions\">Abeceda má 26 písmen A–Z, bez diakritiky. Medzera zostáva medzerou. Strihajte pod dohľadom dospelého; stred netreba prepichovať.</p><span class=\"footer\">ZÁHADA U VÁS DOMA · PIXIIN DEKÓDOVACÍ STROJ</span></section>",
  "p3": "<section class=\"sheet\" id=\"p3\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:100.0%;--sprite-y:0%\"></span><div class=\"label\">Úloha 3 / Indícia pod stoličkou / Plugyho symboly</div><h2>PLUGYHO DIGITÁLNY ZÁMOK</h2><p>Plugy obnovuje digitálne spojenia. Zistite hodnotu každého tvaru a zapíšte ju pod rovnicu. Rovnaký tvar má vždy rovnakú hodnotu. Keď budete mať všetky tri hodnoty, naskenujte QR kód v spodnej časti listu a pokračujte na otvorenej stránke.</p><div class=\"equations\"><div>△ + △ = 6</div><div>○ + △ = 5</div><div>□ + ○ = 6</div></div><p class=\"note\">Po odomknutí mosta si vypočujte alebo prečítajte Plugyho správu. Telefón vám ukáže, kam ďalej.</p><span class=\"footer\">ZÁHADA U VÁS DOMA · ZÁCHRANNÉ LISTY</span></section>",
  "p4": "<section class=\"sheet\" id=\"p4\"><div class=\"label\">Úloha 4 / Indícia pri topánkach / Doručte stratenú správu</div><h2>Doručte stratenú správu</h2><p>__DELIVERY_GUIDE__</p>__DELIVERY_MAP__<section class=\"delivery-answer\"><h3>Ďalšia indícia sa skrýva v tvojej:</h3><div class=\"code-boxes\"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div><p>Choďte podľa doručenej správy hľadať. Telefón teraz nepotrebujete.</p></section>__DELIVERY_REWARD__<span class=\"footer\">PIXELKOVIA · SVETELNÉ UZLY</span></section>",
  "p5": "<section class=\"sheet\" id=\"p5\"><div class=\"label\">Úloha 5 / Indícia v posteli / Čipkov zápisník</div><h2>Štyri hry. Jeden tajný úkryt.</h2><p>Naskenujte QR a zahrajte štyri hry. Po každej zapíšte číslicu do políčka. V kľúči nájdite jej časť slova a prepíšte ju do tajničky v rovnakom poradí.</p>__CIPKO_WORKBOOK__<p class=\"note\">Teraz choďte hľadať ďalšiu indíciu do úkrytu, ktorý ste práve odhalili.</p><span class=\"footer\">PIXELKOVIA · ČIPKOV ZÁPISNÍK</span></section>",
  "p6": "",
  "diplom": "<section class=\"sheet diploma\" id=\"diplom\"><span class=\"sheet-avatar\" aria-hidden=\"true\" style=\"--sprite-x:0%;--sprite-y:0%\"></span><div class=\"label\">Pixelkovia / Stratený signál / Čestný tím záchrancov</div><h2>Veľké záhady<br>riešime spolu.</h2><p>Tento diplom patrí tímu</p><div class=\"write-line\"></div><p>za dôvtip, spoluprácu a bezpečný návrat všetkých siedmich Pixelkov.</p><div style=\"font-size:70px;margin:50px 0\">✧</div><p><em>„Každý vie niečo, bez čoho by to nešlo.“</em></p><p>Váš Piko</p><span class=\"footer\">ZÁHADA U VÁS DOMA · DIPLOM ZÁCHRANCOV PIXELKOV</span></section>"
};
  sheets.p2=sheets.p2.replaceAll('__PIXIIN_ODKAZ__',window.GAME.stages[2].ciphertext);
  // Story paragraphs are rendered from the same source as the phone game.
  const story=(id)=>window.STORY_TEXT.html(id);
  sheets.p1=sheets.p1.replace('PIXELKOVIA / ÚLOHA KÚPEĽŇA / INDÍCIA KÚPEĽŇA','PIXELKOVIA');
  sheets.p1=sheets.p1.replace(/<div class="miky-print-story">[\s\S]*?(<\/div>\n<div class="miky-print-mission">)/, '<div class="miky-print-story">'+window.STORY_TEXT.party('envelope')+'<h3>Mikyho odkaz</h3>'+story('envelope')+'$1');
  const sheetStages={p1:'envelope',p2:'document',p3:'symbols',p4:'cipher',p5:'maze'};
  for(const [id,stageId] of Object.entries(sheetStages)) {
    const stage=window.GAME.stages.find(stage=>stage.id===stageId);
    sheets[id]=sheets[id].replace(/(<div class="label">)([^<]+)/, '$1'+stage.label+' / $2');
    if(id!=='p1') {
      sheets[id]=sheets[id].replace('class="sheet"','class="sheet story-sheet"');
      sheets[id]=sheets[id].replace(/<span class="sheet-avatar"[^>]*><\/span>/,'');
      sheets[id]=sheets[id].replace(/(<h2>[\s\S]*?<\/h2>)/,'$1'+window.STORY_TEXT.party(stageId)+story(stageId));
    }
  }
  sheets.p2=sheets.p2.replace('Pixi vie odhaliť skryté značky. Jej zašifrovaný odkaz prečítate pomocou dvoch kruhov. ','');
  sheets.p3=sheets.p3.replace('Plugy obnovuje digitálne spojenia. ','');
  sheets.p5=sheets.p5.replace('Čipko podľa tohto plánu postaví návratovú cestu medzi obrazovkami. ','');
  // Tasks 2–6 share the framed story and mission layout of the first worksheet.
  const storyTitles={document:'Pixiin odkaz',symbols:'Plugyho odkaz',cipher:'Pingyho odkaz',maze:'Čipkov odkaz',search:'Guardyho odkaz'};
  const puzzleHeading=(title,detail='')=>`<div class="worksheet-puzzle-heading"><h3>${title}</h3>${detail?`<span>${detail}</span>`:''}</div>`;
  for(const [id,stageId] of Object.entries(sheetStages)) {
    if(id==='p1')continue;
    let html=sheets[id];
    const stage=window.GAME.stages.find(item=>item.id===stageId);
    const envelopeLabel=html.match(/<div class="label">([^<]+)<\/div>/)[1].replace(stage.label+' / ','');
    html=html.replace(/<div class="label">[\s\S]*?<\/div>(<h2>[\s\S]*?<\/h2>)/,`<div class="worksheet-heading"><div class="label">PIXELKOVIA / ${stage.label}</div>$1<span class="print-wave" aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▂ ▇ ▄</span></div>`);
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
      const answerBoxes=stage.ciphertext.split(' ').map((word,index)=>`<span class="decoded-word" role="img" aria-label="Slovo ${index+1}: ${word.length} políčok">${Array.from(word,()=>'<span class="decoded-letter" aria-hidden="true"></span>').join('')}</span>`).join('');
      html=html.replace('<div class="circles" id="circles"></div>',`<section class="worksheet-puzzle decoder-puzzle">${puzzleHeading('DVA KRUHY. JEDEN STROJ.','VYSTRIHNITE PO VONKAJŠEJ ČIARE')}<div class="circles" id="circles"></div></section>`);
      html=html.replace(/(<div class="code"[^>]*>[\s\S]*?<\/div>)/,`<section class="worksheet-secret">${puzzleHeading('TAJNÁ SPRÁVA')}$1</section><section class="worksheet-answer" aria-label="Miesto na zapísanie rozlúštenej správy"><h3>ROZLÚŠTENÁ SPRÁVA</h3><div class="decoded-letter-boxes">${answerBoxes}</div></section>`);
    }
    if(id==='p3') {
      const equations=html.match(/<div class="equations">[\s\S]*?<\/div><\/div>/)[0];
      const clues=[...equations.matchAll(/<div>([^<]+)<\/div>/g)].slice(0,3).map((match,index)=>[match[1],['△','○','□'][index]]);
      html=html.replace(/<div class="equations">[\s\S]*?<\/div><\/div>/,`<section class="worksheet-puzzle symbol-puzzle">${puzzleHeading('PLUGYHO ZÁMOK','ROVNAKÝ TVAR = ROVNAKÁ HODNOTA')}<div class="equations">${clues.map(([equation,symbol],index)=>`<div class="equation-clue"><span class="equation-number">0${index+1}</span><div>${equation}</div><p class="equation-working">${symbol} = <span aria-label="Miesto na poznámku"></span></p></div>`).join('')}</div><div class="equation-result plugy-phone-panel"><div class="plugy-phone-copy"><h3>ROZSVIEŤTE TAJNÝ ZNAK</h3><p>Naskenujte QR kód. V telefóne vás čaká tabuľka s 5 stĺpcami a 7 riadkami. Ťuknite na všetky políčka s číslami troch tvarov. Správny výber odhalí znak, ktorý odomkne most.</p></div><div class="worksheet-entry-qr"><img src="assets/plugy-qr.svg" alt="QR kód na otvorenie Plugyho úlohy" width="92" height="92"><small>OTVORIŤ PLUGYHO ÚLOHU</small></div></div></section>`);
    }
    if(id==='p5') {
      html=html.replace(/(<svg class="maze"[\s\S]*?<\/svg>)/,`<section class="worksheet-puzzle maze-puzzle">${puzzleHeading('NÁVRATOVÁ CESTA','OD VSTUPU AŽ K JADRU')}$1</section>`);
      html=html.replace('<div class="note">','<div class="note worksheet-companion">');
    }
    if(id==='p6')html=html.replace(/(<div class="poem">[\s\S]*?<\/div><\/div>)/,`<section class="worksheet-puzzle pledge-puzzle">${puzzleHeading('NÁŠ SPOLOČNÝ SĽUB','ČÍTAJTE ZAČIATKY RIADKOV')}$1</section>`);
    html=html.replace(/<span class="footer">[^<]+<\/span>/,`<span class="footer">PIXELKOVIA · ${envelopeLabel}</span>`);
    sheets[id]=html;
  }
  const illustratedScenes={
    p1:{file:'p1-miky-piko',caption:'Hľadáme spoločné spojenie.',alt:'Piko volá cez komunikátor a Miky načúva slabému signálu.'},
    p2:{file:'p2-pixi',caption:'Posvietim nám na ďalšiu stopu.',alt:'Pixi svieti na dekódovací stroj a Piko s Mikym jej pomáhajú.'},
    p3:{file:'p3-plugy',caption:'Spojíme most, aby sme mohli ísť spolu.',alt:'Plugy obnovuje spojenie digitálneho mosta s pomocou Pika, Mikyho a Pixi.'},
    p4:{file:'p4-svetelne-uzly',caption:'Spolu obnovíme svetelné uzly.',alt:'Piko, Miky, Pixi, Plugy a Pingy spolu opravujú prerušené mostíky medzi svetelnými uzlami.'},
    p5:{file:'p5-cipko-guardy',caption:'Opravujeme cestu až k Guardyho bráne.',alt:'Čipko s piatimi kamarátmi opravuje cestu a na jej konci sa ozýva Guardy.'},
    p6:{file:'p6-spolocny-navrat',caption:'Spolu sa pripravujeme na cestu domov.',alt:'Všetkých sedem Pixelkov spája svoje schopnosti pri návratovej bráne.'}
  };
  function speakerPortrait(stageId) {
    const stage=window.GAME.stages.find(item=>item.id===stageId);
    const character=window.GAME.characters.find(item=>item.id===(stage.character||'piko'));
    return `<figure class="worksheet-speaker"><span class="party-sprite worksheet-speaker-avatar" role="img" aria-label="${character.name}" style="--character-image:url('${character.image}');--sprite-x:${character.tile%4*100/3}%;--sprite-y:${character.tile>=4?100:0}%"></span><figcaption>${character.name}</figcaption></figure>`;
  }
  for(const [id,stageId] of Object.entries(sheetStages)) {
    const scene=illustratedScenes[id];
    const illustration=`<figure class="worksheet-scene" data-scene="${scene.file}"><div class="worksheet-scene-label">SPOLU V PRÍBEHU</div><img src="assets/printable-scenes/${scene.file}.png" alt="${scene.alt}" width="${id==='p4'?1122:1536}" height="${id==='p4'?1402:512}"><figcaption>${scene.caption}</figcaption></figure>`;
    let html=sheets[id].replace(window.STORY_TEXT.party(stageId),speakerPortrait(stageId));
    const mission=id==='p1'?/<div class="miky-print-mission">[\s\S]*?<\/ol><\/div>/:/<section class="worksheet-mission">[\s\S]*?<\/section>/;
    html=html.replace(mission,match=>id==='p4'?deliveryGuide(illustration):`<div class="worksheet-visual-row">${match}${illustration}</div>`);
    if(id==='p1')html=html.replace('MIKYHO<br>ROZHÁDZANÉ SIGNÁLY','MIKYHO ROZHÁDZANÉ SIGNÁLY');
    sheets[id]=html;
  }
  // Paper puzzles are rendered from shared data; fills are never preprinted.
  function repairLights(slot,x=0,y=0) {
    return [0,1,2].map(i=>`<circle cx="${x+(i-1)*8}" cy="${y}" r="2.7" fill="${i===slot?'#172e4d':'white'}" stroke="#172e4d" stroke-width=".8"/>`).join('');
  }
  function deliveryTerms() {
    return `<span class="delivery-terms" role="group" aria-label="Čo je čo na mape"><span><strong>UZOL</strong> = veľký kruh <svg width="24" height="24" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Uzol: veľký kruh so symbolom"><circle cx="19" cy="19" r="16" fill="white" stroke="#284c60" stroke-width="2"/><text x="19" y="24" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#172e4d">△</text></svg></span><span><strong>MOSTÍK</strong> = cesta medzi kruhmi <svg width="66" height="26" viewBox="0 0 100 38" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mostík: spojenie so šípkou medzi dvoma kruhmi. Symbol dopíšte na bodkovanú čiaru v rámiku."><circle cx="10" cy="19" r="8" fill="white" stroke="#284c60" stroke-width="1.5"/><circle cx="90" cy="19" r="8" fill="white" stroke="#284c60" stroke-width="1.5"/><path d="M18 19h64m-6-4 6 4-6 4" fill="none" stroke="#284c60" stroke-width="1.5"/><rect x="36" y="3" width="28" height="32" rx="3" fill="white" stroke="#3e6475"/>${repairLights(0,50,10)}<path d="M40 29h20" stroke="#536b78" stroke-dasharray="2 2"/></svg></span></span>`;
  }
  function deliveryGuide(illustration) {
    const steps=window.GAME.stages.find(stage=>stage.id==='cipher').paperInstructions;
    return `<section class="worksheet-mission delivery-guide" aria-labelledby="delivery-guide-title"><h3 id="delivery-guide-title">AKO NA TO</h3>${deliveryTerms()}<div class="delivery-guide-body"><ol>${steps.map((step,i)=>`<li><strong>${esc(step.title)}</strong> ${esc(step.text)}${i===0?deliveryRepairKey():''}</li>`).join('')}</ol>${illustration}</div></section>`;
  }
  function deliveryRepairKey() {
    const key=window.GAME.paperPuzzles.delivery.repairKey;
    return `<div class="delivery-repair-key" role="group" aria-label="Kľúč na doplnenie symbolov"><div>${key.map((symbol,slot)=>`<svg viewBox="0 0 116 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${['Ľavý','Prostredný','Pravý'][slot]} rozsvietený bod: ${symbol}">${repairLights(slot,25,16)}<path d="M49 16h21m-5-4 5 4-5 4" fill="none" stroke="#172e4d"/><text x="91" y="18" class="route-symbol">${symbol}</text></svg>`).join('')}</div></div>`;
  }
  function deliveryMap() {
    const p=window.GAME.paperPuzzles.delivery,xy=i=>[55+p.nodes[i].x*140,60+p.nodes[i].y*115];
    const links=p.edges.map((e,i)=>{
      const [x,y]=xy(e.from),[tx,ty]=xy(e.to),dx=Math.sign(tx-x),dy=Math.sign(ty-y);
      const sx=x+dx*25,sy=y+dy*25,ex=tx-dx*29,ey=ty-dy*29,mx=(sx+ex)/2,my=(sy+ey)/2;
      const broken=Number.isInteger(e.repairSlot);
      const badge=broken?`<rect x="${mx-17}" y="${my-20}" width="34" height="40" rx="5" fill="white" stroke="#3e6475" stroke-width="1.2"/>${repairLights(e.repairSlot,mx,my-12)}<path d="M${mx-10} ${my+14}h20" fill="none" stroke="#536b78" stroke-dasharray="2 2"/>`:`<rect x="${mx-12}" y="${my-12}" width="24" height="24" rx="4" fill="white" stroke="#647b88"/><text x="${mx}" y="${my+1}" class="route-symbol">${e.symbol}</text>`;
      return `<g class="${broken?'broken-bridge':'intact-bridge'}" data-edge="${i}"><path d="M${sx} ${sy}L${ex} ${ey}" fill="none" stroke="#284c60" stroke-width="2" marker-end="url(#delivery-arrow)"/>${badge}</g>`;
    }).join('');
    const nodes=p.nodes.map((n,i)=>{
      const [x,y]=xy(i);
      return `<g class="light-node" data-node="${i}"><circle cx="${x}" cy="${y}" r="25" fill="white" stroke="#284c60" stroke-width="2"/><text x="${x}" y="${n.letter?y-11:y+1}" class="route-symbol">${n.symbol}</text>${n.letter?`<text x="${x}" y="${y+16}" class="route-letter">${n.letter}</text>`:''}${i===p.start||i===p.finish?`<text x="${x}" y="${i===p.finish?y+43:y-35}" class="route-label">${i===p.start?'ŠTART':'CIEĽ'}</text>`:''}</g>`;
    }).join('');
    return `<svg class="delivery-map" viewBox="0 0 825 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Poškodená sieť 24 svetelných uzlov: opravte 12 mostíkov, sledujte symboly a šípky a zapisujte písmená z prejdených kruhov"><defs><marker id="delivery-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#284c60"/></marker></defs>${links}${nodes}</svg>`;
  }
  function sealPattern(mask) {
    return `<svg class="seal-pattern" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vzor pečate: ${mask}">${Array.from(mask,(bit,i)=>`<rect x="${i%3*12}" y="${Math.floor(i/3)*12}" width="12" height="12" fill="${bit==='1'?'#172e4d':'white'}" stroke="#73818c" stroke-width=".7"/>`).join('')}</svg>`;
  }
  function sealPuzzle() {
    const puzzle=window.GAME.paperPuzzles.seals,scene=illustratedScenes.p6;
    const illustration=`<figure class="worksheet-scene seal-party-scene" data-scene="${scene.file}"><div class="worksheet-scene-label">SPOLU V PRÍBEHU</div><img src="assets/printable-scenes/${scene.file}.png" alt="${scene.alt}" width="2172" height="724"><figcaption>${scene.caption}</figcaption></figure>`;
    return `<section class="seal-key worksheet-puzzle"><h3>OČÍSLOVANÉ OPRAVY</h3><div class="seal-key-patterns">${puzzle.repairs.map((mask,i)=>`<div><b>${i+1}</b>${sealPattern(mask)}</div>`).join('')}</div><p>Oprava dopĺňa biele políčka pečate. Žiadne čierne sa nesmú prekryť. Vzory neotáčajte.</p><div class="seal-example">PRÍKLAD ${sealPattern('111100')} + ${sealPattern('000011')} = ${sealPattern('111111')}</div></section><section class="seal-rows worksheet-puzzle"><h3>POŠKODENÉ PEČATE</h3><p>Ku každému platnému riadku dopíšte číslo jeho opravy. Dve falošné pečate prečiarknite.</p><div class="seal-rows-body"><div class="seal-list">${puzzle.rows.map(row=>`<div class="seal-row">${sealPattern(row.mask)}<span class="seal-digit">${esc(row.digit)}</span><span class="seal-order" aria-label="Číslo opravy"></span></div>`).join('')}</div>${illustration}</div></section>`;
  }
  function signalScreens() {
    const puzzle=window.GAME.paperPuzzles.signal,cols=puzzle.columns;
    return `<div class="paper-signal-screens">${puzzle.screens.map((cells,n)=>`<section class="paper-screen"><h3>OBRAZOVKA ${n+1}</h3><svg viewBox="0 0 ${cols*30} ${puzzle.rows*30}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Obrazovka ${n+1}: ${cols} stĺpce, ${puzzle.rows} riadkov">${cells.map((symbol,i)=>`<rect x="${i%cols*30}" y="${Math.floor(i/cols)*30}" width="30" height="30" fill="white" stroke="#536b78" stroke-width=".7"/><text x="${i%cols*30+15}" y="${Math.floor(i/cols)*30+16}" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="16" fill="#1c3043">${symbol}</text>`).join('')}</svg></section>`).join('')}</div>`;
  }
  sheets.p4=sheets.p4.replace('__DELIVERY_MAP__',deliveryMap()).replace('__DELIVERY_REWARD__',`<section class="paper-reward" aria-label="Získaná indícia"><strong>${window.GAME.stages[4].reward}</strong><div><span>VAŠA ZÍSKANÁ INDÍCIA</span><p>Dobre si zapamätajte písmeno ${window.GAME.stages[4].reward}. Budete ho potrebovať neskôr pri spoločnom návrate.</p></div></section>`);
  sheets.p5=sheets.p5.replace('Úloha 5 / Indícia pri stole','Úloha 5 / Indícia v posteli');
  const cipko=window.GAME.cipkoPuzzle;
  sheets.p5=sheets.p5.replace('__CIPKO_WORKBOOK__',`<section class="worksheet-puzzle cipko-workbook"><h3>ČÍSLICE Z TELEFÓNU</h3><div class="cipko-paper-digits">${cipko.digits.map((_,i)=>`<div><span>${i+1}. HRA</span><b></b></div>`).join('')}</div><h3>KĽÚČ K TAJNIČKE</h3><p>Nájdenú číslicu vymeňte za časť slova.</p><div class="cipko-paper-key">${cipko.key.map(([digit,part])=>`<div><strong>${digit}</strong><span>→</span><b>${esc(part)}</b></div>`).join('')}</div><h3>TAJNÝ ÚKRYT</h3><div class="cipko-paper-answer">${cipko.parts.map((part,i)=>`<div><span>${i+1}. HRA</span><div>${Array.from(part,()=>'<b></b>').join('')}</div></div>`).join('')}</div></section>`);
  sheets.p5=sheets.p5.replace('<div class="worksheet-visual-row">',`<section class="worksheet-next maze-phone-panel"><div><h3>OTVORTE ŠTYRI HRY</h3><p>Naskenujte QR. Tento list aj ceruzku si nechajte pri telefóne.</p></div><div class="worksheet-entry-qr"><img src="assets/cipko-qr.svg" alt="QR kód na otvorenie Čipkových hier" width="121" height="121"></div></section><div class="worksheet-visual-row">`);
  sheets.p6=`<section class="sheet story-sheet seal-paper-sheet" id="p6"><div class="worksheet-heading"><div class="label">PIXELKOVIA / ${window.GAME.stages[6].label}</div><h2>Opravte bezpečnostné pečate</h2></div><section class="worksheet-story">${speakerPortrait('search')}<h3>Overte bezpečnostné pečate</h3>${story('search')}</section>${sealPuzzle()}<section class="worksheet-answer seal-answer"><div><h3>OVEROVACÍ KÓD</h3><p>Číslice platných pečatí prepíšte v poradí opráv 1–7.</p><div class="code-boxes">${Array.from({length:7},(_,i)=>'<span></span>').join('')}</div><p>Naskenujte QR a zadajte kód. Po overení si vypočujte alebo prečítajte správu.</p></div><div class="worksheet-entry-qr"><img src="assets/guardy-qr.svg" alt="Otvoriť úlohu 6" width="121" height="121"></div></section><span class="footer">PIXELKOVIA · Úloha 6 / Indícia v chladničke</span></section>`;
  // Insert before the optional diploma in both the viewer and the combined PDF.
  const diploma=sheets.diplom;delete sheets.diplom;
  sheets.p7=`<section class="sheet story-sheet signal-paper-sheet" id="p7"><div class="worksheet-heading"><div class="label">PIXELKOVIA / ÚLOHA 7 – POD GAUČOM</div><h2>Posledná indícia pre návrat domov</h2></div><section class="worksheet-story">${speakerPortrait('code')}<h3>Už len posledný krok</h3>${story('code')}</section><section class="worksheet-mission"><h3>ROZSVIEŤTE POSLEDNÝ ZNAK</h3><div class="signal-pair-key"><span>★</span></div><p>Vyfarbite celé políčka s hviezdou ★. Ostatné nechajte biele.</p></section>${signalScreens()}<section class="worksheet-answer"><h3>VAŠA POSLEDNÁ INDÍCIA</h3><div class="code-boxes"><span></span></div></section><section class="worksheet-next"><h3>OTVORTE NÁVRATOVÚ BRÁNU</h3><p>Prepíšte písmená získané v úlohách 1–5 a na koniec pridajte práve odhalené písmeno.</p><div class="final-password-slots">${[1,2,3,4,5,7].map(n=>`<div><span>ÚLOHA ${n}</span><b></b></div>`).join('')}</div><p>Celé heslo zadajte do telefónu. Potom vás čaká rozlúčka celej partie.</p></section><span class="footer">PIXELKOVIA · POŠKODENÝ NÁVRATOVÝ SIGNÁL</span></section>`;
  sheets.diplom=diploma;
  const bathroom = {
    label:'Úloha 1 – Kúpeľňa',
    placement:'Vytlačenú indíciu ukryte medzi uteráky. Strihajú až deti.',
    hint:'Signály zoraďte podľa dátumu, potom času.'
  };
  const parentInstructions = {
    intro:{label:'Úvod',placement:'Po ukrytí listov spustite úvodné video na telefóne.',hint:'Video pošle deti do kúpeľne.'},
    envelope:bathroom,
    document:{label:'Úloha pri okne',placement:'Vytlačenú indíciu položte k zatvorenému oknu. Kruhy strihajú až deti.',hint:'Vonkajšie D nastavte oproti vnútornému A.'},
    symbols:{label:'Úloha pod stoličkou',placement:'Vytlačenú indíciu prilepte pod sedadlo stoličky.',hint:'Dopočítajte tvary; v telefóne označte všetky políčka s ich hodnotami.'},
    cipher:{label:'Úloha pri topánkach',placement:'Vytlačenú indíciu ukryte do čistej suchej topánky.',hint:'Opravte mostíky, potom sledujte zhodné symboly a zbierajte písmená.'},
    maze:{label:'Úloha v posteli',placement:'Vytlačenú indíciu dajte pod vankúš v detskej posteli.',hint:'Číslice z hier vymeňte podľa papierového kľúča za časti slova.'},
    search:{label:'Úloha v chladničke',placement:'Vytlačenú indíciu dajte do chladničky v suchom uzavretom obale.',hint:'Oprava presne doplní biele políčka. Dve falošné pečate vynechajte; číslice prepíšte podľa opráv 1–7.'},
    code:{label:'Úloha pod gaučom',placement:'Vytlačenú indíciu ukryte pod gauč na dosah ruky.',hint:'Vyfarbite hviezdy ★. Získané O pridajte za písmená z úloh 1–5.'},
    finale:{label:'Finále',placement:'Užite si rozlúčku. Diplom a Atlas sú voliteľné.',hint:'Žiadna ďalšia úloha už nečaká.'}
  };
  for(const stage of window.GAME.stages)parentInstructions[stage.id].label=stage.label;
  function adultHelp(id='envelope', compact=false) {
    const entry=parentInstructions[id];
    return `<section class="adult-help" data-stage="${esc(id)}" aria-label="Inštrukcie pre Game mastra">${compact?'':'<h3>Inštrukcie pre Game mastra</h3>'}<p><strong>Spustenie:</strong> ${esc(entry.placement)}</p><p><strong>Nápoveda:</strong> ${esc(entry.hint)}</p>${entry.safety?`<p class="adult-safety">${esc(entry.safety)}</p>`:''}</section>`;
  }
  function solutionAnswer(stage) {
    if(stage.id==='search')return stage.answer[0];
    if(stage.paperOnly)return stage.paperAnswer;
    const symbols={moon:'mesiac',sun:'slnko',star:'hviezda'};
    return (stage.answer||[]).map(answer=>answer.includes(',')?answer.split(',').map(value=>symbols[value]||value).join(' → '):answer).join(' / ');
  }
  function stageSolution(id,compact=false) {
    const stage=GAME.stages.find(stage=>stage.id===id),answer=id==='maze'?'7294 → CHLADNIČKA':solutionAnswer(stage);
    const text=compact?(id==='intro'?'Prvá obálka je v kúpeľni.':id==='symbols'?'△ 3, ○ 2, □ 4. Označiť všetky 2, 3 a 4 → znak 9.':`${answer||'Úspech tímu'}.`):stage.solution;
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
      const story=document.querySelector('.miky-print-story');story.querySelector('.sheet-avatar')?.remove();
      return story.innerHTML+document.querySelector('.miky-print-mission').innerHTML;
    }
    const sheet=document.querySelector('.sheet');
    sheet.querySelectorAll('.quest-party figcaption').forEach(node=>node.remove());
    sheet.querySelector('.worksheet-heading .label')?.remove();
    sheet.querySelector('.worksheet-heading .print-wave')?.remove();
    sheet.querySelectorAll('.sheet-avatar,.footer,.no-print,.worksheet-scene,.worksheet-entry-qr,svg,.circles').forEach(node=>node.remove());
    return sheet.innerHTML;
  }
  function parentGuide() {
    const preparation={envelope:'Kúpeľňa',document:'Pri okne',symbols:'Pod stoličkou',cipher:'Pri topánkach',maze:'V posteli',search:'V chladničke',code:'Pod gaučom'};
    const cards=GAME.stages.filter(stage=>preparation[stage.id]).map((stage,index)=>{
      const location=preparation[stage.id],setup=parentInstructions[stage.id].placement;
      const answer=stage.id==='maze'?'7294 → CHLADNIČKA':stage.id==='symbols'?'△ = 3, ○ = 2, □ = 4 → v telefóne znak 9.':solutionAnswer(stage);
      const reward=!(stage.finalLetter||stage.reward)?'':`<p class="guide-reward"><strong>Písmeno do tajničky:</strong> <b>${esc(stage.finalLetter||stage.reward)}</b></p>`;
      return `<section class="guide-stage" data-stage="${esc(stage.id)}"><div class="guide-stage-heading"><span class="guide-step">U${index+1}</span><h3>${esc(location)}</h3></div><p class="guide-setup">${esc(setup)}</p><p class="guide-hint"><strong>Nápoveda:</strong> ${esc(parentInstructions[stage.id].hint)}</p><p class="gm-solution" aria-label="Riešenie etapy"><strong>${stage.id==='code'?'Záverečné heslo':'Riešenie'}:</strong> ${esc(answer)}</p>${reward}</section>`;
    });
    return `<section class="sheet parent-guide" id="rodicovsky-navod"><header class="guide-heading"><div><div class="label">PIXELKOVIA / LEN PRE RODIČA</div><h2>Ťahák pre rodiča</h2><p>Tri kroky prípravy. Potom už deti vedie hra.</p></div></header><div class="guide-intro"><section><h3>1. Vytlačte</h3><p>Pracovné listy úloh 1–7 jednostranne na A4, mierka 100 %. Farebne alebo čiernobielo. Nestrihajte ich.</p></section><section><h3>2. Ukryte</h3><p>Vytlačené indície rozmiestnite podľa prehľadu nižšie, na dosah detí.</p></section><section><h3>3. Spustite</h3><p>Na telefóne pustite úvodné video. Hra sa môže začať!</p></section></div><div class="guide-tools"><p><strong>Deti potrebujú:</strong> detské nožnice, ceruzku, tmavú pastelku a telefón s internetom.</p><p><strong>Na prípravu:</strong> tlačiareň, papier A4 a lepiacu pásku. Listy strihajú až deti.</p></div><aside class="guide-safety"><strong>Úkryty</strong><p>Suché a na dosah detí, mimo elektriny, liekov a čistiacich prostriedkov. Nábytok sa nepresúva.</p></aside><div class="guide-section-label"><span>ÚKRYTY · KRÁTKE NÁPOVEDY · RIEŠENIA</span></div><div class="guide-stages"><div class="guide-column">${cards.slice(0,4).join('')}</div><div class="guide-column">${cards.slice(4).join('')}</div></div><footer class="footer"><span>PIXELKOVIA · ŤAHÁK PRE RODIČA</span><span>Nápovedy dávajte až na požiadanie. Riešenia si nechajte pre seba.</span></footer></section>`;
  }
  window.PRINT_MATERIALS={sheets,bathroom,parentInstructions,summary,adultHelp,stageSolution,gameMasterInstructions,bathroomSolution,bathroomInstructions,parentGuide};
})();
