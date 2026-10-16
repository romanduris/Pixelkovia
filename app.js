(() => {
  'use strict';
  const app = document.querySelector('#app');
  const modal = document.querySelector('#modal');
  const KEY = 'zahada-v1-progress';
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const fresh = () => ({started:false, callDone:false, stage:0, completed:[], hints:{}, scenePages:{}});
  let progress = fresh(), view = 'sales', preview = null, sequence = [], messageReturn = false, pingTimer = null, soundContext = null;
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
  function goTop(){app.scrollTop=0;window.scrollTo({top:0,behavior:'instant'});app.querySelector('h1')?.focus({preventScroll:true});}
  function navigate(next){view=next;success=false;sequence=[];render();goTop();}
  function stopPings(){clearInterval(pingTimer);pingTimer=null;}
  function closeModal(){
    stopPings();modal.querySelectorAll('video,audio').forEach(media=>media.pause());modal.close();modal.classList.remove('message-modal');
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
  function landing(){return SITE_CONTENT.sales({sprite,has:progress.started,completed:progress.completed.length});}
  const checklist = [
    'Vytlačiť pracovné listy P1–P6 jednostranne (P4 obsahuje oba kruhy).',
    'Pripraviť 4 obálky, ceruzku, papierovú pásku a detské nožnice.',
    'Vopred rozstrihať iba P2 na štyri pásiky. Signály P1 a kruhy P4 vystrihujú až deti.',
    'Očíslovať obálky 1–4, pridať malú hviezdu ✦ a rozmiestniť ich podľa tabuľky.',
    'Otvoriť hru na nabitom telefóne, otestovať Pikovo video aj Kvakovu hlasovú správu a nastaviť hlasitosť.',
    'Zhromaždiť tím a až potom spustiť dobrodružstvo. Príde Pikova správa.'
  ];
  function prep(){return SITE_CONTENT.prep({sprite,checklist,progress,mapHTML});}
  function designer(){return SITE_CONTENT.designer({sprite,fullScene,linesHTML});}
  function aside(){const s=state();return `<aside class="task-aside"><div class="panel"><h3>Záchranná linka</h3>${contactsHTML()}<p class="aside-copy">${Math.min(s.completed.length,6)} zo 6 kontaktov obnovených.</p>${mapHTML()}<div class="progress-track"><span style="width:${s.completed.length/8*100}%"></span></div><p class="aside-copy">${s.completed.length} z 8 úloh vyriešených</p><div class="fragment-row">${allTasks.slice(0,6).map((t,i)=>`<span class="fragment" title="Úloha ${i+1}">${s.completed.includes(i+1)?t.reward:'·'}</span>`).join('')}</div><button class="text-link" data-action="notebook">Otvoriť zápisník ↗</button></div></aside>`;}
  function taskScreen(){const s=state(),n=s.stage,t=GAME.stages[n];
    if(n===0)return landing();
    const toolbar=`<div class="task-toolbar"><button class="text-link" ${preview?'data-action="exit-test"':'data-action="home"'}>← ${preview?'Späť do storyboardu':'Prehľad dobrodružstva'}</button><span class="time-pill">${preview?'TEST ETAPY · ':''}${t.label} · ~${total(t)} min</span>${s.callDone?'<button class="text-link" data-action="reopen-message">Pikova správa ▷</button>':''}</div>`;
    if(n===1&&(success||s.completed.includes(1)))return kvakConnectionScreen();
    if(n===1&&s.kvakScan)return kvakRestoreScreen();
    if(n===9)return `<section class="task-wrap">${toolbar}<div class="finale"><div class="final-icon">✧</div>${contactsHTML(true)}<div class="eyebrow" style="justify-content:center">VŠETKÝCH SEDEM JE DOMA</div><h1 class="screen-heading" tabindex="-1" style="text-align:center">${t.title}</h1>${sceneReader(t,'before')}<div style="max-width:430px;margin:auto">${mapHTML()}</div>${atlasInvitation(t)}<div class="button-row"><button class="btn secondary" data-action="notebook">Váš tímový zápisník ↗</button><button class="btn secondary" data-action="reset">Nové dobrodružstvo ↺</button></div></div></section>`;
    if(success||s.completed.includes(n))return `<section class="task-wrap">${toolbar}<div class="success-card">${t.character?sprite(t.character,'success-character'):'<div class="success-icon">✓</div>'}<div class="eyebrow" style="justify-content:center">ÚLOHA ${n} VYRIEŠENÁ</div><h1 class="screen-heading" tabindex="-1" style="font-size:36px">${t.character?'Spojenie obnovené.':n===7?'Nikto nezostane vzadu.':'Spoločný signál prijatý.'}</h1>${sceneReader(t,'after')}${sceneFinished(t,'after')?`<div class="big-fragment" aria-label="Získaná indícia ${t.reward}">${t.reward}</div><p>${esc(t.transition)}</p>${mapHTML()}<button class="btn" data-action="next">${n===8?'Dokončiť bezpečný návrat':'Pokračovať v príbehu'} →</button>`:'<p class="quiet">Prečítajte spojenie s Pixelkom. Odpoveď aj váš postup sú už uložené.</p>'}</div></section>`;
    const sheet={1:'p1',2:'p2',3:'p3',4:'p4',5:'p5',6:'p5',7:'p6',8:'p6'};
    const hints=Number.isInteger(s.hints[n])?Math.min(s.hints[n],t.hints.length):0;
    return `<section class="task-wrap">${toolbar}<div class="task-layout"><article class="task-main"><div class="eyebrow"><span class="status-dot"></span>PIXELKOVIA / STRATENÝ SIGNÁL / ${String(n).padStart(2,'0')}</div><h1 class="screen-heading" tabindex="-1">${t.title}</h1>${t.character?`<div class="task-character">${sprite(t.character)}<div><span class="section-kicker">OBNOVTE KONTAKT</span><strong>${character(t.character).name}</strong><small>${character(t.character).role}</small></div></div>`:''}${sceneReader(t,'before')}${sceneFinished(t,'before')?`<div class="task-instruction"><h2>Najprv sa rozhliadnite.</h2><p>${esc(t.action)}</p><h2>Vaša úloha</h2><p>${esc(t.task)}</p><a class="text-link" style="padding-left:0" href="printables.html?sheet=${sheet[n]}#${sheet[n]}" target="_blank" rel="noopener">Nemáte papier? Otvoriť pracovný list ↗</a></div>${n===1?`<div class="scan-entry"><span class="scan-icon" aria-hidden="true">⌗</span><p>Máte zo signálov zostavený šesťmiestny kód? Aktivujte Kvakovu linku.</p><button class="btn" data-action="scan-kvak">Simulovať naskenovanie QR</button></div>`:t.digital?`<div class="symbol-buttons" role="group" aria-label="Výber symbolov">${['star','moon','sun'].map(k=>`<button class="symbol-btn" data-symbol="${k}" aria-label="${names[k]}">${symbols[k]}</button>`).join('')}</div><div id="sequence" class="sequence" role="status" aria-label="Vybrané symboly"></div><div class="button-row" style="margin-top:15px"><button class="btn" data-action="verify-sequence">Overiť poradie →</button><button class="text-link" data-action="clear-sequence">Vymazať výber ↺</button></div>`:`<form class="answer-form"><label for="answer">${n===8?'Návratové heslo':'Odpoveď vášho tímu'}</label><div class="answer-row"><input id="answer" name="answer" autocomplete="off" maxlength="40" ${[1,3,5].includes(n)?'inputmode="numeric"':''} placeholder="${t.placeholder}" required><button class="btn" type="submit">Overiť <span>→</span></button></div></form>`}<p class="feedback" id="feedback" role="status"></p><div class="hint-box"><button class="text-link" style="padding-left:0" data-action="hint" ${hints===t.hints.length?'disabled':''}>◇ ${hints===t.hints.length?'Všetky nápovedy sú zobrazené':`Potrebujeme nápovedu (${hints}/${t.hints.length})`}</button><div id="hints" aria-live="polite">${t.hints.slice(0,hints).map(h=>`<p>${esc(h)}</p>`).join('')}</div></div>`:''}</article>${aside()}</div></section>`;
  }
  function kvakHeader(back,label){return `<header class="signal-header"><button class="text-link" data-action="${back}">← ${back==='restore-back'?'Pracovný list':preview?'Späť do storyboardu':'Prehľad hry'}</button><span class="section-kicker">PIXEL / ${label}</span><button class="text-link" data-action="game-fullscreen" aria-label="Zapnúť celú obrazovku">⛶</button></header>`;}
  function kvakHints(){const t=GAME.stages[1],h=Math.min(Number(state().hints[1])||0,t.hints.length);return `<div class="hint-box"><button class="text-link" data-action="hint" ${h===t.hints.length?'disabled':''}>◇ Potrebujeme nápovedu (${h}/${t.hints.length})</button><div id="hints" aria-live="polite">${t.hints.slice(0,h).map(x=>`<p>${esc(x)}</p>`).join('')}</div></div>`;}
  function kvakRestoreScreen(){app.classList.add('signal-mode');return `<section class="signal-screen signal-restore" aria-labelledby="restore-title">${kvakHeader('restore-back','OBNOVA LINKY')}<div class="signal-content">${sprite('kvak','signal-avatar')}<div class="eyebrow">ŠESŤ KÚSKOV. JEDNO SPOJENIE.</div><h1 id="restore-title" tabindex="-1">OBNOVA SPOJENIA – KVAK</h1><p>Našli ste šesť záznamov? Zadajte kód, ktorý vznikol ich správnym usporiadaním.</p><form class="answer-form signal-form"><label for="answer">Kód na obnovenie spojenia</label><input id="answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" autocomplete="off" spellcheck="false" placeholder="••••••" aria-describedby="feedback" required><button class="btn" type="submit">OBNOVIŤ SPOJENIE</button></form><p class="feedback" id="feedback" role="status"></p>${kvakHints()}</div><footer class="signal-footer">Záznamy zostávajú na papieri. Spojenie sa začína u vás.</footer></section>`;}
  function kvakConnectionScreen(){app.classList.add('signal-mode');return `<section class="signal-screen signal-connected success-card" aria-labelledby="connection-title">${kvakHeader(preview?'exit-test':'home','SPOJENIE AKTÍVNE')}<div class="signal-content"><div class="eyebrow"><span class="status-dot"></span> LINKA 01 / OBNOVENÁ</div><h1 id="connection-title" tabindex="-1">SPOJENIE OBNOVENÉ!</h1><div class="signal-duo" aria-label="Piko a Kvak sú spolu na linke"><div class="signal-person">${sprite('piko','piko-listener')}<strong>Piko</strong><small>Na linke</small></div><div class="connection-line" aria-hidden="true"><span></span><i>✦</i><span></span></div><div class="signal-person kvak-speaker">${sprite('kvak','success-character')}<strong>Kvak</strong><small>Hlasová správa</small></div></div><p class="signal-intro">Kvak vás počuje. Má pre vás správu!</p><audio id="kvak-audio" preload="none" src="${esc(GAME.audio)}" aria-label="Kvakova hlasová správa"></audio><div class="signal-audio-controls"><button class="btn" data-action="kvak-play">▶ Prehrať hlasovú správu</button><button class="btn secondary" data-action="kvak-pause" disabled>Ⅱ Pozastaviť</button><button class="text-link" data-action="kvak-replay">↺ Prehrať znova</button></div><p id="kvak-audio-status" role="status">Správu si môžete vypočuť, koľkokrát potrebujete.</p><details id="kvak-transcript" class="signal-transcript"><summary>Čítať Kvakovu správu</summary><div>${GAME.kvakMessage.map(l=>`<p>${esc(l)}</p>`).join('')}</div></details><div class="signal-reward"><span>VAŠA ZÍSKANÁ INDÍCIA</span><strong>S</strong><small>Je uložená v tímovom zápisníku.</small></div><button class="btn" data-action="next">Máme ďalšiu obálku →</button><button class="text-link" data-action="notebook">Tímový zápisník ↗</button></div></section>`;}
  function bindKvakAudio(){const audio=app.querySelector('#kvak-audio');if(!audio)return;const screen=audio.closest('.signal-screen'),status=app.querySelector('#kvak-audio-status'),play=app.querySelector('[data-action="kvak-play"]'),pause=app.querySelector('[data-action="kvak-pause"]');
    let failed=false;
    const idle=()=>{screen.classList.remove('is-speaking');pause.disabled=true;play.disabled=false;};
    const fallback=()=>{if(!audio.isConnected)return;failed=true;idle();const text=app.querySelector('#kvak-transcript');text.open=true;status.textContent='Hlasovú správu sa nepodarilo prehrať. Kvakov celý odkaz si môžete prečítať nižšie a pokračovať v hre.';};
    audio.addEventListener('play',()=>{failed=false;screen.classList.add('is-speaking');pause.disabled=false;play.disabled=true;status.textContent='Hovorí Kvak…';});
    audio.addEventListener('pause',()=>{idle();if(failed)return;status.textContent=audio.ended?'Správa sa skončila. Môžete si ju prehrať znova.':'Správa je pozastavená. Pokračujte tlačidlom Prehrať hlasovú správu.';});
    audio.addEventListener('ended',()=>{idle();status.textContent='Správa sa skončila. Môžete si ju prehrať znova.';});
    audio.addEventListener('error',fallback);audio.kvakFallback=fallback;
  }
  function render(){
    app.classList.remove('signal-mode');app.querySelectorAll('video,audio').forEach(media=>media.pause());
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===(view==='player'?'prep':view)));
    app.innerHTML=view==='prep'?prep():view==='designer'?designer():view==='player'&&state().started&&state().stage>0?taskScreen():landing();
    bindKvakAudio();
    if(view==='prep') document.querySelectorAll('[data-check]').forEach(el=>{try{el.checked=localStorage.getItem('zahada-prep-'+el.dataset.check)==='1';}catch(_){}});
  }
  function start(){
    view='player';state().started=true;save();
    if(!state().callDone)openCall();
    else{requestGameFullscreen();if(state().stage===0)state().stage=state().completed.length===8?9:state().completed.length+1;save();render();goTop();}
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
      const replay=modal.querySelector('.message-video-replay');
      video.addEventListener('loadedmetadata',()=>{video.closest('.message-video-wrap').style.setProperty('--video-ratio',video.videoWidth/video.videoHeight);});
      video.addEventListener('play',()=>{replay.hidden=true;video.controls=true;});
      video.addEventListener('ended',()=>{state().messageWatched=true;save();video.controls=false;replay.hidden=false;modal.querySelector('[data-action="finish-call"]').hidden=false;});
      video.addEventListener('error',()=>{status.hidden=false;status.textContent='Správu sa nepodarilo načítať. Skúste ju prehrať znova alebo požiadajte dospelého pomocníka.';});
      video.src=GAME.video;
      video.play().catch(()=>{});
    }else{
      pingTimer=setInterval(ping,4800);
    }
    modal.querySelector(opened?'.message-actions [data-action="replay-message"]':'[data-action="accept-call"]')?.focus({preventScroll:true});
  }
  function verify(raw){const t=GAME.stages[state().stage];const valid=t.digital?raw===t.answer[0]:(state().stage===1?/^[0-9]{6}$/.test(raw)&&raw===t.answer[0]:t.answer.some(a=>normalize(raw)===normalize(a)));
    if(valid){const n=state().stage;if(!state().completed.includes(n)){state().completed.push(n);state().completed.sort((a,b)=>a-b);}save();success=true;sequence=[];render();goTop();}
    else{const fb=document.querySelector('#feedback');fb.textContent='Tento kód ešte nesedí. Skúste sa poradiť v tíme alebo otvoriť nápovedu.';document.querySelector('#answer')?.setAttribute('aria-invalid','true');}
  }
  function notebook(){const s=state();showDialog(`<span class="section-kicker">VÁŠ ZÁCHRANNÝ ZÁPISNÍK</span><h2>Každá stopa sa počíta.</h2><p>${s.completed.length} z 8 úloh vyriešených.</p>${contactsHTML()}${mapHTML()}${allTasks.map((t,i)=>`<div class="notebook-row"><span>${i+1}. ${esc(t.title)}</span><strong>${s.completed.includes(i+1)?t.reward:'·'}</strong></div>`).join('')}${s.completed.includes(7)?'<div class="notice">Karta poradia: písmená z úloh 1 → 2 → 3 → 4 → 5 → 6.</div>':'<p class="quiet">Každá vyriešená úloha uloží svoj objav sem.</p>'}`);}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a');if(!b)return;
    if(b.classList.contains('brand')){e.preventDefault();preview=null;navigate('sales');return;}
    if(b.dataset.view){preview=null;navigate(b.dataset.view);return;}
    if(b.dataset.symbol){if(sequence.length<3){sequence.push(b.dataset.symbol);const el=document.querySelector('#sequence');el.textContent=sequence.map(k=>symbols[k]).join(' ');el.setAttribute('aria-label',sequence.map(k=>names[k]).join(', '));}return;}
    const a=b.dataset.action;if(!a)return;
    if(a==='scan-kvak'){if(state().stage!==1||state().completed.includes(1))return;state().kvakScan=true;save();requestGameFullscreen();render();goTop();return;}
    if(a==='restore-back'){state().kvakScan=false;save();render();goTop();return;}
    if(a==='kvak-play'||a==='kvak-replay'){const audio=app.querySelector('#kvak-audio');if(audio){if(a==='kvak-replay')audio.currentTime=0;if(audio.error)audio.load();audio.play().catch(()=>audio.kvakFallback());}return;}
    if(a==='kvak-pause'){app.querySelector('#kvak-audio')?.pause();return;}
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
    if(a==='purchase'){showDialog(`<div class="purchase-preview"><span class="section-kicker">VAŠE ĎALŠIE RODINNÉ DOBRODRUŽSTVO</span><h2>Pixelkovia sa už pripravujú.</h2><p>Predaj ešte nie je spustený. Plánovaná úvodná cena je <strong>14,99 €</strong>, bežná cena <strong>19,99 €</strong>.</p><p>Po dokončení predaja tu zákazník získa prístup k príprave, hre a materiálom. Zatiaľ si môžete pozrieť ukážku zákazníckej sekcie.</p><button class="btn" data-action="preview-customer">Pozrieť zákaznícku sekciu →</button></div>`);return;}
    if(a==='preview-customer'){closeModal();navigate('prep');return;}
    if(a==='preview-media'){const isPiko=b.dataset.media==='piko';showDialog(`<section class="media-preview"><span class="section-kicker">KONTROLA NAHRÁVKY</span><h2>${isPiko?'Pikova videospráva':'Kvakova hlasová správa'}</h2>${isPiko?`<video controls playsinline preload="metadata" src="${esc(GAME.video)}" aria-label="Náhľad Pikovej videosprávy"></video>`:`<audio controls preload="metadata" src="${esc(GAME.audio)}" aria-label="Náhľad Kvakovej hlasovej správy"></audio>`}<p role="status" class="preview-media-status"></p></section>`);const media=modal.querySelector('video,audio');media.addEventListener('error',()=>{modal.querySelector('.preview-media-status').textContent='Nahrávku sa nepodarilo načítať. Text a podklady nájdete v StoryBoarde.';});media.play().catch(()=>{});return;}
    if(a==='start')start();
    if(a==='restart-adventure'){preview=null;progress=fresh();success=false;sequence=[];start();}
    if(a==='home'){navigate('sales');}
    if(a==='stage'){state().stage=Number(b.dataset.stage);success=false;sequence=[];save();render();goTop();}
    if(a==='test'){const n=Number(b.dataset.stage);preview={started:true,callDone:n!==0,stage:n,completed:Array.from({length:Math.max(0,n-1)},(_,i)=>i+1),hints:{}};view='player';success=false;sequence=[];if(n===0)openCall();else{render();goTop();}}
    if(a==='exit-test'){preview=null;navigate('designer');}
    if(a==='close'){const wasIntro=modal.classList.contains('message-modal')&&!messageReturn;closeModal();if(wasIntro){if(preview){preview=null;navigate('designer');}else{app.innerHTML=landing();goTop();}}}
    if(a==='game-fullscreen')requestGameFullscreen();
    if(a==='accept-call'){requestGameFullscreen();state().messageOpened=true;save();showMessage(true);}
    if(a==='message-sound')enableSound();
    if(a==='replay-message'){
      requestGameFullscreen();
      const video=modal.querySelector('video');
      if(video){
        const status=modal.querySelector('#message-video-status'),replay=modal.querySelector('.message-video-replay');
        status.hidden=true;if(video.error)video.load();video.currentTime=0;video.controls=true;replay.hidden=true;
        video.play().catch(()=>{replay.hidden=false;});
      }
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
  modal.addEventListener('close',()=>{stopPings();modal.querySelectorAll('video,audio').forEach(media=>media.pause());});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)ping();});
  render();
  // Every fresh load opens the sales page. Start/continue restores saved gameplay explicitly.
  if(location.hash){history.replaceState(null,'',location.pathname+location.search);}
  window.scrollTo(0,0);
})();
