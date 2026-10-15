(() => {
  'use strict';
  const app = document.querySelector('#app');
  const modal = document.querySelector('#modal');
  const KEY = 'zahada-v1-progress';
  const fresh = () => ({started:false, callDone:false, stage:0, completed:[], hints:{}, scenePages:{}});
  let progress = fresh(), view = 'player', preview = null, sequence = [], messageReturn = false, pingTimer = null, soundContext = null;
  let success = false;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= 9 && Array.isArray(saved.completed)) {
      const completed = saved.completed.filter((n,i,a) => Number.isInteger(n) && n >= 1 && n <= 8 && a.indexOf(n) === i);
      // Stored progress must be a contiguous run; malformed data safely starts a new game.
      if (completed.every((n,i) => n === i+1) && (saved.stage === 0 || (saved.callDone && saved.stage <= completed.length + 1))) {
        progress = {...fresh(), ...saved, completed, hints:saved.hints && typeof saved.hints === 'object' ? saved.hints : {}};
      }
    }
  } catch (_) { /* Local storage is optional, including in file:// mode. */ }
  const state = () => preview || progress;
  const save = () => { if (!preview) try {localStorage.setItem(KEY, JSON.stringify(progress));} catch (_) {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase();
  const total = s => s.time.reduce((a,b)=>a+b,0);
  const symbols = {moon:'☾',sun:'☀',star:'☆'};
  const names = {moon:'Mesiac',sun:'Slnko',star:'Hviezda'};
  const allTasks = GAME.stages.slice(1,9);
  function goTop(){window.scrollTo({top:0,behavior:'instant'});app.querySelector('h1')?.focus({preventScroll:true});}
  function navigate(next){view=next;success=false;sequence=[];render();goTop();}
  function stopPings(){clearInterval(pingTimer);pingTimer=null;}
  function closeModal(){
    stopPings();modal.querySelector('video')?.pause();modal.close();modal.classList.remove('message-modal');
    if(document.fullscreenElement===modal)document.exitFullscreen?.().catch(()=>{});
    if(messageReturn){messageReturn=false;render();goTop();}
  }
  function showDialog(html){modal.classList.remove('message-modal');modal.innerHTML=`<button class="dialog-close" data-action="close" aria-label="Zavrieť">×</button>${html}`;if(!modal.open) modal.showModal();}
  function mapHTML(compact=true){
    const s=state();
    if(compact)return `<div class="compact-map" aria-label="Postup: ${s.completed.length} z 8 úloh">${allTasks.map((t,i)=>`<span class="map-node ${s.completed.includes(i+1)?'done':s.stage===i+1?'current':''}" title="${esc(t.title)}" aria-label="Úloha ${i+1}: ${s.completed.includes(i+1)?'splnená':s.stage===i+1?'aktuálna':'čaká'}">${s.completed.includes(i+1)?'✓':String(i+1).padStart(2,'0')}</span>`).join('')}</div>`;
    return `<div class="chapter-grid">${allTasks.map((t,i)=>{const unlocked=s.callDone&&(i+1<=s.stage||s.completed.includes(i+1));return `<button class="chapter-card ${unlocked?'':'locked'} ${s.stage===i+1?'current':''}" ${unlocked?'':'disabled'} data-action="stage" data-stage="${i+1}"><span class="chapter-top"><span class="chapter-icon" aria-hidden="true">${t.icon}</span><span class="chapter-number">${String(i+1).padStart(2,'0')} / 08</span></span><h3>${t.title}</h3><p>${s.completed.includes(i+1)?'✓ Vyriešené':unlocked?'Pripravené na objavenie':'Čaká na odomknutie'} <span class="lock" aria-hidden="true">${unlocked?'↗':'·'}</span></p></button>`;}).join('')}</div>`;
  }
  const character = id => GAME.characters.find(c=>c.id===id);
  const sprite = (id,cls='') => {const c=character(id);return `<span class="pixel-sprite ${cls}" role="img" aria-label="${c.name}" style="--sprite-x:${c.tile%4*100/3}%;--sprite-y:${c.tile>=4?100:0}%"></span>`;};
  function contactsHTML(includePiko=false){const s=state();return `<div class="contacts ${includePiko?'whole-party':''}" aria-label="Kontakty Pixelkov">${(includePiko?GAME.characters:GAME.characters.slice(1)).map(c=>{const task=GAME.stages.findIndex(t=>t.character===c.id),done=c.id==='piko'?s.stage===9:s.completed.includes(task);return `<div class="contact ${done?'connected':''}">${sprite(c.id)}<strong>${c.name}</strong><small>${s.stage===9?'Doma ✓':done?'Na linke ✓':'Bez signálu'}</small></div>`;}).join('')}</div>`;}
  function lineHTML(line){const cls=line.startsWith('„')?'scene-dialogue':line===line.toUpperCase()&&/[A-ZÁČĎÉÍĽŇÓÔŔŠŤÚÝŽ]/.test(line)?'scene-signal':'scene-narration';return `<p class="${cls}">${esc(line)}</p>`;}
  const linesHTML = lines => lines.map(lineHTML).join('');
  function sceneIndex(t,phase){const panels=phase==='after'?t.resolution:t.story,key=`${t.id}:${phase}`,raw=state().scenePages?.[key];return Math.max(0,Math.min(panels.length-1,Number.isInteger(raw)?raw:0));}
  function sceneFinished(t,phase){const panels=phase==='after'?t.resolution:t.story;return !panels.length||sceneIndex(t,phase)===panels.length-1;}
  function sceneReader(t,phase){const panels=phase==='after'?t.resolution:t.story;if(!panels.length)return '';const index=sceneIndex(t,phase);return `<section class="scene-reader" aria-label="${phase==='after'?'Po vyriešení úlohy':'Príbehová scéna'}"><div class="reader-heading"><span class="story-label">${phase==='after'?'Spojenie obnovené':'Príbeh pokračuje'}</span><span class="reader-count">${index+1} / ${panels.length}</span></div><div class="scene-panel" tabindex="-1">${linesHTML(panels[index])}</div><div class="reader-controls"><button class="text-link" data-action="scene-page" data-phase="${phase}" data-page="${index-1}" ${index===0?'disabled':''}>← Späť</button>${index<panels.length-1?`<button class="btn small" data-action="scene-page" data-phase="${phase}" data-page="${index+1}">Čítať ďalej →</button>`:`<span class="reader-end">${phase==='before'&&state().stage<9?'Teraz je na rade váš tím.':'✦ Koniec scény'}</span>`}</div></section>`;}
  function fullScene(panels){return panels.map((lines,i)=>`<section class="gm-scene"><span class="section-kicker">OBRAZ ${i+1}</span>${linesHTML(lines)}</section>`).join('');}
  function atlasInvitation(t){return `<section class="atlas-invitation">${sprite('piko')}<span class="section-kicker">PIKOV DARČEK PRE VÁŠ TÍM</span>${t.invitation.map(line=>line==='[OBJAVIŤ TAJNÝ SVET PIXELKOV]'?'<a class="btn atlas-cta" href="atlas.html" target="_blank" rel="noopener">OBJAVIŤ TAJNÝ SVET PIXELKOV ↗</a>':lineHTML(line)).join('')}</section>`;}
  function landing(){
    const has=progress.started;
    return `<section class="hero" id="zaciatok" aria-label="Záhada u vás doma"><img class="hero-background" src="assets/pixelkovia-room.png" alt="Piko a jeho šiesti pixeloví kamaráti pri svetelnom priechode v tajomnej obývačke" fetchpriority="high"><div class="hero-copy"><div class="eyebrow"><span class="status-dot"></span> PIXELKOVIA / PRÍPAD 001</div><h1 class="adventure-title"><span>Záhada</span><em>u vás doma</em></h1><div class="title-caption">STRATENÝ SIGNÁL</div><p class="hero-description">Žijú u vás. Celý čas.<br>Len ste o nich nevedeli.<br>Až do dnešného dňa.</p><div class="button-row"><button class="btn" data-action="start">${has?'Pokračovať v dobrodružstve':'Spustiť dobrodružstvo'} <span>→</span></button></div><p class="quiet">${has?`Váš postup je uložený · ${progress.completed.length} z 8 úloh splnených`:'Stačí mobil, vytlačené stopy a váš tím.'}</p><div class="hero-meta"><span>◷ <span>~60 MINÚT<small>spoločnej výpravy</small></span></span><span>♧ <span>2–5 HRÁČOV<small>jeden záchranný tím</small></span></span><span>✧ <span>7–13 ROKOV<small>deti aj rodičia</small></span></span></div></div><div class="hero-scene"><div class="incoming-card">${sprite('piko')}<div><span class="section-kicker">PRICHÁDZAJÚCI SIGNÁL</span><strong>Piko vás potrebuje.</strong><p>„Moji kamaráti neodpovedajú.<br>Pomôžete mi ich nájsť?“</p><span class="signal-wave" aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▂ ▇ ▄</span></div></div><span class="scene-caption">Malé postavičky. Veľké tajomstvo.</span></div></section><section class="how-it-works" aria-label="Ako zachrániť Pixelkov">${[
      ['01','Odhaľte tajomstvo','Piko vám ukáže svet, ktorý u vás býva odjakživa.','piko'],
      ['02','Hľadajte doma','Obálky a stopy čakajú na obyčajných miestach.','kvak'],
      ['03','Spojte schopnosti','Každý nájdený Pixelko pomôže tým, čo vie iba on.','kubo'],
      ['04','Nájdite bezpečnú cestu','Zistite pravdu a priveďte celú partiu bezpečne domov.','rysko']
    ].map(([n,title,copy,id])=>`<article class="story-step"><div class="step-number">${n} /</div>${sprite(id)}<h2>${title}</h2><p>${copy}</p></article>`).join('')}</section><section class="hidden-world" aria-labelledby="hidden-world-title"><div class="hidden-world-heading"><span class="section-kicker">BÝVAJÚ U VÁS. LEN O NICH NEVIETE.</span><h2 id="hidden-world-title">Za každou obrazovkou<br>je malý tajný svet.</h2><div class="device-list" aria-label="Kde žijú Pixelkovia"><span>Mobil</span><span>Tablet</span><span>Počítač</span><span>Televízor</span></div></div><div class="hidden-world-copy"><p>Pixelkovia žijú v každej domácnosti, kde nájdete mobil, tablet, počítač alebo televízor. Medzi svetelnými bodkami obrazoviek majú svoje cestičky aj domovy. Ich cesty sú pred ľudskými očami ukryté. Boli tu včera. Sú tu aj dnes. Len ste ich nikdy nevideli.</p><p><strong>Až do dnešného dňa.</strong> Po veľkom bliknutí zmizli svetelné cesty a Pikovi kamaráti neodpovedajú. Čo sa stalo? Prečo sa nedokážu spojiť? Odpovede čakajú v stopách po vašom dome. Pri ich hľadaní bude potrebný každý Pixelko. A všetci budú potrebovať vás.</p></div></section><section class="pixel-party"><div class="section-title"><div><span class="section-kicker">ZOZNÁMTE SA S PIXELKAMI</span><h2>Malá partia.<br>Každý úplne iný.</h2></div><p>Každý vie niečo, čo ostatní nie.<br>Na záchranu úkrytu potrebujete všetkých.</p></div><div class="character-grid">${GAME.characters.map(c=>`<article class="character-card">${sprite(c.id)}<span class="character-role">${c.role}</span><h3>${c.name}</h3><p>${c.description}</p></article>`).join('')}</div></section><section class="intro-strip"><span class="icon-box" aria-hidden="true">✉</span><div><h3>Najprv malá príprava. Potom veľká záchrana.</h3><p>Rodičia, pripravte tri obálky a ukryte stopy od Pika.</p></div><button class="text-link" data-view="prep">Príprava hry ↗</button></section><section class="case-map" aria-label="Herná mapa"><div class="section-title"><div><span class="section-kicker">VÝPRAVA ZA TAJOMSTVOM / VAŠE OBJAVY</span><h2>Osem stôp.<br>Jedno veľké tajomstvo.</h2></div><p>Bez jediného z nich to nepôjde.</p></div>${mapHTML(false)}<div class="case-bottom"><span class="mini-line"></span> Nájdite každého. Nájdite bezpečnú cestu. Staňte sa súčasťou tajomstva.</div></section>`;
  }
  const checklist = [
    'Vytlačiť pracovné listy P1–P6 jednostranne (P4 obsahuje oba kruhy).',
    'Pripraviť 3 obálky, ceruzku, papierovú pásku a detské nožnice.',
    'Vopred rozstrihať iba P2 na štyri pásiky. P4 vystrihujú až deti.',
    'Očíslovať obálky 1–3, pridať malú hviezdu ✦ a rozmiestniť ich podľa tabuľky.',
    'Otvoriť hru na nabitom telefóne, otestovať Pikovo video a nastaviť hlasitosť.',
    'Zhromaždiť tím a až potom spustiť dobrodružstvo. Príde Pikova správa.'
  ];
  function prep(){return `<section class="page-head"><div class="eyebrow"><span class="status-dot"></span> ZÁKULISIE DOBRODRUŽSTVA</div><h1 class="screen-heading" tabindex="-1">Pár obálok. Celý nový svet.</h1><p>Príprava hry pre rodiča alebo dospelého pomocníka. Počítajte s približne 15–20 minútami prípravy; potom odovzdajte telefón svojmu tímu.</p></section><div class="notice"><strong>Pozor, tu sa začínajú tajomstvá príbehu.</strong><p>Táto sekcia a Game master obsahujú riešenia. Interný režim nemá prihlasovanie ani ochranu pred deťmi.</p></div><div class="button-row"><a class="btn" href="printables.html" target="_blank" rel="noopener">Otvoriť pracovné listy <span>↗</span></a><button class="btn secondary" data-view="designer">Celý storyboard</button></div><div class="prep-grid"><section class="panel"><span class="section-kicker">01 / PRIPRAVIŤ</span><h2>Pred prvým pípnutím</h2><ul class="checklist">${checklist.map((s,i)=>`<li><label><input type="checkbox" data-check="${i}"><span>${s}</span></label></li>`).join('')}</ul></section><section class="panel"><span class="section-kicker">02 / VEDIEŤ</span><h2>Vy ste Pikov spojenec.</h2><p>V rozprávkovom svete hry žijú Pixelkovia v každej domácnosti s mobilom, tabletom, počítačom či televízorom. Ich svet ukrýva Ochranné pole. Pri hrozbe prezradenia sa automaticky uzavrelo a bezpečne oddelilo priechody. Nie je pokazené. Príčinu hráči odhalia až postupne: Šutko spozoruje uzavretie zvnútra, Lístok v úlohe 4 prečíta varovanie a Ryško po úlohe 6 vysvetlí nebezpečenstvo prezradenia. Piko preto prvý raz osloví ľudí — váš tím. Jeho papierové stopy rozmiestnite po dome.</p><p>Každý nájdený kamarát prispeje vlastnou schopnosťou. Úlohy 1–6 obnovia kontakty a dajú písmená S, V, E, T, L, O. Úloha 7 odhalí SPOLU a poradie; úloha 8 heslom SVETLO spojí ich schopnosti. Vo finále sa bezpečne vráti všetkých sedem, Piko ako posledný. Ryško potom vráti Ochranné pole do bežného režimu. Tajomstvo patrí celému tímu vrátane dospelého pomocníka.</p><p>Mobil rozpráva príbeh a overuje odpovede. Deti riešia papierové úlohy spolu. Čítajte mladším nahlas a po dvoch minútach bez posunu ponúknite prvú nápovedu.</p><p>Čas netiká proti vám. Návrh má spolu <strong>60 minút</strong>, skutočnú dĺžku ešte overíme hraním.</p></section></div><section class="panel"><span class="section-kicker">03 / ROZMIESTNIŤ</span><h2>Všetko sa zmestí do bytu.</h2><table class="prep-table"><thead><tr><th>Miesto</th><th>Čo pripraviť</th><th>Kedy sa použije</th></tr></thead><tbody><tr><td>Kúpeľňa</td><td>Obálka 1: P1 a rozstrihaný P2. Suché dostupné miesto.</td><td>Úlohy 1–2</td></tr><tr><td>Pod oknom</td><td>P3 zvnútra pod parapetom alebo na podlahe. Bez otvárania okna či lezenia.</td><td>Úloha 3</td></tr><tr><td>Stôl</td><td>Obálka 2: P4 a P5 otočený lícom nadol. Vedľa položte nožnice.</td><td>Úlohy 4–6</td></tr><tr><td>Pod stoličkou</td><td>Obálka 3: P6. Prilepiť pod sedadlo dostupnej stoličky pri stole.</td><td>Úlohy 7–8</td></tr></tbody></table></section><div class="prep-grid"><section class="panel"><h2>Prvý hlavolam: Kde je obálka?</h2><p><strong>Odpoveď: v kúpeľni.</strong> Obálku 1 s P1 a rozstrihaným P2 ukryte na suché dostupné miesto. Pikova videospráva je zámerne ťažšie zrozumiteľná. Deti si ju môžu prehrávať opakovane; miesto im vopred neprezrádzajte. Ak potrebujú pomoc, spýtajte sa: „Kde je obálka?“ Až potom napovedzte: „V miestnosti s umývadlom.“</p><h2>Keď sa tím zasekne</h2><p>V hráčskom režime sú dve postupné nápovedy ku každej úlohe. Najprv sa spýtajte „Čo už vieme?“. Potom skúste prvú nápovedu. Druhá ukáže konkrétny postup. Riešenia máte v storyboarde.</p><p>Žiadne hľadanie pri elektrine, liekoch ani čistiacich prostriedkoch. S nožnicami pomôže dospelý. Nemáte vhodné okno? Kartu dajte na podlahu podň.</p></section><section class="panel"><h2>Čo je zatiaľ pracovné?</h2><p>Tlačové listy sú jednoduché HTML podklady s funkčnými šiframi. Ilustrácie Pixelkov už sprevádzajú hru. Úvod tvorí Pikova videospráva bez prepisu. Pred hrou overte obraz aj zvuk cez <button class="text-link" data-action="test" data-stage="0">Otestovať úvod ↗</button>. Cinkanie sa po otvorení správy zastaví. Ak prehliadač blokuje zvuk po obnovení stránky, zapnite ho tlačidlom na displeji. Finálne tlačové PDF a overenie obtiažnosti s rodinami zostávajú ďalšou prácou.</p><p>Bez tlačiarne môžete pri úlohe otvoriť odkaz na príslušný pracovný list. Fyzické hľadanie tak iba simulujete.</p></section></div><div class="page-end button-row"><button class="btn" data-action="start">Všetko pripravené? Spustiť hru <span>↗</span></button></div>`;}
  function designer(){return `<section class="page-head"><div class="eyebrow">INTERNÝ REŽIM / GAME MASTER</div><h1 class="screen-heading" tabindex="-1">Celý prípad. Na jednom mieste.</h1><p>Pixelkovia: Stratený signál V2 — kompletné autorské scény GAME STUDIO, prechody, dramaturgia a riešenia. Testovanie etapy nemení uložený postup rodiny.</p></section><div class="designer-bar"><div class="button-row"><button class="btn secondary small" data-view="prep">Príprava hry</button><a class="btn secondary small" href="printables.html" target="_blank" rel="noopener">Tlačové materiály ↗</a><a class="btn secondary small gm-atlas" href="atlas.html" target="_blank" rel="noopener">Tajný atlas Pixelkov ↗</a><button class="btn secondary small" data-action="print">Vytlačiť storyboard</button></div><button class="text-link" data-action="reset">Reštartovať uloženú hru ↺</button></div><div class="notice"><strong>10 etáp · 8 úloh · návrhových 60 minút</strong><p>Ochranné pole nie je pokazené: preventívne uzavrelo priechody pred prezradením. Úvod to neodhaľuje. Lístok po úlohe 4 mení cieľ na bezpečný návrat; Ryško po úlohe 6 vysvetlí príčinu. Zachované časovanie je pracovný odhad. Atlas slúži ako darček po finále; tento rodičovský odkaz je dostupný vždy.</p></div><nav class="stage-index" aria-label="Etapy storyboardu">${GAME.stages.map((s,i)=>`<a href="#gm-${s.id}">${i===0?'Úvod':i===9?'Finále':String(i).padStart(2,'0')}</a>`).join('')}</nav>${GAME.stages.map((s,i)=>`<article class="storyboard" id="gm-${s.id}"><div class="storyboard-head"><div><span class="section-kicker">${s.label}</span><h2>${s.icon} ${s.title}</h2><span class="time-pill">${total(s)} minút${s.reward?` · indícia ${s.reward}`:''}</span></div><button class="btn secondary small" data-action="test" data-stage="${i}">Otestovať ↗</button></div><span class="section-kicker">A / PRÍBEH PRED ÚLOHOU</span>${i===0?`<div class="notice"><strong>Hráčsky úvod: prichádzajúca videospráva od Pika</strong><p>Prvým hlavolamom je rozlúštenie videa. Kde je obálka? V kúpeľni. Na hráčskom displeji sa odpoveď ani prepis nezobrazujú. Nasledujúci autorský text ostáva scenárovým podkladom.</p></div><div class="gm-scene">${linesHTML(s.incoming)}</div>`:''}${fullScene(s.story)}${s.resolution.length?`<span class="section-kicker">PO SPRÁVNEJ ODPOVEDI</span>${fullScene(s.resolution)}`:''}${s.invitation?`<div class="notice"><strong>Pikova pozvánka po finále</strong>${s.invitation.filter(l=>!l.startsWith('[')).map(l=>`<p>${esc(l)}</p>`).join('')}</div>`:''}<div class="detail-grid"><div><h3>B / Fyzická akcia</h3><p>${esc(s.action)}</p></div><div><h3>C / Úloha</h3><p>${esc(s.task)}</p></div><div><h3>D / Tlačiteľné materiály</h3><p>${esc(s.materials)}</p></div><div><h3>E / Mobilná interakcia</h3><p>${esc(s.mobile)}</p></div><div class="solution"><h3>F / Game master · riešenie</h3><p><strong>${esc(s.solution)}</strong></p><ol>${s.hints.map(h=>`<li>${esc(h)}</li>`).join('')}</ol><p>${esc(s.parent)}</p></div><div><h3>G / Časovanie a prechod</h3><p>Príbeh: ${s.time[0]} min · hľadanie/príprava: ${s.time[1]} min · riešenie: ${s.time[2]} min.</p><p>${esc(s.transition)}</p></div></div><div class="gm-dramaturgy"><h3>Dramaturgia pre dospelého</h3>${s.dramaturgy.map(l=>`<p>${esc(l)}</p>`).join('')}</div></article>`).join('')}`;}
  function aside(){const s=state();return `<aside class="task-aside"><div class="panel"><h3>Záchranná linka</h3>${contactsHTML()}<p class="aside-copy">${Math.min(s.completed.length,6)} zo 6 kontaktov obnovených.</p>${mapHTML()}<div class="progress-track"><span style="width:${s.completed.length/8*100}%"></span></div><p class="aside-copy">${s.completed.length} z 8 úloh vyriešených</p><div class="fragment-row">${allTasks.slice(0,6).map((t,i)=>`<span class="fragment" title="Úloha ${i+1}">${s.completed.includes(i+1)?t.reward:'·'}</span>`).join('')}</div><button class="text-link" data-action="notebook">Otvoriť zápisník ↗</button></div></aside>`;}
  function taskScreen(){const s=state(),n=s.stage,t=GAME.stages[n];
    if(n===0)return landing();
    const toolbar=`<div class="task-toolbar"><button class="text-link" ${preview?'data-action="exit-test"':'data-action="home"'}>← ${preview?'Späť do storyboardu':'Prehľad dobrodružstva'}</button><span class="time-pill">${preview?'TEST ETAPY · ':''}${t.label} · ~${total(t)} min</span>${s.callDone?'<button class="text-link" data-action="reopen-message">Pikova správa ▷</button>':''}</div>`;
    if(n===9)return `<section class="task-wrap">${toolbar}<div class="finale"><div class="final-icon">✧</div>${contactsHTML(true)}<div class="eyebrow" style="justify-content:center">VŠETKÝCH SEDEM JE DOMA</div><h1 class="screen-heading" tabindex="-1" style="text-align:center">${t.title}</h1>${sceneReader(t,'before')}<div style="max-width:430px;margin:auto">${mapHTML()}</div>${atlasInvitation(t)}<div class="button-row"><button class="btn secondary" data-action="notebook">Váš tímový zápisník ↗</button><button class="btn secondary" data-action="reset">Nové dobrodružstvo ↺</button></div></div></section>`;
    if(success||s.completed.includes(n))return `<section class="task-wrap">${toolbar}<div class="success-card">${t.character?sprite(t.character,'success-character'):'<div class="success-icon">✓</div>'}<div class="eyebrow" style="justify-content:center">ÚLOHA ${n} VYRIEŠENÁ</div><h1 class="screen-heading" tabindex="-1" style="font-size:36px">${t.character?'Spojenie obnovené.':n===7?'Nikto nezostane vzadu.':'Spoločný signál prijatý.'}</h1>${sceneReader(t,'after')}${sceneFinished(t,'after')?`<div class="big-fragment" aria-label="Získaná indícia ${t.reward}">${t.reward}</div><p>${esc(t.transition)}</p>${mapHTML()}<button class="btn" data-action="next">${n===8?'Dokončiť bezpečný návrat':'Pokračovať v príbehu'} →</button>`:'<p class="quiet">Prečítajte spojenie s Pixelkom. Odpoveď aj váš postup sú už uložené.</p>'}</div></section>`;
    const sheet={1:'p1',2:'p2',3:'p3',4:'p4',5:'p5',6:'p5',7:'p6',8:'p6'};
    const hints=Number.isInteger(s.hints[n])?Math.min(s.hints[n],t.hints.length):0;
    return `<section class="task-wrap">${toolbar}<div class="task-layout"><article class="task-main"><div class="eyebrow"><span class="status-dot"></span>PIXELKOVIA / STRATENÝ SIGNÁL / ${String(n).padStart(2,'0')}</div><h1 class="screen-heading" tabindex="-1">${t.title}</h1>${t.character?`<div class="task-character">${sprite(t.character)}<div><span class="section-kicker">OBNOVTE KONTAKT</span><strong>${character(t.character).name}</strong><small>${character(t.character).role}</small></div></div>`:''}${sceneReader(t,'before')}${sceneFinished(t,'before')?`<div class="task-instruction"><h2>Najprv sa rozhliadnite.</h2><p>${esc(t.action)}</p><h2>Vaša úloha</h2><p>${esc(t.task)}</p><a class="text-link" style="padding-left:0" href="printables.html#${sheet[n]}" target="_blank" rel="noopener">Nemáte papier? Otvoriť pracovný list ↗</a></div>${t.digital?`<div class="symbol-buttons" role="group" aria-label="Výber symbolov">${['star','moon','sun'].map(k=>`<button class="symbol-btn" data-symbol="${k}" aria-label="${names[k]}">${symbols[k]}</button>`).join('')}</div><div id="sequence" class="sequence" role="status" aria-label="Vybrané symboly"></div><div class="button-row" style="margin-top:15px"><button class="btn" data-action="verify-sequence">Overiť poradie →</button><button class="text-link" data-action="clear-sequence">Vymazať výber ↺</button></div>`:`<form class="answer-form"><label for="answer">${n===8?'Návratové heslo':'Odpoveď vášho tímu'}</label><div class="answer-row"><input id="answer" name="answer" autocomplete="off" maxlength="40" ${[1,3,5].includes(n)?'inputmode="numeric"':''} placeholder="${t.placeholder}" required><button class="btn" type="submit">Overiť <span>→</span></button></div></form>`}<p class="feedback" id="feedback" role="status"></p><div class="hint-box"><button class="text-link" style="padding-left:0" data-action="hint" ${hints===t.hints.length?'disabled':''}>◇ ${hints===t.hints.length?'Všetky nápovedy sú zobrazené':`Potrebujeme nápovedu (${hints}/${t.hints.length})`}</button><div id="hints" aria-live="polite">${t.hints.slice(0,hints).map(h=>`<p>${esc(h)}</p>`).join('')}</div></div>`:''}</article>${aside()}</div></section>`;
  }
  function render(){
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    app.innerHTML=view==='prep'?prep():view==='designer'?designer():state().started&&state().stage>0?taskScreen():landing();
    if(view==='prep') document.querySelectorAll('[data-check]').forEach(el=>{try{el.checked=localStorage.getItem('zahada-prep-'+el.dataset.check)==='1';}catch(_){}});
  }
  function start(){
    view='player';state().started=true;save();
    if(!state().callDone)openCall();
    else{if(state().stage===0)state().stage=state().completed.length===8?9:state().completed.length+1;save();render();goTop();}
  }
  function ping(){
    if(!soundContext||soundContext.state!=='running'||document.hidden||!modal.open||!modal.querySelector('.message-incoming'))return;
    // Three soft notification notes; no downloaded audio or speech is needed.
    [880,1174.66,1396.91].forEach((frequency,i)=>{
      const at=soundContext.currentTime+i*.18,osc=soundContext.createOscillator(),gain=soundContext.createGain();
      osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(0,at);
      gain.gain.linearRampToValueAtTime(.09,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.22);
      osc.connect(gain);gain.connect(soundContext.destination);osc.start(at);osc.stop(at+.23);
    });
  }
  function enableSound(){
    try{
      const AudioContext=window.AudioContext||window.webkitAudioContext;
      if(!AudioContext)return;
      if(!soundContext)soundContext=new AudioContext();
      soundContext.resume().then(()=>{ping();const b=modal.querySelector('[data-action="message-sound"]');if(b){b.textContent='♪ Zvuk zapnutý';b.setAttribute('aria-pressed','true');}}).catch(()=>{});
    }catch(_){} // The visual notification remains usable when audio is unavailable.
  }
  function openCall(replay=false,withGesture=true){
    messageReturn=replay;
    showMessage(replay||state().messageOpened);
    if(withGesture){
      if(!replay&&!state().messageOpened)enableSound();
      if(modal.requestFullscreen&&!document.fullscreenElement)modal.requestFullscreen().catch(()=>{});
    }
  }
  function showMessage(opened=false){
    stopPings();modal.querySelector('video')?.pause();
    modal.classList.add('message-modal');
    modal.innerHTML=`<section class="message-screen ${opened?'message-opened':'message-incoming'}" aria-labelledby="message-title">
      <header class="message-status"><span><i class="status-dot"></i> PIXEL / MESSENGER</span><button class="text-link" data-action="close">${messageReturn?'← Späť do hry':preview?'← Späť do storyboardu':'Pozastaviť'}</button></header>
      ${opened?`<div class="message-thread"><div class="message-sender">${sprite('piko')}<div><span class="section-kicker">PRIJATÁ SPRÁVA</span><h1 id="message-title">Piko</h1></div><span class="message-badge">VIDEO</span></div>
        <div class="message-video-wrap"><video id="piko-video" controls playsinline preload="metadata" aria-label="Videospráva od Pika"></video><p id="message-video-status" role="status" hidden></p></div>
        <p class="message-caption">Správa od Pika</p>
        <div class="message-actions"><button class="btn" data-action="replay-message">▷ Prehrať znova</button><button class="btn secondary" data-action="finish-call" ${state().messageWatched||messageReturn?'':'hidden'}>${messageReturn?'Späť do hry →':'Máme obálku →'}</button></div>
        <p class="message-help">Počúvajte pozorne. Správu si môžete prehrať, koľkokrát potrebujete.</p></div>`:
        `<div class="message-waiting"><div class="message-orbit" aria-hidden="true"><span>✉</span><i></i><i></i></div><span class="section-kicker">PRICHÁDZAJÚCA SPRÁVA</span><h1 id="message-title">Niekto vám<br>poslal odkaz.</h1><p>1 neprečítaná videospráva</p><button class="message-notification" data-action="accept-call">${sprite('piko')}<span><strong>Piko <small>teraz</small></strong><span>Poslal vám videosprávu.</span><em>Ťuknutím otvoriť <b>→</b></em></span><span class="message-unread" aria-label="1 neprečítaná správa">1</span></button></div>
        <button class="text-link message-sound" data-action="message-sound" aria-pressed="false">♪ Zapnúť zvuk</button>`}
      <footer class="message-footer"><span class="message-home-bar" aria-hidden="true"></span></footer>
    </section>`;
    if(!modal.open)modal.showModal();
    if(opened){
      const video=modal.querySelector('video'),status=modal.querySelector('#message-video-status');
      video.addEventListener('ended',()=>{state().messageWatched=true;save();modal.querySelector('[data-action="finish-call"]').hidden=false;});
      video.addEventListener('error',()=>{status.hidden=false;status.textContent='Správu sa nepodarilo načítať. Skúste ju prehrať znova alebo požiadajte dospelého pomocníka.';});
      video.src=GAME.video;
      video.play().catch(()=>{});
    }else{
      pingTimer=setInterval(ping,4800);
    }
    modal.querySelector(opened?'[data-action="replay-message"]':'[data-action="accept-call"]')?.focus({preventScroll:true});
  }
  function verify(raw){const t=GAME.stages[state().stage];const valid=t.digital?raw===t.answer[0]:t.answer.some(a=>normalize(raw)===normalize(a));
    if(valid){const n=state().stage;if(!state().completed.includes(n)){state().completed.push(n);state().completed.sort((a,b)=>a-b);}save();success=true;sequence=[];render();goTop();}
    else{const fb=document.querySelector('#feedback');fb.textContent='Tento kód ešte nesedí. Skúste sa poradiť v tíme alebo otvoriť nápovedu.';document.querySelector('#answer')?.setAttribute('aria-invalid','true');}
  }
  function notebook(){const s=state();showDialog(`<span class="section-kicker">VÁŠ ZÁCHRANNÝ ZÁPISNÍK</span><h2>Každá stopa sa počíta.</h2><p>${s.completed.length} z 8 úloh vyriešených.</p>${contactsHTML()}${mapHTML()}${allTasks.map((t,i)=>`<div class="notebook-row"><span>${i+1}. ${esc(t.title)}</span><strong>${s.completed.includes(i+1)?t.reward:'·'}</strong></div>`).join('')}${s.completed.includes(7)?'<div class="notice">Karta poradia: písmená z úloh 1 → 2 → 3 → 4 → 5 → 6.</div>':'<p class="quiet">Každá vyriešená úloha uloží svoj objav sem.</p>'}`);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a');if(!b)return;
    if(b.classList.contains('brand')){e.preventDefault();preview=null;view='player';success=false;app.innerHTML=landing();goTop();return;}
    if(b.dataset.view){preview=null;navigate(b.dataset.view);return;}
    if(b.dataset.symbol){if(sequence.length<3){sequence.push(b.dataset.symbol);const el=document.querySelector('#sequence');el.textContent=sequence.map(k=>symbols[k]).join(' ');el.setAttribute('aria-label',sequence.map(k=>names[k]).join(', '));}return;}
    const a=b.dataset.action;if(!a)return;
    if(a==='scene-page'){
      const t=GAME.stages[state().stage],phase=b.dataset.phase;
      if(!['before','after'].includes(phase))return;
      const panels=phase==='after'?t.resolution:t.story,idx=Number(b.dataset.page);
      if(!Number.isInteger(idx)||idx<0||idx>=panels.length)return;
      if(!state().scenePages||typeof state().scenePages!=='object')state().scenePages={};
      state().scenePages[`${t.id}:${phase}`]=idx;save();render();
      document.querySelector('.scene-panel')?.focus({preventScroll:true});
      document.querySelector('.scene-reader')?.scrollIntoView({block:'start',behavior:'instant'});return;
    }
    if(a==='start')start();
    if(a==='home'){success=false;app.innerHTML=landing();goTop();}
    if(a==='stage'){state().stage=Number(b.dataset.stage);success=false;sequence=[];save();render();goTop();}
    if(a==='test'){const n=Number(b.dataset.stage);preview={started:true,callDone:n!==0,stage:n,completed:Array.from({length:Math.max(0,n-1)},(_,i)=>i+1),hints:{}};view='player';success=false;sequence=[];if(n===0)openCall();else{render();goTop();}}
    if(a==='exit-test'){preview=null;navigate('designer');}
    if(a==='close'){const wasIntro=modal.classList.contains('message-modal')&&!messageReturn;closeModal();if(wasIntro){if(preview){preview=null;navigate('designer');}else{app.innerHTML=landing();goTop();}}}
    if(a==='accept-call'){state().messageOpened=true;save();showMessage(true);}
    if(a==='message-sound')enableSound();
    if(a==='replay-message'){
      const video=modal.querySelector('video');if(video){const status=modal.querySelector('#message-video-status');status.hidden=true;if(video.error)video.load();video.currentTime=0;video.play().catch(()=>{});}
    }
    if(a==='reopen-message')openCall(true);
    if(a==='finish-call'){
      if(messageReturn){closeModal();return;}
      if(!state().messageWatched)return;
      closeModal();state().callDone=true;state().stage=1;save();success=false;render();goTop();
    }
    if(a==='verify-sequence')verify(sequence.join(','));
    if(a==='clear-sequence'){sequence=[];document.querySelector('#sequence').textContent='';document.querySelector('#sequence').setAttribute('aria-label','Vybrané symboly');document.querySelector('#feedback').textContent='';}
    if(a==='hint'){const s=state(),t=GAME.stages[s.stage];s.hints[s.stage]=Math.min((Number(s.hints[s.stage])||0)+1,t.hints.length);save();const input=document.querySelector('#answer')?.value;render();if(input)document.querySelector('#answer').value=input;if(t.digital){const el=document.querySelector('#sequence');el.textContent=sequence.map(k=>symbols[k]).join(' ');el.setAttribute('aria-label',sequence.map(k=>names[k]).join(', '));}document.querySelector('#hints').scrollIntoView({block:'nearest'});}
    if(a==='next'){state().stage=Math.min(9,state().stage+1);success=false;save();render();goTop();}
    if(a==='notebook')notebook();
    if(a==='print')window.print();
    if(a==='reset')showDialog(`<h2>Začať odznova?</h2><p>Vymaže sa uložený herný postup v tomto prehliadači. Príprava pre rodiča zostane zaškrtnutá.</p><div class="button-row"><button class="btn" data-action="confirm-reset">Áno, nová hra</button><button class="btn secondary" data-action="close">Pokračovať v aktuálnej</button></div>`);
    if(a==='confirm-reset'){closeModal();preview=null;progress=fresh();save();navigate('player');}
  });
  document.addEventListener('submit',e=>{if(e.target.matches('.answer-form')){e.preventDefault();verify(new FormData(e.target).get('answer'));}});
  document.addEventListener('change',e=>{if(e.target.matches('[data-check]'))try{localStorage.setItem('zahada-prep-'+e.target.dataset.check,e.target.checked?'1':'0');}catch(_){}});
  modal.addEventListener('cancel',e=>{e.preventDefault();modal.querySelector('[data-action="close"]')?.click();});
  modal.addEventListener('close',()=>{stopPings();modal.querySelector('video')?.pause();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)ping();});
  render();
  if(progress.started&&!progress.callDone)openCall(false,false);
})();
