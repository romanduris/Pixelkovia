(() => {
  'use strict';
  const root=document.querySelector('#supervisor'),logout=document.querySelector('#logout');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const required=['printed','placed','device-understood'];
  const taskNames=['Kúpeľňa','Okno','Stolička','Topánky','Posteľ','Chladnička','Gauč'];
  const shortTaskNames=['Kúp.','Okno','Stol.','Top.','Posteľ','Chlad.','Gauč'];
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{printer:'<path d="M7 8V3h10v5M7 17H4V8h16v9h-3M7 14h10v7H7zM17 11h.01"/>',chevron:'<path d="m6 9 6 6 6-6"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>'}[name]}</svg>`;
  let visitKey;try{visitKey=sessionStorage.getItem('pixelkovia-portal-visit')||crypto.randomUUID();sessionStorage.setItem('pixelkovia-portal-visit',visitKey);}catch{visitKey=crypto.randomUUID();}
  let data,busy=false,rendered='',localChecks={},placements=[],saveError='',identityEpoch=0,loadSequence=0;
  async function api(path,input){const r=await fetch('/api/customer/'+path,{method:input?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:input?{'Content-Type':'application/json'}:{},body:input?JSON.stringify(input):undefined});const value=await r.json();if(!r.ok)throw Object.assign(Error(value.error||'Požiadavka sa nepodarila.'),{status:r.status});return value;}
  function login(){logout.hidden=true;data=null;rendered='';placements=[];localChecks={};root.innerHTML=`<section class="supervisor-card supervisor-login"><img src="assets/atlas/piko.webp" alt="Piko"><span class="section-kicker">RODIČOVSKÝ PORTÁL</span><h1>Prihláste sa k svojej hre.</h1><p>Použite e-mail a heslo z potvrdenia objednávky.</p><form id="customer-login"><label for="login-email">E-mail</label><input id="login-email" name="email" type="email" autocomplete="username" inputmode="email" required maxlength="254"><label for="login-password">Heslo z e-mailu</label><input id="login-password" name="password" type="password" autocomplete="current-password" required minlength="16" maxlength="128"><button class="btn" type="submit">Otvoriť môj portál ${icon('arrow')}</button><p role="status" id="login-status"></p></form><small>Každý nákup má vlastné heslo. Máte viac hier? Použite heslo z e-mailu ku konkrétnej hre.</small></section>`;}
  function stats(run){const min=Math.max(1,Math.round((run.completed_at-run.started_at)/60000));const hints=run.stages.reduce((s,t)=>s+t.hints,0),wrong=run.stages.reduce((s,t)=>s+t.wrong_attempts,0);return `<dl class="run-statistics"><div><dt>Celkový čas</dt><dd>${min} min</dd></div><div><dt>Vyriešené úlohy</dt><dd>${run.stages.filter(s=>s.completed_at!==null).length} / 7</dd></div><div><dt>Nápovedy</dt><dd>${hints}</dd></div><div><dt>Nesprávne pokusy</dt><dd>${wrong}</dd></div></dl><p><small>Čas zahŕňa aj prestávky.</small></p>`;}
  function feedback(){return `<section class="supervisor-card"><span class="section-kicker">ĎAKUJEME ZA ZÁCHRANU PIXELKOV</span><h2>Ako sa vám hralo?</h2>${stats(data.run)}${data.feedback?'<p role="status">✓ Ďakujeme za vaše hodnotenie!</p>':`<form id="game-feedback" class="feedback-form"><fieldset class="rating-stars"><legend>Vaše hodnotenie</legend>${[1,2,3,4,5].map(n=>`<label><input type="radio" name="stars" value="${n}" required aria-label="${n} z 5 hviezdičiek"><span aria-hidden="true">${n}★</span></label>`).join('')}</fieldset><label for="feedback-comment">Čo sa vám páčilo a čo môžeme zlepšiť?</label><textarea id="feedback-comment" name="comment" rows="4" maxlength="2000" placeholder="Vaša spätná väzba…"></textarea><button class="btn" type="submit">Poslať hodnotenie →</button><p id="feedback-status" role="status"></p></form>`}</section>`;}
  function check(id,title,note=''){return `<label class="preparation-step" for="prep-${id}"><input id="prep-${id}" type="checkbox" data-preparation="${id}"><span><strong>${title}</strong>${note?`<small>${note}</small>`:''}</span></label>`;}
  function toggle(id,label){return `<button type="button" class="preparation-toggle" aria-expanded="false" aria-controls="${id}" aria-label="${label}" data-label="${label}" data-expand>${icon('chevron')}</button>`;}
  function preparation(){return `<div class="preparation-checklist" aria-label="Príprava hry v troch krokoch">
    <section class="preparation-block">${check('printed','1. Vytlačte materiály','Materiály mám vytlačené.')}<a class="download" href="/assets/printables/vsetky-materialy.pdf" download><span class="download-icon">${icon('printer')}</span><span><strong>Stiahnuť materiály PDF</strong><small>Návod pre rodiča, 7 úloh a diplom</small></span><span class="download-arrow" aria-hidden="true">↓</span></a></section>
    <section class="preparation-block"><div class="preparation-row">${check('placed','2. Úlohy rozmiestnené')}${toggle('placement-details','Zobraziť miesta pre 7 úloh')}</div><div id="placement-details" class="preparation-details" hidden><div class="placement-list">${placements.map(task=>`<label class="placement-item" for="prep-${esc(task.id)}"><input id="prep-${esc(task.id)}" type="checkbox" data-preparation="${esc(task.id)}"><span><strong>${esc(task.label)}</strong><small>${esc(task.placement)}</small></span></label>`).join('')}</div><p class="preparation-note">Listy ukryte na suché miesta na dosah detí. Nábytok sa nepresúva.</p></div></section>
    <section class="preparation-block"><div class="preparation-row">${check('device-understood','3. Pripravte telefón na hranie','Hru budeme hrať na tomto telefóne.')}${toggle('phone-details','Vysvetliť, na ktorom telefóne spustiť hru')}</div><div id="phone-details" class="preparation-details" hidden><h3>Ktorý telefón bude hrať?</h3><p>Materiály si môžete pripraviť a vytlačiť na počítači. Hru však spustite až na telefóne, ktorý bude používať váš tím.</p></div></section>
  </div>`;}
  function start(){return `<div class="start-panel"><button id="start-game" class="btn start-game" disabled>${data.run?.status==='active'?'Pokračovať v hre':'Spustiť hru'} ${icon('arrow')}</button><p id="start-status" class="portal-status" role="status"></p></div>`;}
  function readChecks(rows){localChecks=Object.fromEntries(rows.map(v=>[v.step_key,v.completed===1]));for(const task of placements)if(!Object.hasOwn(localChecks,task.id))localChecks[task.id]=!!localChecks.placed;}
  function render(){
    logout.hidden=false;const run=data.run,active=run?.status==='active',finished=run?.status==='completed',completed=new Set(run?.stages.filter(s=>s.completed_at!==null).map(s=>s.stage)||[]);
    const opened=[...root.querySelectorAll('[data-expand][aria-expanded="true"]')].map(b=>b.getAttribute('aria-controls'));
    const focusId=document.activeElement?.id,savedOpen=root.querySelector('.saved-preparation')?.open;readChecks(data.checklist);
    root.innerHTML=`<section class="supervisor-hero"><div><p class="portal-greeting">Vitajte.</p><h1>${finished?'Hru ste dokončili.':active?'Vaša hra práve prebieha.':data.entitlement?'Pripravte hru v 3 krokoch.':'Vaše knihy sú pripravené.'}</h1></div></section><div class="supervisor-grid"><div>${data.entitlement?`<section class="supervisor-card game-card" id="vasa-hra"><div class="game-heading"><div><span class="section-kicker">VAŠA HRA</span><h2>Stratený signál</h2></div>${finished?'<span class="preparation-badge">✓ Dokončené</span>':!active?'<span class="preparation-badge" data-preparation-count></span>':''}</div>${active?start()+`<details class="saved-preparation"><summary>Materiály a príprava hry</summary>${preparation()}</details>`:finished?'<a class="download" href="/assets/printables/vsetky-materialy.pdf" download><span class="download-icon">'+icon('printer')+'</span><span><strong>Materiály a diplom PDF</strong></span><span aria-hidden="true">↓</span></a>':preparation()+start()}<section class="game-progress" aria-label="Priebeh hry"><div class="progress-heading"><h3>Postup tímu</h3><strong>${completed.size} zo 7</strong></div><ol class="task-progress" aria-label="Postup siedmimi úlohami">${taskNames.map((name,i)=>`<li class="${completed.has(i+1)?'done':active&&run.current_stage===i+1?'current':''}" ${active&&run.current_stage===i+1?'aria-current="step"':''} aria-label="Úloha ${i+1}: ${name}${completed.has(i+1)?', vyriešená':active&&run.current_stage===i+1?', práve prebieha':''}"><span aria-hidden="true"><span class="task-location-full">${name}</span><span class="task-location-short">${shortTaskNames[i]}</span></span><b aria-hidden="true">${completed.has(i+1)?'✓':'U'+(i+1)}</b></li>`).join('')}</ol><p class="current-task">${finished?'✓ Hra je ukončená.':active&&run.current_stage<=7?`Teraz: <strong>U${run.current_stage} · ${taskNames[run.current_stage-1]}</strong>`:active?'Všetky úlohy sú vyriešené. Dokončite hru na hernom telefóne.':'Hra sa začne po dokončení prípravy.'}</p></section></section>`:`<section class="supervisor-card"><span class="section-kicker">VAŠE PRÍBEHY</span><h2>Čas na spoločné čítanie.</h2><p>Zakúpené knihy nájdete vo svojej knižnici.</p><a class="btn secondary" href="/checkout">Pridať hru →</a></section>`}${finished?feedback():''}</div><section class="supervisor-card supervisor-library">${PORTAL_LIBRARY.render({compact:true})}</section></div>`;
    for(const id of opened){const button=root.querySelector(`[aria-controls="${id}"]`);if(button)expand(button,true);}
    if(savedOpen&&root.querySelector('.saved-preparation'))root.querySelector('.saved-preparation').open=true;
    PORTAL_LIBRARY.mount();updateControls();rendered=signature(data);
    if(focusId)document.getElementById(focusId)?.focus({preventScroll:true});
    if(location.hash==='#hodnotenie')document.querySelector('#game-feedback')?.scrollIntoView({block:'center'});
  }
  function signature(value){return JSON.stringify([value.customer,value.entitlement,value.run,value.canResume,value.feedback]);}
  function updateControls(){
    const placed=placements.filter(task=>localChecks[task.id]).length;
    for(const input of root.querySelectorAll('[data-preparation]')){input.checked=!!localChecks[input.dataset.preparation];input.disabled=busy;}
    const all=root.querySelector('[data-preparation="placed"]');if(all){all.indeterminate=placed>0&&placed<placements.length;}
    const readyCount=required.filter(id=>localChecks[id]).length;
    const badge=root.querySelector('[data-preparation-count]');if(badge)badge.textContent=`${readyCount} z 3 pripravené`;
    root.querySelector('.preparation-checklist')?.setAttribute('aria-busy',String(busy));
    const button=root.querySelector('#start-game'),status=root.querySelector('#start-status');if(!button)return;
    const active=data.run?.status==='active',otherDevice=active&&!data.canResume;
    button.disabled=busy||otherDevice||(!active&&readyCount!==required.length);
    const next=!localChecks.printed?'Najprv vytlačte materiály a potvrďte prvý krok.':!localChecks.placed?'Rozmiestnite úlohy a potvrďte druhý krok.':'Potvrďte, že hru spustíte na tomto telefóne.';
    status.textContent=saveError||(busy?'Ukladám…':otherDevice?'Hra už beží na inom telefóne. Pokračujte na telefóne, na ktorom ste ju spustili.':active?'Pokračujte na telefóne, na ktorom ste hru spustili.':readyCount===required.length?'Všetko je pripravené. Môžete spustiť hru.':next);
    status.classList.toggle('is-error',!!saveError);
  }
  let preparationRequest;
  async function load(){
    const epoch=identityEpoch,sequence=++loadSequence;
    try{
      const result=await api('portal');if(epoch!==identityEpoch||sequence!==loadSequence)return;
      if(result.entitlement&&!placements.length){
        const controller=new AbortController();preparationRequest?.abort();preparationRequest=controller;
        const response=await fetch('/supervisor-preparation.json',{credentials:'same-origin',cache:'no-store',signal:controller.signal});
        if(!response.ok)throw Error('Miesta pre úlohy sa nepodarilo načítať. Skúste to znova.');
        const value=await response.json();if(!Array.isArray(value)||value.length!==7||value.some((task,i)=>task.id!=='placed-'+(i+1)||typeof task.label!=='string'||typeof task.placement!=='string'))throw Error('Miesta pre úlohy sa nepodarilo načítať.');
        if(epoch!==identityEpoch||sequence!==loadSequence)return;placements=value;
      }
      if(busy)return;data=result;
      if(result.entitlement&&document.visibilityState==='visible')api('portal-visits',{entitlementId:result.entitlement.id,visitKey}).catch(()=>{});
      if(!root.querySelector('.supervisor-grid')||signature(result)!==rendered)render();else{readChecks(result.checklist);updateControls();}
    }catch(e){if(epoch!==identityEpoch||sequence!==loadSequence||e.name==='AbortError')return;if(e.status===401)login();else root.innerHTML=`<section class="supervisor-card"><h1>Portál sa nepodarilo načítať</h1><p role="alert">${esc(e.message)}</p><button class="btn" data-retry>Skúsiť znova</button></section>`;}
  }
  function expand(button,open=button.getAttribute('aria-expanded')!=='true'){button.setAttribute('aria-expanded',String(open));const content=document.getElementById(button.getAttribute('aria-controls'));content.hidden=!open;button.setAttribute('aria-label',open?'Zbaliť vysvetlenie':button.dataset.label);}
  root.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target,button=form.querySelector('button[type="submit"]');button.disabled=true;
    try{if(form.id==='customer-login'){identityEpoch++;placements=[];rendered='';saveError='';await api('login',Object.fromEntries(new FormData(form)));form.reset();await load();}
    else if(form.id==='game-feedback'){const values=new FormData(form);await api('feedback',{runId:data.run.id,stars:Number(values.get('stars')),comment:values.get('comment')});await load();}}
    catch(e){form.querySelector('[role="status"]').textContent=e.message;}finally{if(button.isConnected)button.disabled=false;}
  });
  root.addEventListener('change',async event=>{
    const id=event.target.dataset.preparation;if(!id||busy||!data)return;loadSequence++;
    const before={...localChecks},values={[id]:event.target.checked},epoch=identityEpoch;
    localChecks[id]=event.target.checked;
    if(id==='placed')for(const task of placements)localChecks[task.id]=event.target.checked;
    if(id.startsWith('placed-'))localChecks.placed=placements.every(task=>localChecks[task.id]);
    busy=true;saveError='';updateControls();
    try{const result=await api('checklist',{entitlementId:data.entitlement.id,values});if(epoch!==identityEpoch)return;localChecks=Object.fromEntries([...result.steps,...result.placements].map(step=>[step.id,step.completed]));}
    catch(e){if(epoch!==identityEpoch)return;localChecks=before;saveError='Zmenu sa nepodarilo uložiť. Skúste zaškrtnúť krok znova.';}
    finally{if(epoch===identityEpoch){busy=false;updateControls();if(document.activeElement===document.body||document.activeElement?.classList.contains('portal-skip'))event.target.focus({preventScroll:true});}}
  });
  root.addEventListener('click',async event=>{
    const disclosure=event.target.closest('[data-expand]');if(disclosure)expand(disclosure);
    if(event.target.closest('[data-retry]'))load();
    if(!event.target.closest('#start-game')||busy||event.target.closest('#start-game').disabled)return;
    if(data.run?.status==='active'&&data.canResume){location.assign('/hra');return;}
    busy=true;saveError='';updateControls();try{await api('activate',{entitlementId:data.entitlement.id,activationKey:crypto.randomUUID()});location.assign('/hra');}catch(e){saveError=e.message;busy=false;updateControls();}
  });
  logout.addEventListener('click',async()=>{if(busy)return;logout.disabled=true;try{await api('logout',{});identityEpoch++;loadSequence++;preparationRequest?.abort();saveError='';login();}catch{logout.textContent='Skúsiť odhlásiť znova';}finally{logout.disabled=false;}});
  setInterval(()=>{if(data&&!busy&&document.visibilityState==='visible'&&!root.querySelector('#game-feedback :focus'))load();},20000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&data&&!busy)load();});
  load();
})();
