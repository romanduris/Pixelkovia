(() => {
  'use strict';
  const app = document.querySelector('#app');
  const modal = document.querySelector('#modal');
  const KEY = 'zahada-v1-progress';
  const FINAL_STAGE=GAME.stages.length-1,TASK_COUNT=FINAL_STAGE-1,PROGRESS_VERSION=2;
  const environment = document.body.dataset.environment || 'sales';
  const internal = environment !== 'sales';
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const fresh = () => ({progressVersion:PROGRESS_VERSION, started:false, callDone:false, stage:0, completed:[], hints:{}, scenePages:{}});
  let progress = fresh(), view = environment === 'player' ? 'prep' : environment, preview = null, messageReturn = false, pingTimer = null, soundContext = null;
  let success = false;
  let plugyRevealTimer = null;
  let finaleEndTimer = null;
  let finaleStartTimer = null;
  try {
    let saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.progressVersion===PROGRESS_VERSION && Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= FINAL_STAGE && Array.isArray(saved.completed)) {
      const completed = saved.completed.filter((n,i,a) => Number.isInteger(n) && n >= 1 && n <= TASK_COUNT && a.indexOf(n) === i);
      // QR links can open tasks independently; retain completed tasks even with gaps.
      if (saved.stage === 0 || saved.callDone) {
        progress = {...fresh(), ...saved, completed:completed.sort((a,b)=>a-b), hints:saved.hints && typeof saved.hints === 'object' ? saved.hints : {}};
      }
    }
  } catch (_) { /* Local storage is optional, including in file:// mode. */ }
  const state = () => preview || progress;
  const save = () => { if (!preview) try {localStorage.setItem(KEY, JSON.stringify(progress));} catch (_) {} };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase();
  const total = s => s.time.reduce((a,b)=>a+b,0);
  const allTasks = GAME.stages.slice(1,-1);
  function goTop(){app.scrollTop=0;window.scrollTo({top:0,behavior:'instant'});app.querySelector('h1')?.focus({preventScroll:true});}
  function navigate(next){
    if(!internal && next !== 'sales')return;
    view=next;success=false;
    if(internal && !preview && next === 'prep' && location.protocol !== 'file:')history.replaceState(null,'','parent.html');
    render();goTop();
  }
  function stopPings(){clearInterval(pingTimer);pingTimer=null;}
  function closeModal(){
    stopPings();modal.querySelectorAll('video,audio').forEach(media=>media.pause());modal.close();modal.classList.remove('message-modal');
    if(messageReturn){messageReturn=false;render();goTop();}
  }
  function showDialog(html){modal.classList.remove('message-modal');modal.innerHTML=`<button class="dialog-close" data-action="close" aria-label="Zavrieť">×</button>${html}`;if(!modal.open) modal.showModal();}
  function mapHTML(compact=true){
    const s=state();
    if(compact)return `<div class="compact-map" aria-label="Postup: ${s.completed.length} z ${TASK_COUNT} úloh">${allTasks.map((t,i)=>`<span class="map-node ${s.completed.includes(i+1)?'done':s.stage===i+1?'current':''}" title="${esc(t.title)}" aria-label="Úloha ${i+1}: ${s.completed.includes(i+1)?'splnená':s.stage===i+1?'aktuálna':'čaká'}">${s.completed.includes(i+1)?'✓':String(i+1).padStart(2,'0')}</span>`).join('')}</div>`;
    return `<div class="chapter-grid">${allTasks.map((t,i)=>{const unlocked=s.callDone;return `<button class="chapter-card ${unlocked?'':'locked'} ${s.stage===i+1?'current':''}" ${unlocked?'':'disabled'} data-action="stage" data-stage="${i+1}"><span class="chapter-top"><span class="chapter-icon" aria-hidden="true">${SITE_CONTENT.stageIcon(t)}</span><span class="chapter-number">${String(i+1).padStart(2,'0')} / ${String(TASK_COUNT).padStart(2,'0')}</span></span><h3>${t.title}</h3><p>${s.completed.includes(i+1)?'✓ Vyriešené':unlocked?'Pripravené na objavenie':'Čaká na odomknutie'} <span class="lock" aria-hidden="true">${unlocked?'↗':'·'}</span></p></button>`;}).join('')}</div>`;
  }
  const character = id => GAME.characters.find(c=>c.id===id);
  const sprite = (id,cls='') => {const c=character(id);return `<span class="pixel-sprite ${cls}" role="img" aria-label="${c.name}" style="--character-image:url('${c.image}')"></span>`;};
  function contactsHTML(includePiko=false){const s=state();return `<div class="contacts ${includePiko?'whole-party':''}" aria-label="Kontakty Pixelkov">${(includePiko?GAME.characters:GAME.characters.slice(1)).map(c=>{const task=GAME.stages.findIndex(t=>t.character===c.id),done=s.stage===FINAL_STAGE||s.completed.includes(task);return `<div class="contact ${done?'connected':''}">${sprite(c.id)}<strong>${c.name}</strong><small>${s.stage===FINAL_STAGE?'Doma ✓':done?'Na linke ✓':'Bez signálu'}</small></div>`;}).join('')}</div>`;}
  function lineHTML(line){const cls=line.startsWith('„')?'scene-dialogue':line===line.toUpperCase()&&/[A-ZÁČĎÉÍĽŇÓÔŔŠŤÚÝŽ]/.test(line)?'scene-signal':'scene-narration';return `<p class="${cls}">${esc(line)}</p>`;}
  const linesHTML = lines => lines.map(lineHTML).join('');
  function sceneIndex(t,phase){const panels=phase==='after'?t.resolution:t.story,key=`${t.id}:${phase}`,raw=state().scenePages?.[key];return Math.max(0,Math.min(panels.length-1,Number.isInteger(raw)?raw:0));}
  function sceneReader(t,phase){const panels=phase==='after'?t.resolution:t.story;if(!panels.length)return '';const index=sceneIndex(t,phase);return `<section class="scene-reader" aria-label="${phase==='after'?'Po vyriešení úlohy':'Príbehová scéna'}"><div class="reader-heading"><span class="story-label">${phase==='after'?'Spojenie obnovené':'Príbeh pokračuje'}</span><span class="reader-count">${index+1} / ${panels.length}</span></div><div class="scene-panel" tabindex="-1">${linesHTML(panels[index])}</div><div class="reader-controls"><button class="text-link" data-action="scene-page" data-phase="${phase}" data-page="${index-1}" ${index===0?'disabled':''}>← Späť</button>${index<panels.length-1?`<button class="btn small" data-action="scene-page" data-phase="${phase}" data-page="${index+1}">Čítať ďalej →</button>`:`<span class="reader-end">${phase==='before'&&state().stage<FINAL_STAGE?'Teraz je na rade váš tím.':'✦ Koniec scény'}</span>`}</div></section>`;}
  function fullScene(panels){return panels.map((lines,i)=>`<section class="gm-scene"><span class="section-kicker">OBRAZ ${i+1}</span>${linesHTML(lines)}</section>`).join('');}
  function finaleMediaHTML(){
    if(!GAME.finaleVideo&&!GAME.finaleAudio)return '';
    return `<section class="finale-media" aria-label="Rozlúčka celej partie">${GAME.finaleVideo?`<div class="finale-video-frame" data-playback="idle"><video id="finale-video" playsinline preload="auto" poster="assets/finale-production/start-a.png" aria-label="Rozlúčkové video Pixelkov">Váš prehliadač nepodporuje toto video.</video><div class="finale-end-title" hidden aria-live="polite">KONIEC</div><button class="finale-video-toggle" data-action="finale-video-toggle" data-icon="▶" aria-controls="finale-video">Prehrať rozlúčku</button><p id="finale-video-status" role="status">Ťuknutím spustíte video so zvukom.</p></div>`:''}${GAME.finaleAudio?`<audio controls playsinline preload="auto" src="${esc(GAME.finaleAudio)}" aria-label="Záverečná hlasová rozlúčka"></audio>`:''}</section>`;
  }
  function primeFinaleVideo(){
    const video=app.querySelector('#finale-preload-video');if(!video)return;
    // Prepare the same player in the trusted submit gesture, then pause synchronously
    // before any frame or sound can play. A Web Audio media source shifts MP4 time on Safari.
    video.finalePrimeError=null;
    video.play().catch(error=>{if(error.name!=='AbortError')video.finalePrimeError=error;});
    video.pause();
  }
  function releaseFinaleVideo(video){
    if(!video)return;
    video.pause();video.finaleEvents?.abort();video.removeAttribute('src');video.load();
  }
  function bindFinaleVideo(autoplay=false){
    const video=app.querySelector('#finale-video'),button=app.querySelector('[data-action="finale-video-toggle"]'),status=app.querySelector('#finale-video-status');
    if(!video||!button||!status)return;
    const events=new AbortController();video.finaleEvents=events;
    const listen=(name,handler)=>video.addEventListener(name,handler,{signal:events.signal});
    const endTitle=app.querySelector('.finale-end-title'),frame=video.parentElement;
    video.finaleStarting=autoplay;
    const playback=(state,icon)=>{frame.dataset.playback=state;button.dataset.icon=icon;};
    const hideEnd=()=>{clearTimeout(finaleEndTimer);finaleEndTimer=null;if(endTitle)endTitle.hidden=true;};
    for(const event of ['play','seeking','emptied'])listen(event,hideEnd);
    const failed=()=>{clearTimeout(finaleStartTimer);finaleStartTimer=null;video.finaleStarting=false;hideEnd();playback('error','↻');button.textContent='↻ Skúsiť prehrať znova';status.textContent='Video sa nepodarilo načítať. Ťuknutím skúste načítať video znova.';};
    listen('playing',()=>{if(video.finaleStarting)return;playback('playing','❚❚');button.textContent='❚❚ Pozastaviť rozlúčku';status.textContent='Video sa prehráva.';});
    listen('waiting',()=>{status.textContent='Video sa načítava…';});
    listen('pause',()=>{if(!video.finaleStarting&&!video.ended&&!video.error){playback('paused','▶');button.textContent='▶ Pokračovať v rozlúčke';status.textContent='Video je pozastavené.';}});
    listen('ended',()=>{playback('ended','↻');button.textContent='↻ Prehrať rozlúčku znova';status.textContent='Video dohralo. Môžete si ho prehrať znova.';
      hideEnd();
      finaleEndTimer=setTimeout(()=>{finaleEndTimer=null;if(video.isConnected&&video.ended&&!video.error&&endTitle)endTitle.hidden=false;},1000);
    });
    listen('error',failed);
    video.finalePlay=()=>{
      clearTimeout(finaleStartTimer);finaleStartTimer=null;
      if(video.finaleStarting&&video.readyState>=1)video.currentTime=0;
      video.finaleStarting=false;
      hideEnd();
      if(video.error)video.load();
      if(video.ended)video.currentTime=0;
      status.textContent='Video sa načítava…';
      video.play().catch(error=>{if(!video.isConnected)return;if(error.name==='NotAllowedError'){playback('paused','▶');button.textContent='▶ Prehrať rozlúčku';status.textContent='Ťuknutím spustíte video so zvukom.';}else failed();});
    };
    if(autoplay){
      playback('starting','▶');status.textContent='Rozlúčka sa o chvíľu spustí…';
      finaleStartTimer=setTimeout(()=>{
        finaleStartTimer=null;if(!video.isConnected)return;
        const error=video.finalePrimeError;
        if(error){
          video.finaleStarting=false;video.pause();
          if(error.name!=='NotAllowedError')failed();
          else{playback('paused','▶');status.textContent='Ťuknutím spustíte video so zvukom.';}
          return;
        }
        const reveal=()=>{
          if(!video.isConnected||!video.finaleStarting)return;
          video.finaleStarting=false;
          if(video.paused)video.finalePlay();
          else{playback('playing','❚❚');button.textContent='❚❚ Pozastaviť rozlúčku';status.textContent='Video sa prehráva.';}
        };
        if(video.readyState>=1&&video.currentTime>0){video.pause();video.addEventListener('seeked',reveal,{once:true,signal:events.signal});video.currentTime=0;}
        else reveal();
      },1000);
    }
  }
  function atlasInvitation(t){return `<section class="atlas-invitation">${sprite('piko')}<span class="section-kicker">PIKOV DARČEK PRE VÁŠ TÍM</span>${t.invitation.map(line=>line==='[OBJAVIŤ TAJNÝ SVET PIXELKOV]'?'<a class="btn atlas-cta" href="atlas.html" target="_blank" rel="noopener">OBJAVIŤ TAJNÝ SVET PIXELKOV ↗</a>':lineHTML(line)).join('')}</section>`;}
  function landing(){return SITE_CONTENT.sales({sprite});}
  const checklist = PREP_STORE.steps;
  function prep(){return SITE_CONTENT.prep({sprite,checklist,progress,mapHTML});}
  function updatePreparation(){
    const completed = checklist.filter(step => PREP_STORE.read(step.id)).length;
    const count = app.querySelector('#prep-count'), meter = app.querySelector('#prep-progress');
    if(count)count.textContent=`${completed} / ${checklist.length}`;
    if(meter)meter.value=completed;
    const ready = SITE_CONFIG.access.canLaunch(PREP_STORE.ready());
    app.querySelectorAll('[data-action="start"], [data-action="restart-adventure"]').forEach(button => {button.disabled=!ready;button.classList.toggle('is-ready',ready);});
    const status=app.querySelector('#launch-status');
    if(status)status.textContent=ready?'Všetko pripravené. Môžete spustiť testovacie dobrodružstvo.':'Dokončite povinné kroky a potvrďte použitie telefónu.';
  }
  function designer(){return SITE_CONTENT.designer({sprite,fullScene,linesHTML});}
  function taskScreen(){const s=state(),n=s.stage,t=GAME.stages[n];
    if(n===0)return landing();
    const toolbar=`<div class="task-toolbar"><button class="text-link" ${preview?'data-action="exit-test"':'data-action="home"'}>← ${preview?'Späť do storyboardu':'Prehľad dobrodružstva'}</button><span class="time-pill">${preview?'TEST ETAPY · ':''}${t.label} · ~${total(t)} min</span>${s.callDone?'<button class="text-link" data-action="reopen-message">Pikova správa ▷</button>':''}</div>`;
    if(n===1&&(success||s.completed.includes(1)))return mikyConnectionScreen();
    if(n===1)return mikyRestoreScreen();
    if(n===4)return paperDeliveryScreen();
    if(n===5)return cipkoScreen();
    if(n===3)return success||s.completed.includes(3)?plugyConnectionScreen():plugyLockScreen();
    if(n===FINAL_STAGE||(n===7&&success))return finaleScreen();
    return taskInteractionScreen(t,n);
  }
  function finaleScreen(){
    app.classList.add('signal-mode');
    return `<section class="finale finale-screen" aria-labelledby="finale-title"><h1 id="finale-title" tabindex="-1">NÁVRATOVÝ SIGNÁL PRIJATÝ</h1>${finaleMediaHTML()}<button class="btn finale-exit" data-action="end-game">Koniec hry</button></section>`;
  }
  function cipkoScreen(){
    app.classList.add('signal-mode');
    return `<section class="signal-screen signal-task cipko-screen">${signalHeader(preview?'exit-test':'home','ČIPKOVE OPRAVY')}<div class="signal-content">${sprite('cipko')}${CIPKO_GAME.render(state())}</div></section>`;
  }
  function paperDeliveryScreen(){
    app.classList.add('signal-mode');
    return `<section class="signal-screen"><div class="signal-content">${sprite('pingy')}<h1 tabindex="-1">Pokračujte na papieri</h1><p>Pri topánkach vás čaká pracovný list s poškodenými svetelnými uzlami. Opravte mostíky, rozsvieťte cestu a choďte podľa doručenej správy hľadať.</p><p>Telefón môžete odložiť. Ďalšiu úlohu otvoríte QR kódom na nájdenom liste.</p><p>Návratový znak T z pracovného listu si odložte k ostatným návratovým znakom.</p><button class="text-link" data-action="${preview?'exit-test':'home'}">← Prehľad hry</button></div></section>`;
  }
  function taskInteractionScreen(t,n){
    app.classList.add('signal-mode');
    // The final QR requires a fresh password even when completion is saved.
    const done=n===7?success:success||state().completed.includes(n);
    const prompt={3:'Zadajte výsledok z karty symbolov.',4:'Zadajte miesto zo zloženého odkazu.',6:'Zadajte sedemmiestny kód z opravených správ.',7:'Zadajte spoločné návratové heslo.'}[n];
    const title=done?(t.id==='search'?'SPRÁVY OPRAVENÉ':t.character?'SPOJENIE OBNOVENÉ!':'NÁVRATOVÝ SIGNÁL PRIJATÝ'):t.label;
    const controls=`<form class="answer-form signal-form"><label for="answer">${t.id==='code'?'Návratové heslo':n===6?'Sedemmiestny kód':'Odpoveď vášho tímu'}</label><input id="answer" name="answer" type="text" inputmode="${n===3||n===6?'numeric':'text'}" maxlength="40" autocomplete="off" spellcheck="false" placeholder="${esc(t.placeholder)}" aria-describedby="feedback" required><button class="btn" type="submit">Overiť odpoveď →</button></form>`;
    if((n===6||n===7)&&!done)return `<section class="signal-screen signal-task code-check-screen ${n===6?'guardy':'return'}-check-screen" aria-labelledby="stage-title">${signalHeader(preview?'exit-test':'home',n===6?'OVERENIE KÓDU':'NÁVRATOVÁ BRÁNA')}<div class="signal-content"><h1 id="stage-title" tabindex="-1">${esc(title)}</h1><img class="code-check-party ${n===6?'guardy-happy-party':''}" src="${n===6?'assets/guardy-party-transparent.png':'assets/return-party-holding-hands.png'}" alt="${n===6?'Celá veselá partia siedmich Pixelkov je spolu.':'Všetci siedmi Pixelkovia sa usmievajú a držia za ruky.'}"><div class="code-check-entry"><p>${n===6?'Číslice pri opravených správach prečítajte zhora nadol a vzniknutý sedemmiestny kód zadajte tu:':'Zadajte návratové heslo zo získaných znakov.'}</p>${controls}<p class="feedback" id="feedback" role="status"></p>${n===6&&GAME.guardyAudio?'<span data-guardy-audio-slot hidden></span>':''}${n===7&&GAME.finaleVideo?'<span data-finale-preload-slot hidden></span>':''}</div></div></section>`;
    return `<section class="signal-screen ${done?'signal-stage-result success-card'+(n===6?' guardy-result':''):'signal-task'}" aria-labelledby="stage-title">${signalHeader(preview?'exit-test':'home',done?'ODPOVEĎ PRIJATÁ':'OVERENIE ODPOVEDE')}<div class="signal-content">${STORY_TEXT.party(t,done?'success-character':'')}<div class="eyebrow">${esc(t.title)}</div><h1 id="stage-title" tabindex="-1">${esc(title)}</h1>${done?`${t.reward?`<div class="signal-reward"><span>${t.id==='code'?'BRÁNA OTVORENÁ':'VÁŠ NÁVRATOVÝ ZNAK'}</span><strong>${esc(t.reward)}</strong>${t.id==='code'?'':'<small>Tento návratový znak si dobre zapamätajte. Budete ho potrebovať neskôr.</small>'}</div>`:''}${n===6?`<p>Spojenie s ochrancom je obnovené. Čaká vás jeho správa.</p>${GAME.guardyAudio?'<span data-guardy-audio-slot hidden></span><div class="signal-audio-controls"><button class="btn" data-action="guardy-audio-toggle" aria-controls="guardy-audio">▶ Prehrať Guardyho správu</button></div><p id="guardy-audio-status" role="status">Ťuknutím spustíte Guardyho správu.</p>':''}<button class="text-link guardy-transcript-link" data-action="read-guardy-message">Prečítať Guardyho správu</button>`:STORY_TEXT.html(t,'after')}<button class="btn" data-action="${n===6?'close-window':'next'}">${n===6?'Zavrieť okno':(t.id==='code'?'Prečítať rozlúčku':'Pokračovať')+' →'}</button>${t.id==='code'?taskCompletionNote('Návratová brána je otvorená. Pokračujte k rozlúčke celej partie.'):taskCompletionNote()}`:`${n===6?'':STORY_TEXT.html(t)}<p class="task-question">${esc(t.task)}</p><p class="answer-prompt">${prompt}</p>${controls}<p class="feedback" id="feedback" role="status"></p>${n===6?'':taskHints()}`}</div></section>`;
  }
  function taskCompletionNote(text='Po vypočutí alebo prečítaní správy môžete telefón odložiť a ísť hľadať ďalšiu indíciu.') {return `<p class="task-completion-note">${esc(text)}</p>`;}
  function signalHeader(back,label){return `<header class="signal-header"><button class="text-link" data-action="${back}">← ${preview?'Späť do storyboardu':'Prehľad hry'}</button><span class="section-kicker">PIXEL / ${label}</span><button class="text-link" data-action="game-fullscreen" aria-label="Zapnúť celú obrazovku">⛶</button></header>`;}
  function taskHints(){const n=state().stage,t=GAME.stages[n],h=Math.min(Number(state().hints[n])||0,t.hints.length);return `<div class="hint-box"><button class="text-link" data-action="hint" ${h===t.hints.length?'disabled':''}>◇ Potrebujeme nápovedu (${h}/${t.hints.length})</button><div id="hints" aria-live="polite">${t.hints.slice(0,h).map(x=>`<p>${esc(x)}</p>`).join('')}</div></div>`;}
  function mikyRestoreScreen(){app.classList.add('signal-mode');return `<section class="signal-screen signal-restore" aria-labelledby="restore-title">${signalHeader(preview?'exit-test':'home','OBNOVA LINKY')}<div class="signal-content">${STORY_TEXT.party('envelope')}<h1 id="restore-title" tabindex="-1">${esc(GAME.stages[1].label)}</h1><form class="answer-form signal-form"><label for="answer">Kód na obnovenie spojenia</label><input id="answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" spellcheck="false" placeholder="••••••" aria-describedby="feedback" required><button class="btn" type="submit">OBNOVIŤ SPOJENIE</button></form><p class="feedback" id="feedback" role="status"></p>${GAME.audio?'<span data-miky-audio-slot hidden></span>':''}</div></section>`;}
  function mikyConnectionScreen(){app.classList.add('signal-mode');return `<section class="signal-screen signal-connected success-card" aria-labelledby="connection-title">${signalHeader(preview?'exit-test':'home','SPOJENIE AKTÍVNE')}<div class="signal-content"><h1 id="connection-title" tabindex="-1">SPOJENIE OBNOVENÉ!</h1><div class="signal-duo" aria-label="Piko a Miky sú spolu na linke"><div class="signal-person">${sprite('piko','piko-listener')}<strong>Piko</strong></div><div class="connection-line" aria-hidden="true"><span></span><i>✦</i><span></span></div><div class="signal-person miky-speaker">${sprite('miky','success-character')}<strong>Miky</strong></div></div><p class="connection-message">Ja vás počujem! Ďakujem, konečne sme zase v spojení.</p>${GAME.audio?`<span data-miky-audio-slot hidden></span><div class="signal-audio-controls"><button class="btn" data-action="miky-audio-toggle" aria-controls="miky-audio">▶ Prehrať správu</button></div><p id="miky-audio-status" role="status">Správu môžete prehrať opakovane.</p>`:'<p class="message-text-status">Čaká vás odkaz s ďalšou indíciou.</p>'}<button class="${GAME.audio?'text-link':'btn'} miky-transcript-link" data-action="read-miky-message">${GAME.audio?'Čítať Mikyho správu':'Prečítať správu →'}</button><div class="signal-reward"><strong>S</strong><div><span>VÁŠ NÁVRATOVÝ ZNAK</span><small>Tento návratový znak si dobre zapamätajte. Budete ho potrebovať neskôr.</small></div></div>${taskCompletionNote()}</div></section>`;}
  function readMikyMessage(){showDialog(`<section id="miky-transcript" class="miky-message-reading"><h2>Mikyho správa</h2>${GAME.mikyMessage.map(line=>`<p>${esc(line)}</p>`).join('')}</section>`);}
  function plugyCells(){return new Set((Array.isArray(state().plugyCells)?state().plugyCells:[]).filter(index=>Number.isInteger(index)&&index>=0&&index<GAME.plugyPuzzle.grid.flat().length));}
  function plugyLockScreen(){
    app.classList.add('signal-mode');
    const puzzle=GAME.plugyPuzzle,selected=plugyCells();
    return `<section class="signal-screen plugy-screen plugy-lock signal-task" aria-labelledby="plugy-title">${signalHeader(preview?'exit-test':'home','PLUGYHO ZÁMOK')}<div class="signal-content">${STORY_TEXT.party('symbols')}<h1 id="plugy-title" tabindex="-1">${esc(GAME.stages[3].label)}</h1><p class="plugy-welcome">${esc(puzzle.welcome)}</p><p id="plugy-instruction">${esc(puzzle.instruction)} <small>${esc(puzzle.toggleHint)}</small></p><div class="plugy-grid" role="group" aria-label="Digitálny zámok: 5 stĺpcov a 7 riadkov" aria-describedby="plugy-instruction">${puzzle.grid.flat().map((value,index)=>`<button class="plugy-cell" data-action="plugy-cell" data-cell="${index}" aria-pressed="${selected.has(index)}" aria-label="${value}, riadok ${Math.floor(index/5)+1}, stĺpec ${index%5+1}">${value}</button>`).join('')}</div><button class="text-link plugy-hint" data-action="plugy-hint">Potrebujeme nápovedu</button>${GAME.plugyAudio?'<span data-plugy-audio-slot hidden></span>':''}</div></section>`;
  }
  function plugyConnectionScreen(){
    app.classList.add('signal-mode');
    const sign=GAME.plugyPuzzle.grid.flat().map(value=>`<i class="${GAME.plugyPuzzle.values.includes(value)?'lit':''}"></i>`).join('');
    return `<section class="signal-screen plugy-screen plugy-connected signal-stage-result success-card" aria-labelledby="plugy-title">${signalHeader(preview?'exit-test':'home','MOST ODOMKNUTÝ')}<div class="signal-content"><div class="plugy-result-heading"><h1 id="plugy-title" tabindex="-1">Most je odomknutý!</h1><div class="plugy-unlock"><span class="plugy-unlock-sign" role="img" aria-label="Odomykací znak: číslica 9">${sign}</span><span>ODOMYKACÍ ZNAK <strong>9</strong></span></div></div><div class="plugy-celebration"><img class="plugy-party-scene" src="assets/plugy-party-transparent.png" alt="Piko, Miky, Pixi a Plugy sú spolu pri opravenom moste." width="1536" height="512"><p class="plugy-thanks">${esc(GAME.plugyThanks)}</p></div><div class="plugy-message">${GAME.plugyAudio?`<span data-plugy-audio-slot hidden></span><div class="signal-audio-controls"><button class="btn" data-action="plugy-audio-toggle" aria-controls="plugy-audio">▶ Prehrať Plugyho správu</button></div><p id="plugy-audio-status" role="status">Ťuknutím spustíte správu.</p>`:'<p class="message-text-status">Za mostom čaká ďalší odkaz.</p>'}<button class="${GAME.plugyAudio?'text-link':'btn'}" data-action="read-plugy-message">${GAME.plugyAudio?'Čítať Plugyho správu':'Prečítať správu →'}</button></div><div class="signal-reward"><strong>E</strong><div><span>VÁŠ NÁVRATOVÝ ZNAK</span><small>Tento návratový znak si dobre zapamätajte. Budete ho potrebovať neskôr.</small></div></div>${taskCompletionNote()}</div></section>`;
  }
  function readPlugyMessage(){showDialog(`<section id="plugy-transcript" class="miky-message-reading"><h2>Plugyho správa</h2>${GAME.plugyMessage.map(line=>`<p>${esc(line)}</p>`).join('')}</section>`);}
  function selectPlugyCell(button){
    if(view!=='player'||state().stage!==3||state().completed.includes(3))return;
    const index=Number(button.dataset.cell),grid=GAME.plugyPuzzle.grid.flat(),selected=plugyCells();
    if(!Number.isInteger(index)||index<0||index>=grid.length)return;
    if(selected.has(index))selected.delete(index);else selected.add(index);
    state().plugyCells=[...selected];save();button.setAttribute('aria-pressed',String(selected.has(index)));
    if(grid.every((value,index)=>selected.has(index)===GAME.plugyPuzzle.values.includes(value)))revealPlugySign();
  }
  function revealPlugySign(){
    const screen=app.querySelector('.plugy-lock'),grid=screen?.querySelector('.plugy-grid'),revealState=state();
    if(!grid||plugyRevealTimer!==null)return;
    primePlugyAudio(app.querySelector('#plugy-audio'));
    // Save the solved task now, so leaving or refreshing cannot lose the discovery.
    recordTaskCompletion();
    grid.classList.add('is-unlocking');grid.setAttribute('aria-label','Správny znak: číslica 9. Most sa odomyká.');
    grid.querySelectorAll('button').forEach(button=>{button.disabled=true;});
    const status=screen.querySelector('.plugy-hint');
    status.disabled=true;status.textContent='Znak je správny. Most sa odomyká…';status.setAttribute('role','status');
    plugyRevealTimer=setTimeout(()=>{
      plugyRevealTimer=null;
      if(view==='player'&&state()===revealState&&state().stage===3&&screen.isConnected)completeTask();
    },2500);
  }
  function plugyHint(){
    if(view!=='player'||state().stage!==3||state().completed.includes(3))return;
    const hints=GAME.stages[3].hints,count=Math.min((Number(state().hints[3])||0)+1,hints.length);
    state().hints[3]=count;save();
    showDialog(`<section><h2>Pomoc so Plugyho zámkom</h2>${hints.slice(0,count).map(hint=>`<p>${esc(hint)}</p>`).join('')}${count<hints.length?'<button class="btn" data-action="plugy-hint">Ďalšia nápoveda</button>':''}</section>`);
  }
  function primePlugyAudio(audio){
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!audio||!AudioContext||audio.plugySound)return;
    let context;
    try{
      // Both resume() and play() run in the final tile's trusted tap, before the timer.
      context=new AudioContext();
      const source=context.createMediaElementSource(audio),gain=context.createGain();
      gain.gain.value=0;source.connect(gain);gain.connect(context.destination);
      const sound=audio.plugySound={context,source,gain,revealing:true,loop:audio.loop,error:null};
      audio.loop=true; // Even short recordings stay active, silently, through the reveal.
      const failed=error=>{
        if(error.name==='AbortError')return;sound.error=error;
        if(!sound.revealing&&audio.isConnected){audio.pause();if(error.name==='NotAllowedError')audio.plugyBlocked();else audio.plugyFallback();}
      };
      context.resume().catch(failed);
      if(audio.error||audio.networkState===HTMLMediaElement.NETWORK_NO_SOURCE)audio.load();
      audio.play().catch(failed);
    }catch(_){context?.close().catch(()=>{});}
  }
  function releasePlugyAudio(audio){
    const sound=audio?.plugySound;if(!sound)return;
    audio.pause();audio.loop=sound.loop;sound.source.disconnect();sound.gain.disconnect();
    sound.context.close().catch(()=>{});audio.plugySound=null;
  }
  function startPlugyMessage(audio){
    const sound=audio.plugySound;
    if(sound){
      sound.revealing=false;audio.loop=sound.loop;
      if(sound.error||sound.context.state!=='running'){
        audio.pause();if(audio.readyState>=1)audio.currentTime=0;sound.gain.gain.value=1;
        if(sound.error&&sound.error.name!=='NotAllowedError')audio.plugyFallback();else audio.plugyBlocked();return;
      }
      const release=()=>{if(audio.isConnected&&audio.plugySound===sound){sound.gain.gain.value=1;audio.plugySync();}};
      if(audio.readyState>=1&&audio.currentTime>0){
        // Keep the output silent until seeking has discarded the reveal's audio frames.
        audio.addEventListener('seeked',release,{once:true,signal:audio.plugyEvents.signal});audio.currentTime=0;
      }else release();
      if(!audio.paused){audio.plugySync();return;}
    }
    playPlugyAudio(audio);
  }
  function playPlugyAudio(audio){
    const context=audio.plugySound?.context;
    if(context&&context.state!=='running')context.resume().catch(()=>{if(audio.isConnected){audio.pause();audio.plugyBlocked();}});
    if(audio.error||audio.networkState===HTMLMediaElement.NETWORK_NO_SOURCE)audio.load();
    audio.play().catch(error=>{if(!audio.isConnected||error.name==='AbortError')return;if(error.name==='NotAllowedError')audio.plugyBlocked();else audio.plugyFallback();});
  }
  function messageAudioStatus(status,text) {status.textContent=text;status.classList.toggle('audio-status-paused',text==='Správa je pozastavená.');}
  function bindPlugyAudio(autoplay=false){
    const audio=app.querySelector('#plugy-audio'),button=app.querySelector('[data-action="plugy-audio-toggle"]'),status=app.querySelector('#plugy-audio-status');
    if(!audio||!button||!status)return;
    const events=new AbortController();audio.plugyEvents=events;
    const listen=(name,handler)=>audio.addEventListener(name,handler,{signal:events.signal});
    let failed=false,attempted=false;
    const idle=()=>{button.textContent=audio.ended||audio.plugyReplayReady?'↻ Prehrať znova':audio.currentTime>0?'▶ Pokračovať v správe':'▶ Prehrať Plugyho správu';};
    const speaking=()=>{if(failed||audio.paused||audio.ended||audio.plugySound?.gain.gain.value===0)return;const text='Hovorí Plugy…';if(status.textContent!==text)messageAudioStatus(status,text);};
    const fallback=()=>{if(!audio.isConnected||failed)return;failed=true;audio.pause();idle();button.textContent='↻ Skúsiť prehrať znova';messageAudioStatus(status,'Správu sa nepodarilo prehrať. Môžete si ju prečítať.');};
    listen('play',()=>{attempted=true;failed=false;audio.plugyReplayReady=false;button.textContent='Ⅱ Pozastaviť';messageAudioStatus(status,'Načítavam Plugyho správu…');});
    listen('playing',speaking);
    listen('timeupdate',()=>{if(!failed&&!audio.paused&&!audio.ended&&audio.currentTime>0&&(!audio.plugySound||audio.plugySound.context.state==='running'))speaking();});
    listen('waiting',()=>{messageAudioStatus(status,'Načítavam Plugyho správu…');});
    listen('pause',()=>{if(failed||!audio.paused)return;idle();messageAudioStatus(status,audio.ended?'Správu si môžete prehrať znova.':'Správa je pozastavená.');});
    listen('ended',()=>{audio.plugyReplayReady=true;idle();messageAudioStatus(status,'Správu si môžete prehrať znova.');});
    listen('error',()=>{if(attempted&&audio.error)fallback();});audio.plugyFallback=fallback;
    audio.plugyBlocked=()=>{failed=true;audio.pause();idle();messageAudioStatus(status,'Ťuknutím spustíte Plugyho správu.');};
    audio.plugySync=()=>{if(audio.paused){idle();messageAudioStatus(status,'Správa je pozastavená.');return;}button.textContent='Ⅱ Pozastaviť';messageAudioStatus(status,'Načítavam Plugyho správu…');if(audio.readyState>=2&&audio.currentTime>0)speaking();};
    if(autoplay){attempted=true;startPlugyMessage(audio);}
  }
  function playMikyAudio(audio){
    if(audio.error||audio.networkState===HTMLMediaElement.NETWORK_NO_SOURCE)audio.load();
    audio.play().catch(error=>{
      if(!audio.isConnected||error.name==='AbortError')return;
      if(error.name==='NotAllowedError')audio.mikyBlocked();else audio.mikyFallback();
    });
  }
  function bindMessageAudio(autoplay=false,id='miky',name='Miky'){
    const audio=app.querySelector('#'+id+'-audio');if(!audio)return;
    const screen=audio.closest('.signal-screen'),status=app.querySelector('#'+id+'-audio-status'),button=app.querySelector('[data-action="'+id+'-audio-toggle"]');
    if(!button||!status)return;
    const events=new AbortController();audio.mikyEvents=events;
    const listen=(name,handler)=>audio.addEventListener(name,handler,{signal:events.signal});
    let failed=false,attempted=autoplay;
    const idle=()=>{screen.classList.remove('is-speaking');button.textContent=audio.ended||audio.mikyReplayReady?'↻ Prehrať znova':audio.currentTime>0?'▶ Pokračovať v správe':'▶ Prehrať správu';};
    const fallback=()=>{if(!audio.isConnected||failed)return;failed=true;audio.pause();idle();button.textContent='↻ Skúsiť prehrať znova';messageAudioStatus(status,'Správu sa nepodarilo prehrať. Môžete si ju prečítať.');};
    listen('play',()=>{attempted=true;failed=false;audio.mikyReplayReady=false;button.textContent='Ⅱ Pozastaviť';messageAudioStatus(status,`Načítavam ${name==='Miky'?'Mikyho':'Guardyho'} správu…`);});
    listen('playing',()=>{screen.classList.add('is-speaking');messageAudioStatus(status,`Hovorí ${name}…`);});
    listen('waiting',()=>{screen.classList.remove('is-speaking');messageAudioStatus(status,`Načítavam ${name==='Miky'?'Mikyho':'Guardyho'} správu…`);});
    listen('pause',()=>{if(failed||!audio.paused)return;idle();messageAudioStatus(status,audio.ended?'Správu si môžete prehrať znova.':'Správa je pozastavená.');});
    listen('ended',()=>{audio.mikyReplayReady=true;idle();messageAudioStatus(status,'Správu si môžete prehrať znova.');});
    listen('error',()=>{if(attempted&&audio.error)fallback();});audio.mikyFallback=fallback;
    audio.mikyBlocked=()=>{idle();messageAudioStatus(status,`Ťuknutím spustíte ${name==='Miky'?'Mikyho':'Guardyho'} správu.`);};
    if(autoplay)playMikyAudio(audio);
  }
  let answerViewportFrame=0;
  function resetAnswerViewport(){
    app.classList.remove('is-entering-answer');
    app.style.removeProperty('--answer-viewport-height');app.style.removeProperty('--answer-viewport-top');
  }
  function keepAnswerVisible(){
    cancelAnimationFrame(answerViewportFrame);
    answerViewportFrame=requestAnimationFrame(()=>{
      const input=document.activeElement;
      if(!input?.matches('.signal-form #answer')||!app.contains(input)){resetAnswerViewport();return;}
      const viewport=window.visualViewport;
      const visibleHeight=viewport?.height||innerHeight;
      app.style.setProperty('--answer-viewport-height',`${visibleHeight}px`);
      app.style.setProperty('--answer-viewport-top',`${viewport?.offsetTop||0}px`);
      app.classList.add('is-entering-answer');
      const inputRect=input.getBoundingClientRect(),formRect=input.closest('form').getBoundingClientRect();
      const centeredTop=(visibleHeight-inputRect.height)/2;
      const roomForButton=visibleHeight-(formRect.bottom-inputRect.top)-20;
      const targetTop=Math.max(24,Math.min(centeredTop,roomForButton));
      const delta=inputRect.top-app.getBoundingClientRect().top-targetTop;
      if(Math.abs(delta)>1)app.scrollTop+=delta;
    });
  }
  function render({autoplayMiky=false,autoplayPlugy=false,autoplayGuardy=false,autoplayFinale=false}={}){
    clearTimeout(finaleEndTimer);finaleEndTimer=null;
    clearTimeout(finaleStartTimer);finaleStartTimer=null;
    clearTimeout(plugyRevealTimer);plugyRevealTimer=null;
    // Old saves on the removed phone stage resume at the next playable task.
    if(view==='player'&&state().stage===2&&state().completed.includes(1)){
      if(!state().completed.includes(2))state().completed.push(2);
      state().stage=3;success=false;save();
    }
    if(view==='player'&&state().stage===5&&CIPKO_GAME.ready(state())&&!state().completed.includes(5))recordTaskCompletion();
    resetAnswerViewport();
    app.classList.remove('signal-mode');
    const previousAudio=app.querySelector('#miky-audio');
    const retainedAudio=view==='player'&&state().stage===1?previousAudio:null;
    previousAudio?.mikyEvents?.abort();
    const previousPlugyAudio=app.querySelector('#plugy-audio');
    const retainedPlugyAudio=view==='player'&&state().stage===3?previousPlugyAudio:null;
    previousPlugyAudio?.plugyEvents?.abort();
    const previousGuardyAudio=app.querySelector('#guardy-audio');
    const retainedGuardyAudio=view==='player'&&state().stage===6?previousGuardyAudio:null;
    previousGuardyAudio?.mikyEvents?.abort();
    const previousFinaleVideo=app.querySelector('#finale-preload-video,#finale-video');
    const retainedFinaleVideo=view==='player'&&(state().stage===7||state().stage===FINAL_STAGE)?previousFinaleVideo:null;
    previousFinaleVideo?.finaleEvents?.abort();
    app.querySelectorAll('video,audio').forEach(media=>{
      if(autoplayFinale&&media===retainedFinaleVideo)return;
      if(!(autoplayPlugy&&media===retainedPlugyAudio&&media.plugySound?.revealing))media.pause();
    });
    if(retainedFinaleVideo)document.body.append(retainedFinaleVideo);
    else releaseFinaleVideo(previousFinaleVideo);
    // Keep the buffered element attached while replacing the code form with the result.
    if(retainedAudio)document.body.append(retainedAudio);
    else if(previousAudio){previousAudio.removeAttribute('src');previousAudio.load();}
    if(retainedPlugyAudio)document.body.append(retainedPlugyAudio);
    else if(previousPlugyAudio){releasePlugyAudio(previousPlugyAudio);previousPlugyAudio.removeAttribute('src');previousPlugyAudio.load();}
    if(retainedGuardyAudio)document.body.append(retainedGuardyAudio);
    else if(previousGuardyAudio){previousGuardyAudio.removeAttribute('src');previousGuardyAudio.load();}
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===(view==='player'?'prep':view)));
    if(internal && SITE_CONFIG.access.mode !== 'test'){
      app.innerHTML='<section class="portal-header"><div><h1>Prístup zatiaľ nie je dostupný</h1><p>Produkčná verzia vyžaduje serverové overenie nákupu. V tejto etape nie je implementované.</p></div></section>';return;
    }
    document.querySelectorAll('.nav-purchase').forEach(button=>{button.textContent=SITE_CONFIG.purchase.label;});
    document.querySelectorAll('[data-management-link]').forEach(link=>{const url=SITE_CONFIG.managementUrl();link.hidden=!url;if(url)link.href=url;});
    app.innerHTML=view==='prep'?prep():view==='designer'?designer():view==='player'&&state().started&&state().stage>0?taskScreen():landing();
    window.PORTAL_LIBRARY?.mount();
    const audioSlot=app.querySelector('[data-miky-audio-slot]');
    if(audioSlot){
      const audio=retainedAudio||document.createElement('audio');
      if(!retainedAudio){audio.id='miky-audio';audio.preload='auto';audio.setAttribute('playsinline','');audio.setAttribute('aria-label','Mikyho hlasová správa');audio.src=GAME.audio;}
      audioSlot.replaceWith(audio);
      if(!retainedAudio)audio.load();
    }else retainedAudio?.remove();
    bindMessageAudio(autoplayMiky);
    const plugyAudioSlot=app.querySelector('[data-plugy-audio-slot]');
    if(plugyAudioSlot){
      const audio=retainedPlugyAudio||document.createElement('audio');
      if(!retainedPlugyAudio){audio.id='plugy-audio';audio.preload='auto';audio.setAttribute('playsinline','');audio.setAttribute('aria-label','Plugyho hlasová správa');audio.src=GAME.plugyAudio;}
      plugyAudioSlot.replaceWith(audio);if(!retainedPlugyAudio)audio.load();
    }else if(retainedPlugyAudio){releasePlugyAudio(retainedPlugyAudio);retainedPlugyAudio.remove();}
    bindPlugyAudio(autoplayPlugy);
    const guardySlot=app.querySelector('[data-guardy-audio-slot]');
    if(guardySlot){
      const audio=retainedGuardyAudio||document.createElement('audio');
      if(!retainedGuardyAudio){audio.id='guardy-audio';audio.preload='auto';audio.setAttribute('playsinline','');audio.setAttribute('aria-label','Guardyho hlasová správa');audio.src=GAME.guardyAudio;}
      guardySlot.replaceWith(audio);if(!retainedGuardyAudio)audio.load();
    }else retainedGuardyAudio?.remove();
    bindMessageAudio(autoplayGuardy,'guardy','Guardy');
    const finalePlaceholder=app.querySelector('#finale-video'),finaleSlot=app.querySelector('[data-finale-preload-slot]');
    if(finalePlaceholder&&retainedFinaleVideo){
      retainedFinaleVideo.id='finale-video';retainedFinaleVideo.hidden=false;
      retainedFinaleVideo.setAttribute('aria-label','Rozlúčkové video Pixelkov');
      finalePlaceholder.replaceWith(retainedFinaleVideo);
    }else if(finalePlaceholder){
      finalePlaceholder.src=GAME.finaleVideo;finalePlaceholder.load();
    }else if(finaleSlot){
      const video=retainedFinaleVideo||document.createElement('video');
      video.id='finale-preload-video';video.hidden=true;video.preload='auto';video.playsInline=true;
      video.poster='assets/finale-production/start-a.png';
      if(!retainedFinaleVideo)video.src=GAME.finaleVideo;
      finaleSlot.replaceWith(video);if(!retainedFinaleVideo)video.load();
    }else if(retainedFinaleVideo){releaseFinaleVideo(retainedFinaleVideo);retainedFinaleVideo.remove();}
    bindFinaleVideo(autoplayFinale);
    if(view==='prep'){app.querySelectorAll('[data-check]').forEach(el=>{el.checked=PREP_STORE.read(el.dataset.check);});updatePreparation();}
  }
  function start(){
    if(!internal || !SITE_CONFIG.access.canLaunch(PREP_STORE.ready()))return;
    if(!preview && location.protocol !== 'file:')history.replaceState(null,'','game.html');
    view='player';state().started=true;save();
    if(!state().callDone)openCall();
    else{requestGameFullscreen();if(state().stage===0)state().stage=state().completed.length===TASK_COUNT?FINAL_STAGE:state().completed.length+1;save();render();goTop();}
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
  function requestGameFullscreen(){
    // Dialogs cannot enter fullscreen. Use the document so the entire game stays fullscreen.
    const root=document.documentElement;
    if(document.fullscreenElement||!document.fullscreenEnabled||!root.requestFullscreen)return;
    root.requestFullscreen({navigationUI:'hide'}).catch(()=>{});
  }
  function openCall(replay=false,withGesture=true){
    messageReturn=replay;
    showMessage(replay||state().messageOpened);
    if(withGesture){
      if(!replay&&!state().messageOpened)enableSound();
      requestGameFullscreen();
    }
  }
  function showMessage(opened=false){
    stopPings();modal.querySelector('video')?.pause();
    modal.classList.add('message-modal');
    modal.innerHTML=`<section class="message-screen ${opened?'message-opened':'message-incoming'}" aria-labelledby="message-title">
      <header class="message-status"><span><i class="status-dot"></i> PIXEL / MESSENGER</span><div class="message-status-actions">${document.fullscreenEnabled&&document.documentElement.requestFullscreen?'<button class="text-link game-fullscreen" data-action="game-fullscreen" aria-label="Zapnúť celú obrazovku">⛶ Celá obrazovka</button>':''}<button class="text-link" data-action="close">${messageReturn?'← Späť do hry':preview?'← Späť do storyboardu':'Pozastaviť'}</button></div></header>
      ${opened?`<div class="message-thread"><div class="message-sender">${sprite('piko')}<div><span class="section-kicker">PRIJATÁ SPRÁVA</span><h1 id="message-title">Piko</h1></div><span class="message-badge">VIDEO</span></div>
        <div class="message-video-wrap"><div class="message-video-surface"><video id="piko-video" controls playsinline preload="metadata" aria-label="Videospráva od Pika"></video><button class="message-video-replay" data-action="replay-message" aria-label="Prehrať správu od Pika znova" hidden><span class="message-play-circle" aria-hidden="true">▶</span><span>Prehrať znova</span></button></div><p id="message-video-status" role="status" hidden></p></div>
        <p class="message-caption">${esc(GAME.stages[0].task)} <span class="intro-phone-away" ${state().messageWatched?'':'hidden'}>Telefón môžete odložiť a ísť hľadať prvú indíciu.</span></p>
        <div class="message-actions"><button class="btn" data-action="replay-message">▷ Prehrať znova</button><button class="btn secondary" data-action="back-to-message">Späť k správe</button></div>
        </div>`:
        `<div class="message-waiting message-introduction"><div class="message-sender">${sprite('piko')}<div><span class="section-kicker">${esc(GAME.stages[0].label)}</span><h1 id="message-title">Piko potrebuje pomoc</h1></div></div>${STORY_TEXT.html('intro')}<div class="message-actions"><button class="btn message-notification" data-action="accept-call">▶ Prehrať Pikovu správu</button></div></div>
        <button class="text-link message-sound" data-action="message-sound" aria-pressed="false">♪ Zapnúť zvuk</button>`}
      <footer class="message-footer"><span class="message-home-bar" aria-hidden="true"></span></footer>
    </section>`;
    if(!modal.open)modal.showModal();
    if(opened){
      const video=modal.querySelector('video'),status=modal.querySelector('#message-video-status');
      const replay=modal.querySelector('.message-video-replay');
      video.addEventListener('loadedmetadata',()=>{video.closest('.message-video-wrap').style.setProperty('--video-ratio',video.videoWidth/video.videoHeight);});
      video.addEventListener('play',()=>{replay.hidden=true;video.controls=true;});
      video.addEventListener('ended',()=>{state().messageWatched=true;save();video.controls=false;replay.hidden=false;modal.querySelector('.intro-phone-away').hidden=false;});
      video.addEventListener('error',()=>{status.hidden=false;status.textContent='Správu sa nepodarilo načítať. Skúste ju prehrať znova alebo požiadajte dospelého pomocníka.';});
      video.src=GAME.video;
      video.play().catch(()=>{});
    }else if(!opened){
      pingTimer=setInterval(ping,4800);
    }
    modal.querySelector(opened?'.message-actions [data-action="replay-message"]':'[data-action="accept-call"]')?.focus({preventScroll:true});
  }
  function recordTaskCompletion(){const n=state().stage;if(!state().completed.includes(n)){state().completed.push(n);state().completed.sort((a,b)=>a-b);}save();}
  function completeTask(){const n=state().stage;if(n===7)primeFinaleVideo();recordTaskCompletion();success=true;render({autoplayMiky:n===1,autoplayPlugy:n===3,autoplayGuardy:n===6,autoplayFinale:n===7});goTop();}
  function verify(raw){const t=GAME.stages[state().stage];if(t.paperOnly||state().stage===3||state().stage===5)return;const valid=state().stage===1?/^[0-9]{6}$/.test(raw)&&raw===t.answer[0]:t.answer.some(a=>normalize(raw)===normalize(a));
    if(valid){completeTask();}
    else{const fb=document.querySelector('#feedback');fb.textContent=state().stage===1?'Tento kód ešte nesedí. Skúste znova skontrolovať poradie záznamov.':'Tento kód ešte nesedí. Skúste sa poradiť v tíme alebo otvoriť nápovedu.';document.querySelector('#answer')?.setAttribute('aria-invalid','true');}
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a');if(!b)return;
    if(b.classList.contains('brand')){e.preventDefault();preview=null;navigate('sales');return;}
    if(b.dataset.view){preview=null;navigate(b.dataset.view);return;}
    const a=b.dataset.action;if(!a)return;
    if(a==='cipko'){if(cipkoSuppressClick){cipkoSuppressClick=false;return;}if(view!=='player'||state().stage!==5||state().completed.includes(5))return;CIPKO_GAME.act(state(),b.dataset.kind,Number(b.dataset.index));if(CIPKO_GAME.ready(state())){completeTask();return;}save();render();return;}
    if(a==='copy-opengen-prompt'){
      const field=document.getElementById('finale-opengen-text'),status=document.getElementById('opengen-copy-status');
      if(!field||!status)return;
      const fallback=()=>{field.focus();field.select();status.textContent='Zadanie je označené. Skopíruj ho pomocou Ctrl+C alebo ponuky telefónu.';};
      if(!navigator.clipboard?.writeText){fallback();return;}
      navigator.clipboard.writeText(field.value).then(()=>{status.textContent='Celé zadanie je skopírované.';}).catch(fallback);return;
    }
    if(a==='end-game'||a==='close-window'){
      app.querySelectorAll('video,audio').forEach(media=>media.pause());
      clearTimeout(finaleEndTimer);finaleEndTimer=null;
      clearTimeout(finaleStartTimer);finaleStartTimer=null;
      if(preview){preview=null;navigate('designer');return;}
      window.close();
      setTimeout(()=>{if(!window.closed&&b.isConnected){b.textContent=a==='end-game'?'Hra skončila. Kartu môžete zavrieť.':'Okno môžete zavrieť.';b.setAttribute('aria-live','polite');}},350);return;
    }
    if(a==='finale-video-toggle'){
      const video=app.querySelector('#finale-video');
      if(video){if(!video.paused&&!video.ended)video.pause();else video.finalePlay();}return;
    }
    if(a==='toggle-copy'){
      const content=document.getElementById(b.dataset.target);if(!content)return;
      content.hidden=!content.hidden;b.setAttribute('aria-expanded',String(!content.hidden));return;
    }
    if(a==='toggle-storyboard'){
      const content=document.getElementById(b.getAttribute('aria-controls'));if(!content)return;
      content.hidden=!content.hidden;
      b.setAttribute('aria-expanded',String(!content.hidden));
      b.querySelector('span').textContent=content.hidden?'+':'−';
      b.setAttribute('aria-label',`${content.hidden?'Rozbaliť':'Zbaliť'} blok ${b.dataset.label}`);
      content.closest('.storyboard').classList.toggle('is-collapsed',content.hidden);
      if(content.hidden)content.querySelectorAll('video,audio').forEach(media=>media.pause());
      return;
    }
    if(a==='read-guardy-message'){showDialog(`<section class="miky-message-reading"><h2>Guardyho správa</h2>${STORY_TEXT.html(GAME.stages[6],'after')}</section>`);return;}
    if(a==='read-miky-message'){readMikyMessage();return;}
    if(a==='plugy-cell'){selectPlugyCell(b);return;}
    if(a==='plugy-hint'){plugyHint();return;}
    if(a==='read-plugy-message'){readPlugyMessage();return;}
    if(a==='plugy-audio-toggle'){
      const audio=app.querySelector('#plugy-audio');
      if(audio){if(!audio.error&&!audio.paused&&!audio.ended)audio.pause();else{if(audio.ended||audio.plugyReplayReady)audio.currentTime=0;playPlugyAudio(audio);}}
      return;
    }
    if(a==='guardy-audio-toggle'){
      const audio=app.querySelector('#guardy-audio');
      if(audio){if(!audio.error&&!audio.paused&&!audio.ended)audio.pause();else{if(audio.ended||audio.mikyReplayReady)audio.currentTime=0;playMikyAudio(audio);}}return;
    }
    if(a==='miky-audio-toggle'){
      const audio=app.querySelector('#miky-audio');
      if(audio){if(!audio.error&&!audio.paused&&!audio.ended)audio.pause();else{if(audio.ended||audio.mikyReplayReady)audio.currentTime=0;playMikyAudio(audio);}}
      return;
    }
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
    if(a==='purchase'){location.assign(SITE_CONFIG.purchase.url);return;}
    if(a==='preview-media'){
      const id=b.dataset.media,isPiko=id==='piko',isVideo=isPiko||id==='finale',name=isPiko?'Piko':id==='plugy'?'Plugy':id==='guardy'?'Guardy':'Miky';
      const title=id==='finale'?'Záverečná rozlúčka':isPiko?'Pikova videospráva':id==='plugy'?'Plugyho hlasová správa':id==='guardy'?'Guardyho hlasová správa':'Mikyho hlasová správa';
      const source=id==='finale'?GAME.finaleVideo:isPiko?GAME.video:id==='plugy'?GAME.plugyAudio:id==='guardy'?GAME.guardyAudio:GAME.audio;
      showDialog(`<section class="media-preview ${isVideo?'piko-media-preview':''}"><span class="section-kicker">KONTROLA NAHRÁVKY</span><h2>${title}</h2>${isVideo?`<video controls playsinline preload="metadata" src="${esc(source)}" aria-label="${isPiko?'Náhľad Pikovej videosprávy':'Náhľad záverečného videa'}"></video>`:`<audio controls playsinline preload="auto" src="${esc(source)}" aria-label="${name} – náhľad hlasovej správy"></audio>`}${isPiko?`<p class="preview-message-instructions">${esc(GAME.stages[0].task)}</p>`:''}<p role="status" class="preview-media-status">Načítava sa nahrávka…</p></section>`);
      const media=modal.querySelector('video,audio'),status=modal.querySelector('.preview-media-status');
      media.addEventListener('playing',()=>{status.textContent='Správa sa prehráva.';});
      media.addEventListener('pause',()=>{if(!media.ended&&!media.error)status.textContent='Správa je pozastavená. Pokračujte tlačidlom prehrávania.';});
      media.addEventListener('ended',()=>{status.textContent='Správa dohrala. Môžete si ju prehrať znova.';});
      media.addEventListener('error',()=>{status.textContent='Nahrávku sa nepodarilo načítať. Skúste ju otvoriť znova. Text správy je dostupný v storyboarde.';});
      media.play().catch(error=>{if(error.name==='NotAllowedError')status.textContent='Spustite správu tlačidlom prehrávania.';else status.textContent='Prehrávanie sa nepodarilo. Skúste nahrávku otvoriť znova.';});
      return;
    }
    if(a==='start')start();
    if(a==='restart-adventure'){if(!internal || !SITE_CONFIG.access.canLaunch(PREP_STORE.ready()))return;preview=null;progress=fresh();success=false;start();}
    if(a==='home'){navigate('prep');}
    if(a==='stage'){state().stage=Number(b.dataset.stage);success=false;save();render();goTop();}
    if(a==='test'){if(environment!=='designer' || SITE_CONFIG.access.mode!=='test')return;const n=Number(b.dataset.stage);if(!GAME.stages[n]||GAME.stages[n].paperOnly)return;preview={started:true,callDone:n!==0,stage:n,completed:Array.from({length:Math.max(0,n-1)},(_,i)=>i+1),hints:{}};view='player';success=false;if(n===0)openCall();else{requestGameFullscreen();render();goTop();}}
    if(a==='exit-test'){preview=null;navigate('designer');}
    if(a==='close'){const wasIntro=modal.classList.contains('message-modal')&&!messageReturn;closeModal();if(wasIntro){if(preview){preview=null;navigate('designer');}else{navigate('prep');}}}
    if(a==='game-fullscreen')requestGameFullscreen();
    if(a==='accept-call'){requestGameFullscreen();state().messageOpened=true;save();showMessage(true);}
    if(a==='back-to-message'){state().messageOpened=false;save();showMessage(false);}
    if(a==='message-sound')enableSound();
    if(a==='replay-message'){
      requestGameFullscreen();
      const video=modal.querySelector('video');
      if(video){
        const status=modal.querySelector('#message-video-status'),replay=modal.querySelector('.message-video-replay');
        status.hidden=true;if(video.error)video.load();video.currentTime=0;video.controls=true;replay.hidden=true;
        video.play().catch(()=>{replay.hidden=false;});
      }else{showMessage(true);}
    }
    if(a==='reopen-message')openCall(true);
    if(a==='hint'){const s=state(),t=GAME.stages[s.stage];s.hints[s.stage]=Math.min((Number(s.hints[s.stage])||0)+1,t.hints.length);save();const input=document.querySelector('#answer')?.value;render();if(input)document.querySelector('#answer').value=input;document.querySelector('#hints').scrollIntoView({block:'nearest'});}
    if(a==='next'){state().stage=Math.min(FINAL_STAGE,state().stage+1);success=false;save();render();goTop();}
    if(a==='print')window.print();
    if(a==='reset')showDialog(`<h2>Začať odznova?</h2><p>Vymaže sa uložený herný postup v tomto prehliadači. Príprava pre rodiča zostane zaškrtnutá.</p><div class="button-row"><button class="btn" data-action="confirm-reset">Áno, nová hra</button><button class="btn secondary" data-action="close">Pokračovať v aktuálnej</button></div>`);
    if(a==='confirm-reset'){closeModal();preview=null;progress=fresh();save();navigate('prep');}
  });
  let cipkoDrag=null,cipkoPointer=null,cipkoSuppressClick=false;
  document.addEventListener('pointerdown',e=>{const tile=e.target.closest('.cipko-tile');if(tile&&e.pointerType!=='mouse')cipkoPointer={id:Number(tile.dataset.index),x:e.clientX,y:e.clientY,tile};});
  document.addEventListener('pointermove',e=>{if(cipkoPointer){const {tile,x,y}=cipkoPointer;tile.style.transform=`translate(${e.clientX-x}px,${e.clientY-y}px)`;tile.style.zIndex='5';}});
  document.addEventListener('pointerup',e=>{
    if(!cipkoPointer)return;
    const drag=cipkoPointer;cipkoPointer=null;drag.tile.style.transform='';drag.tile.style.zIndex='';
    if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<10)return;
    const slot=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cipko-slot');
    if(!slot||view!=='player'||state().stage!==5)return;
    CIPKO_GAME.act(state(),'select',drag.id);CIPKO_GAME.act(state(),'slot',Number(slot.dataset.index));save();render();
    cipkoSuppressClick=true;setTimeout(()=>{cipkoSuppressClick=false;},0);
  });
  document.addEventListener('pointercancel',()=>{if(cipkoPointer){cipkoPointer.tile.style.transform='';cipkoPointer.tile.style.zIndex='';}cipkoPointer=null;});
  document.addEventListener('dragstart',e=>{const tile=e.target.closest('.cipko-tile');if(tile){cipkoDrag=Number(tile.dataset.index);e.dataTransfer.setData('text/plain',String(cipkoDrag));}});
  document.addEventListener('dragover',e=>{if(e.target.closest('.cipko-slot'))e.preventDefault();});
  document.addEventListener('drop',e=>{const slot=e.target.closest('.cipko-slot');if(!slot||cipkoDrag===null||view!=='player'||state().stage!==5)return;e.preventDefault();CIPKO_GAME.act(state(),'select',cipkoDrag);CIPKO_GAME.act(state(),'slot',Number(slot.dataset.index));cipkoDrag=null;save();render();});
  document.addEventListener('dragend',()=>{cipkoDrag=null;});
  document.addEventListener('focusin',keepAnswerVisible);
  document.addEventListener('focusout',keepAnswerVisible);
  window.addEventListener('resize',keepAnswerVisible);
  window.visualViewport?.addEventListener('resize',keepAnswerVisible);
  window.visualViewport?.addEventListener('scroll',keepAnswerVisible);
  document.addEventListener('submit',e=>{if(e.target.matches('.answer-form')){e.preventDefault();verify(new FormData(e.target).get('answer'));}});
  document.addEventListener('change',e=>{if(e.target.matches('[data-check]')){PREP_STORE.write(e.target.dataset.check,e.target.checked);updatePreparation();}});
  window.addEventListener('storage',e=>{if(view==='prep' && (e.key===null || e.key.startsWith('zahada-prep-'))){app.querySelectorAll('[data-check]').forEach(el=>{el.checked=PREP_STORE.read(el.dataset.check);});updatePreparation();}});
  modal.addEventListener('cancel',e=>{e.preventDefault();modal.querySelector('[data-action="close"]')?.click();});
  modal.addEventListener('close',()=>{stopPings();modal.querySelectorAll('video,audio').forEach(media=>media.pause());});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)ping();});
  // Printed QR codes open their signal without an on-screen continue action.
  const scannedSignal={miky:1,plugy:3,pingy:4,cipko:5,guardy:6,navrat:7}[new URLSearchParams(location.search).get('signal')];
  if(environment==='player' && SITE_CONFIG.access.mode==='test' && Number.isInteger(scannedSignal)){
    progress.started=true;progress.callDone=true;
    progress.stage=scannedSignal;
    // These two QR entries carry the preceding paper-only letter into saved progress.
    const paperStep={3:2,5:4}[scannedSignal];
    if(paperStep&&!progress.completed.includes(paperStep))progress.completed.push(paperStep);
    progress.completed.sort((a,b)=>a-b);
    view='player';save();
  }
  render();
  // Each entry opens its own environment. Gameplay resumes only after an explicit prepared test launch.
  if(environment==='prep'&&location.hash==='#kniznica'){
    requestAnimationFrame(()=>document.getElementById('kniznica')?.scrollIntoView({behavior:'instant'}));
  }else{
    if(location.hash)history.replaceState(null,'',location.pathname+location.search);
    window.scrollTo(0,0);
  }
})();
