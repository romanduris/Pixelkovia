const $=s=>document.querySelector(s);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=value=>value==null?'—':new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(value);
const number=value=>value==null?'—':new Intl.NumberFormat('sk-SK',{maximumFractionDigits:1}).format(value);
const money=(cents,currency='EUR')=>new Intl.NumberFormat('sk-SK',{style:'currency',currency}).format(cents/100);
const time=ms=>ms==null?'—':ms>=3600000?number(ms/3600000)+' h':ms>=60000?number(ms/60000)+' min':number(ms/1000)+' s';
const stateNames={purchased:'Zakúpené, neaktivované',preparing:'Pripravuje hru',playing:'Rozhrané',completed:'Dokončené',expired:'Prístup vypršal',active:'Aktívna relácia',valid:'Platné',revoked:'Odňaté',pending:'Čaká na platbu','payment-pending':'Čaká na platbu',paid:'Zaplatené',refunded:'Vrátené',cancelled:'Zrušené',draft:'Koncept',blocked:'Blokované',queued:'Čaká na odoslanie',sent:'Odoslané',failed:'Chyba'};
const badge=status=>`<span class="status ${escape(status)}">${escape(stateNames[status]||status)}</span>`;
const titles={payments:['Platby a chyby','Overené úhrady, zlyhania formulára a doručenie prístupov.'],dashboard:['Overview','Zákazníci, tržby a priebeh hry na jednom mieste.'],orders:['Objednávky','Nákupy, produkty a platby zákazníkov Pixelkovia.'],analytics:['Herná analýza','Od prvého nákupu po poslednú stopu. Celý príbeh každého zákazníka.']};
const state={page:1,q:'',status:'',sort:'purchase',direction:'desc',version:'',portal:'',context:null,expanded:new Set(),details:new Map(),wide:false,paymentDays:'1',paymentCategory:'',paymentStatus:'',paymentPage:1};
let loadingId=0,detailId=0,debounce;
async function api(path,params){const response=await fetch(path+(params?.toString()?'?'+params:''),{credentials:'same-origin'});const value=await response.json();if(response.status===401&&state.context?.authMode==='password'){document.querySelector('#view').replaceChildren();location.replace('/admin/login');throw Error('Prihlásenie vypršalo.');}if(!response.ok)throw Error(value.error||'Načítanie zlyhalo.');return value;}
function midnight(day){const utc=Date.parse(day+'T00:00:00Z');const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(utc).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));const represented=Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));return new Date(utc-(represented-utc)).toISOString();}
function params(){const values=new URLSearchParams();if($('#from').value)values.set('from',midnight($('#from').value));if($('#to').value){const end=new Date($('#to').value+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);values.set('to',midnight(end.toISOString().slice(0,10)));}if($('#product').value)values.set('product',$('#product').value);return values;}

const empty=message=>`<div class="empty">${escape(message)}</div>`;
function table(headers,rows,cls=''){return rows.length?`<div class="table-wrap"><table class="${cls}"><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(cells=>`<tr>${cells.map((cell,index)=>`<td data-label="${escape(headers[index])}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty('Pre zvolené filtre zatiaľ nie sú žiadne záznamy.');}
function chart(title,points,color=''){
  const max=Math.max(1,...points.map(p=>p.count));
  return `<article class="panel"><h2>${title}</h2><p class="caption">Vývoj v kohorte podľa dátumu nákupu · UTC dni</p>${points.length?`<div class="chart ${color}" role="img" aria-label="${escape(title+': '+points.map(p=>p.date+' '+p.count).join(', '))}">${points.map(p=>`<div class="bar-column"><span>${p.count}</span><div class="bar" data-height="${p.count/max*100}"></div><small>${escape(p.date.slice(5))}</small></div>`).join('')}</div><details><summary>Tabuľka dát</summary>${table(['Dátum UTC','Počet'],points.map(p=>[escape(p.date),p.count]))}</details>`:'<div class="chart-empty">Zatiaľ žiadne udalosti</div>'}</article>`;
}
function dashboard(data){
  const m=data.metrics,revenues=Object.entries(m.revenueByCurrency).map(([currency,cents])=>money(cents,currency)).join(' / ')||money(0);
  const metrics=[['Zákazníci',m.customers,'Unikátne zákaznícke ID'],['Zaplatené objednávky',m.paidOrders,'Unikátne objednávky'],['Tržby',revenues,'Zaplatené položky v kohorte'],['Zakúpené hry',m.purchasedGames,'Zakúpené oprávnenia'],['Neaktivované hry',m.unactivated,'Oprávnenia bez spustenia'],['Aktivované hry',m.activated,'Oprávnenia s aktiváciou'],['Rozhrané hry',m.playing,'Aktívne herné relácie'],['Dokončené hrania',m.completed,'Vrátane samostatných opakovaní'],['Priemerné dokončenie',time(m.meanCompletionMs),'Uplynutý čas dokončených relácií'],['Medián dokončenia',time(m.medianCompletionMs),'Uplynutý čas dokončených relácií']];
  return `<div class="metrics">${metrics.map(([label,value,note])=>`<article class="metric"><span class="label">${label}</span><strong>${typeof value==='number'?number(value):escape(value)}</strong><small>${note}</small></article>`).join('')}</div><div class="chart-grid">${chart('Nákupy v čase',data.charts.purchases)}${chart('Aktivácie v čase',data.charts.activations,'chart-mint')}${chart('Dokončenia v čase',data.charts.completions,'chart-amber')}</div><article class="panel"><h2>Sedem úloh. Jedna spoločná cesta.</h2><p class="caption">Priechod počítame po herných reláciách; každé opakovanie má vlastný priebeh.</p><div class="funnel">${data.funnel.map(s=>`<div class="funnel-cell"><strong>ÚLOHA ${s.stage.toString().padStart(2,'0')}</strong><span>${s.solved}</span><small>z ${s.started} začatých</small><div class="progress-track"><i data-width="${s.started?s.solved/s.started*100:0}"></i></div><p>${escape(s.title)}</p></div>`).join('')}</div></article><p class="definition">${escape(data.cohort)}</p>`;
}
const paymentMethodNames={card:'Karta',apple_pay:'Apple Pay',google_pay:'Google Pay',wallet:'Iná peňaženka',free:'Zdarma',unknown:'Neznáme'};
function paymentMethodMark(method){
  const file={card:'card',apple_pay:'apple-pay',google_pay:'google-pay'}[method],name=escape(paymentMethodNames[method]||paymentMethodNames.unknown);
  return file?`<span class="payment-method-mark" title="${name}"><img src="/admin/payment-methods/${file}.svg" alt="${name}" width="52" height="34"></span>`:name;
}
const paymentProductNames={'episode-1':'Hra Pixelkovia','story-book-before':'Ako vznikli Pixelkovia','story-book-after':'Po veľkom záblesku','atlas-pixelkov':'Atlas Pixelkov'};
function paymentHealth(d,compact=false){
  const attention=d.health==='attention',stale=d.health==='stale';
  const title=attention?'Platby vyžadujú pozornosť':stale?'Kontrola platieb nie je aktuálna':'Monitorovanie platieb je aktívne';
  const notes=[];
  if(!d.enabled)notes.push('Platby sú vypnuté alebo chýba konfigurácia.');
  if(d.errors24)notes.push(`Technické signály za posledných 24 hodín: ${d.errors24}. Otvorte záznamy a skontrolujte príčinu.`);
  if(d.declines24)notes.push(`Platby s neúspešným pokusom potvrdeným Stripe za posledných 24 hodín: ${d.declines24}. Niektoré mohli pri ďalšom pokuse prejsť; nemusí ísť o chybu stránky.`);
  if(d.deliveries.failed||d.deliveries.delayed)notes.push(`Prístupové e-maily: chyby odoslania ${d.deliveries.failed}; čakajúce dlhšie než 10 minút ${d.deliveries.delayed}.`);
  if(d.fulfillmentDelayed)notes.push(`${d.fulfillmentDelayed} potvrdených platieb čaká na vytvorenie prístupu dlhšie než 2 minúty.`);
  if(d.checks.some(c=>!c.ok))notes.push('Serverová kontrola Stripe alebo nastavenia webhooku zlyhala.');
  if(stale)notes.push('Posledná serverová kontrola chýba alebo je staršia než 30 minút. Stav nemožno považovať za aktuálne overený.');
  if(!notes.length)notes.push('Kontroly nehlásia technický problém. Priebeh jednotlivých nákupov nájdete v záznamoch.');
  return `<section class="payment-health ${attention?'attention':stale?'stale':'observing'}" aria-label="Stav platieb"><div><span class="eyebrow">PLATBY · POSLEDNÝCH 24 HODÍN</span><h2>${title}</h2>${notes.map(n=>`<p>${escape(n)}</p>`).join('')}<p class="payment-last">Posledná dokončená peňažná platba: <strong>${d.lastSuccessAt?date(d.lastSuccessAt):'Zatiaľ žiadna zaznamenaná úhrada'}</strong></p><small>Načítané ${date(d.generatedAt)} · Obnova každých 30 sekúnd počas otvorenia administrácie.</small></div>${compact?'<a class="button" href="#payments">Otvoriť platby a chyby →</a>':''}</section>`;
}
const attemptStateNames={started:'Začatá',abandoned:'Opustená',cancelled:'Zrušená zákazníkom',error:'Chyba platby',successful:'Úspešná',declined:'Odmietnutá bankou',unknown:'Neznáme'};
const paymentColumns={date:'Dátum a čas',email:'E-mail zákazníka',products:'Produkty',amount:'Cena',status:'Stav platby',method:'Spôsob úhrady',voucher:'Voucher',subtotal:'Suma pred zľavami',bundleDiscount:'Zľava na balík',voucherDiscount:'Zľava voucherom',orderStatus:'Stav objednávky',orderCount:'Počet objednávok',delivery:'Prístupové e-maily',fulfilledAt:'Vytvorenie objednávky',sentAt:'Posledný odoslaný e-mail',providerState:'Overený stav Stripe',checkedAt:'Posledné overenie',confirmedAt:'Potvrdenie webhookom',reason:'Dôvod zlyhania alebo zrušenia',reference:'ID pokusu / Stripe relácia'};
const defaultPaymentColumns=['date','email','products','amount','status','method'];
const paymentLayoutKey='pixelkovia-admin-payments-layout-v1';
function defaultPaymentLayout(){return {order:Object.keys(paymentColumns),hidden:Object.keys(paymentColumns).filter(id=>!defaultPaymentColumns.includes(id)),density:'compact',navCollapsed:true};}
function readPaymentLayout(){
  const defaults=defaultPaymentLayout();
  try{
    const saved=JSON.parse(localStorage.getItem(paymentLayoutKey));
    if(!saved||typeof saved!=='object')return defaults;
    const order=Array.isArray(saved.order)?[...new Set(saved.order.filter(id=>typeof id==='string'&&Object.hasOwn(paymentColumns,id)))]:[];
    defaults.order=[...order,...defaults.order.filter(id=>!order.includes(id))];
    if(Array.isArray(saved.hidden))defaults.hidden=[...new Set([...saved.hidden.filter(id=>typeof id==='string'&&Object.hasOwn(paymentColumns,id)),...defaults.hidden.filter(id=>!order.includes(id))])];
    if(defaults.hidden.length===defaults.order.length)defaults.hidden=[];
    if(saved.density==='comfortable')defaults.density='comfortable';
    if(typeof saved.navCollapsed==='boolean')defaults.navCollapsed=saved.navCollapsed;
  }catch{}
  return defaults;
}
let paymentLayout=readPaymentLayout(),paymentData=null,paymentDragColumn=null;
const paymentUI={panels:new Set(),expanded:new Set(),columnQuery:''};
function savePaymentLayout(){
  // Presentation preferences only. Never persist emails, rows or event contents.
  try{localStorage.setItem(paymentLayoutKey,JSON.stringify(paymentLayout));}catch{}
}
function syncPaymentShell(){
  const active=currentView()==='payments';
  document.body.classList.toggle('payments-view',active);
  document.body.classList.toggle('payments-nav-collapsed',active&&paymentLayout.navCollapsed);
  const toggle=$('#payment-nav-toggle');toggle.hidden=!active;
  toggle.setAttribute('aria-expanded',String(!paymentLayout.navCollapsed));
  toggle.textContent=paymentLayout.navCollapsed?'☰ Rozbaliť navigáciu':'☰ Zbaliť navigáciu';
  document.querySelectorAll('[data-page]').forEach(a=>{a.setAttribute('aria-label',titles[a.dataset.page][0]);a.title=titles[a.dataset.page][0];});
}
function capturePaymentUI(){
  const wrap=$('#payment-table-scroll'),strip=$('.payment-status-strip'),focused=document.activeElement;
  const snapshot={left:wrap?.scrollLeft||0,top:wrap?.scrollTop||0,strip:strip?.scrollLeft||0,menu:$('.payment-column-menu')?.scrollTop||0,focus:focused?.id,focusAttempt:focused?.dataset?.paymentExpand,selection:focused?.id==='payment-column-search'?focused.selectionStart:null};
  $('#view').querySelectorAll('details[data-payment-panel]').forEach(el=>{
    if(el.open)paymentUI.panels.add(el.dataset.paymentPanel);else paymentUI.panels.delete(el.dataset.paymentPanel);
  });
  return snapshot;
}
function restorePaymentUI(snapshot){
  const wrap=$('#payment-table-scroll'),strip=$('.payment-status-strip');
  if(wrap){wrap.scrollLeft=snapshot.left;wrap.scrollTop=snapshot.top;}
  if(strip)strip.scrollLeft=snapshot.strip;
  const menu=$('.payment-column-menu');if(menu)menu.scrollTop=snapshot.menu;
  const focused=snapshot.focusAttempt?[...document.querySelectorAll('[data-payment-expand]')].find(el=>el.dataset.paymentExpand===snapshot.focusAttempt)||wrap:snapshot.focus&&document.getElementById(snapshot.focus);
  if(focused&&$('#view').contains(focused)){focused.focus({preventScroll:true});if(focused.id==='payment-column-search'&&snapshot.selection!=null)focused.setSelectionRange(snapshot.selection,snapshot.selection);}
}
function renderPaymentWorkspace(){
  if(!paymentData||currentView()!=='payments')return;
  const snapshot=capturePaymentUI();
  $('#view').innerHTML=payments(paymentData);restorePaymentUI(snapshot);
}
const paymentPanelOpen=id=>paymentUI.panels.has(id)?' open':'';
function paymentStatus(row){
  const status=Object.hasOwn(attemptStateNames,row.status)?row.status:'unknown';
  const note=row.state==='refunded'?'Vrátená':row.state==='pending'?'Overuje sa':['paid','free'].includes(row.state)&&status!=='successful'?'Čaká na webhook':'';
  const label=status==='successful'&&row.voucherCode==='free'&&row.totalCents===0?'Dokončená zdarma':attemptStateNames[status];
  return `<span class="status attempt-${status}" title="${escape(row.reason||'Neznáme')}">${escape(label)}</span>${note?`<small>${note}</small>`:''}`;
}
function paymentProducts(row){return [...row.products.map(id=>paymentProductNames[id]||'Neznáme'),...(row.giftGame?['Druhá hra pre ďalšiu rodinu']:[])].join(' · ')||'Neznáme';}
function paymentCell(row,id){
  switch(id){
    case 'date':return row.createdAt==null?'Neznáme':date(row.createdAt);
    case 'email':return escape(row.email||'Neznáme');
    case 'products':return `<span class="payment-products" title="${escape(paymentProducts(row))}">${escape(paymentProducts(row))}</span>`;
    case 'amount':return row.totalCents==null?'Neznáme':money(row.totalCents);
    case 'status':return paymentStatus(row);
    case 'method':return paymentMethodMark(row.method);
    case 'voucher':return row.voucherCode===undefined?'Neznáme':row.voucherCode?`<code class="payment-voucher">${escape(row.voucherCode)}</code>`:'Nepoužitý';
    case 'subtotal':return row.subtotalCents==null?'Neznáme':money(row.subtotalCents);
    case 'bundleDiscount':return row.bundleDiscountCents==null?'Neznáme':money(row.bundleDiscountCents);
    case 'voucherDiscount':return row.voucherDiscountCents==null?'Neznáme':money(row.voucherDiscountCents);
    case 'orderStatus':return !Array.isArray(row.orderStates)?'Neznáme':row.orderStates.length?escape(row.orderStates.map(id=>({paid:'Potvrdená',refunded:'Vrátená',cancelled:'Zrušená',pending:'Čaká na potvrdenie'})[id]||'Neznáme').join(' / ')):'Zatiaľ nevytvorená';
    case 'orderCount':return Number.isInteger(row.orderCount)&&Number.isInteger(row.expectedOrderCount)?`${row.orderCount} / ${row.expectedOrderCount}`:'Neznáme';
    case 'delivery':return paymentDelivery(row);
    case 'fulfilledAt':return row.fulfilledAt==null?'Neznáme':date(row.fulfilledAt);
    case 'sentAt':return row.delivery?.lastSentAt==null?'Neznáme':date(row.delivery.lastSentAt);
    case 'providerState':return escape(({paid:'Úhrada potvrdená',free:'Dokončená zdarma',ready:'Formulár otvorený',pending:'Overuje sa',expired:'Relácia vypršala',failed:'Neúspešný pokus',refunded:'Platba vrátená'})[row.providerState]||'Neznáme');
    case 'checkedAt':return row.checkedAt==null?'Neznáme':date(row.checkedAt);
    case 'confirmedAt':return row.webhookConfirmedAt==null?'Zatiaľ nepotvrdené':date(row.webhookConfirmedAt);
    case 'reason':return `<span class="payment-reason">${escape(row.reason||'Neznáme')}</span>`;
    case 'reference':return `<code class="payment-reference">${escape(row.id||'Neznáme')}</code><small>${escape(row.sessionId||'Neznáme')}</small>`;
  }
}
function paymentDelivery(row){
  const delivery=row.delivery;
  if(!delivery)return 'Neznáme';
  if(row.orderCount===0)return 'Čaká na objednávku';
  if(delivery.total!==row.orderCount)return 'Neznáme';
  const label=delivery.failed?`Chyba odoslania · ${delivery.failed} / ${delivery.total}`:delivery.sent===delivery.total?`Odovzdané · ${delivery.sent} / ${delivery.total}`:`Vo fronte · ${delivery.queued} / ${delivery.total}`;
  return `<span class="${delivery.failed?'payment-delivery-error':'payment-delivery-state'}" title="Stav odovzdania e-mailov poskytovateľovi; nepotvrdzuje prijatie v schránke.">${escape(label)}</span>`;
}
function paymentColumnMatches(id){const normalize=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();return normalize(paymentColumns[id]).includes(normalize(paymentUI.columnQuery.trim()));}
function paymentLogTable(logs){
  const source={stripe:'Stripe · overené',server:'Server',browser:'Prehliadač · hlásenie'};
  return table(['Čas','Udalosť','Zdroj','Doplnenie','Platobná relácia'],logs.map(l=>[
    date(l.created_at),`<strong class="payment-category-${escape(l.category)}">${escape(l.label)}</strong>`,escape(source[l.source]||'Neznáme'),
    escape([l.code,l.method!=='unknown'?paymentMethodNames[l.method]:''].filter(Boolean).join(' · ')||'Neznáme'),
    `<code class="payment-reference">${escape(l.stripe_session_id||l.attempt_id||'Neznáme')}</code>`
  ]));
}
function paymentAttemptDetail(row,d){
  const items=[...Object.entries(paymentColumns).map(([id,label])=>[label,paymentCell(row,id)]),['Posledné serverové overenie',row.checkedAt==null?'Neznáme':date(row.checkedAt)]];
  const logs=d.logs.filter(l=>l.attempt_id===row.id);
  return `<div class="payment-attempt-detail"><dl>${items.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl><div class="payment-detail-events"><h3>Dostupné udalosti tohto pokusu</h3>${logs.length?paymentLogTable(logs):'<p>V dostupnom denníku pre toto obdobie nie sú ďalšie udalosti.</p>'}</div></div>`;
}
function paymentColumnSettings(){
  const visible=paymentLayout.order.filter(id=>!paymentLayout.hidden.includes(id));
  return `<details class="payment-column-options" data-payment-panel="columns"${paymentPanelOpen('columns')}><summary id="payment-column-toggle">Stĺpce <span aria-hidden="true">▾</span></summary><div class="payment-column-menu"><div class="payment-menu-heading"><strong>Zobrazenie tabuľky</strong><button type="button" id="close-payment-columns" aria-label="Zavrieť nastavenia stĺpcov">×</button></div><p>Vyberte stĺpce a upravte ich poradie.</p><label class="sr-only" for="payment-column-search">Hľadať stĺpec</label><input id="payment-column-search" type="search" placeholder="Hľadať stĺpec…" autocomplete="off" value="${escape(paymentUI.columnQuery)}"><ul>${paymentLayout.order.map((id,index)=>`<li data-payment-column-option="${id}" ${paymentColumnMatches(id)?'':'hidden'}><label><input id="payment-column-${id}" type="checkbox" data-payment-column="${id}" ${visible.includes(id)?'checked':''} ${visible.length===1&&visible.includes(id)?'disabled':''}>${paymentColumns[id]}</label><span><button id="payment-column-up-${id}" type="button" data-payment-move="${id}" data-step="-1" aria-label="Presunúť ${paymentColumns[id]} doľava" ${index===0?'disabled':''}>↑</button><button id="payment-column-down-${id}" type="button" data-payment-move="${id}" data-step="1" aria-label="Presunúť ${paymentColumns[id]} doprava" ${index===paymentLayout.order.length-1?'disabled':''}>↓</button></span></li>`).join('')}</ul><label class="payment-density-label">Hustota riadkov<select id="payment-density">${options([['compact','Kompaktná'],['comfortable','Vzdušná']],paymentLayout.density)}</select></label><div class="payment-menu-footer"><span>Uložené v tomto prehliadači</span><button type="button" class="link-button" id="reset-payment-layout">Obnoviť predvolené</button></div></div></details>`;
}
function paymentMonitorDisclosure(d){
  const attention=d.health==='attention',stale=d.health==='stale';
  const issues=[];
  if(!d.enabled)issues.push('príjem platieb je vypnutý');
  if(d.errors24)issues.push(`technické signály: ${d.errors24}`);
  if(d.fulfillmentDelayed)issues.push(`prístupy čakajú: ${d.fulfillmentDelayed}`);
  if(d.deliveries.failed||d.deliveries.delayed)issues.push(`problémy s e-mailom: ${d.deliveries.failed+d.deliveries.delayed}`);
  if(d.declines24)issues.push(`odmietnutia bankou: ${d.declines24}`);
  if(d.checks.some(c=>!c.ok))issues.push('serverová kontrola zlyhala');
  const label=attention?'Vyžaduje pozornosť':stale?'Kontrola nie je aktuálna':'Monitoring je aktívny';
  const checks=[['Príjem platieb',d.enabled?'Zapnutý':'Vypnutý',null],...['stripe','webhook'].map(id=>{
    const c=d.checks.find(c=>c.id===id);
    return [id==='stripe'?'Spojenie so Stripe':'Stripe webhook',!c?'Zatiaľ neoverené':!c.ok?'Kontrola zlyhala':d.generatedAt-c.checked_at>1800000?'Neaktuálna kontrola':'Kontrola prešla',c?.checked_at];
  })];
  return `<details class="payment-monitor ${attention?'attention':stale?'stale':'observing'}" data-payment-panel="monitor"${paymentPanelOpen('monitor')}><summary id="payment-monitor-toggle"><span class="payment-monitor-icon" aria-hidden="true">${attention?'!':stale?'◷':'✓'}</span><span class="payment-monitor-label">${label}</span><span class="payment-monitor-brief">${escape(issues.join(' · ')||'Stripe a doručenie prístupov')}</span><span class="payment-monitor-more">Podrobnosti <span aria-hidden="true">⌄</span></span></summary><div class="payment-monitor-body">${paymentHealth(d)}<div class="payment-checks">${checks.map(([label,status,at])=>`<div><strong>${label}</strong><span>${status}</span>${at?`<small>${date(at)}</small>`:''}</div>`).join('')}</div><p>Úspech vyžaduje podpísaný webhook a serverové overenie. Zatvorenie peňaženky nepotvrdzuje zrušenie. Relácia štandardne trvá 30 minút; opustenie overuje server. Potvrdená technická chyba má prednosť pred opustením. Darčekové dve objednávky tvoria jeden pokus. Kontroly prebiehajú každých 10 minút; otvorený prehľad sa obnovuje každých 30 sekúnd. Neznáme údaje sa neodhadujú.</p></div></details>`;
}
function payments(d){
  const visible=paymentLayout.order.filter(id=>!paymentLayout.hidden.includes(id));
  const states=[['','Všetky',d.total],...Object.entries(attemptStateNames).filter(([id])=>id!=='unknown'||d.attemptCounts.unknown>0||state.paymentStatus==='unknown').map(([id,label])=>[id,label,d.attemptCounts[id]])];
  const rows=d.rows.map((row,index)=>{
    const expanded=paymentUI.expanded.has(row.id),detailId='payment-attempt-detail-'+index;
    return `<tr class="payment-attempt-row ${expanded?'is-expanded':''}" data-attempt="${escape(row.id)}">${visible.map(id=>`<td data-column="${id}" data-label="${paymentColumns[id]}">${paymentCell(row,id)}</td>`).join('')}<td class="payment-expand-cell"><button type="button" id="payment-attempt-toggle-${index}" class="payment-row-toggle" data-payment-expand="${escape(row.id)}" aria-label="Detail pokusu ${escape(row.email||row.id)}" aria-expanded="${expanded}" aria-controls="${detailId}"><span aria-hidden="true">${expanded?'−':'+'}</span></button></td></tr><tr class="payment-attempt-detail-row" id="${detailId}" ${expanded?'':'hidden'}><td colspan="${visible.length+1}">${expanded?paymentAttemptDetail(row,d):''}</td></tr>`;
  }).join('');
  const filtered=attemptStateNames[state.paymentStatus]||'Všetky stavy';
  return `<nav class="payment-status-strip" aria-label="Filtrovať platby podľa stavu">${states.map(([id,label,count])=>`<button type="button" id="payment-state-${id||'all'}" class="payment-state-chip ${id?'state-'+id:''}" data-payment-state="${id}" aria-pressed="${state.paymentStatus===id}" aria-label="${label}: ${count}"><i aria-hidden="true"></i><span>${label}</span><strong>${count}</strong></button>`).join('')}</nav>
    ${paymentMonitorDisclosure(d)}
    <section class="payment-attempts payment-workspace density-${paymentLayout.density}" aria-label="Platobné pokusy"><div class="payment-workspace-toolbar"><div class="payment-table-heading"><h2>Pokusy <span class="count-pill">${d.matchingTotal}</span></h2><span>${escape(filtered)}</span></div><div class="payment-table-tools"><label class="sr-only" for="payment-days">Obdobie pokusov</label><select id="payment-days">${options([['1','Posledných 24 hodín'],['7','Posledných 7 dní'],['30','Posledných 30 dní'],['all','Celé obdobie']],state.paymentDays)}</select>${paymentColumnSettings()}<button id="refresh-payments" type="button" class="button secondary" aria-label="Obnoviť platby"><span aria-hidden="true">↻</span> Obnoviť</button></div></div>
    ${d.rows.length?`<div class="table-wrap" id="payment-table-scroll" tabindex="0" role="region" aria-label="Tabuľka pokusov; pri väčšom počte stĺpcov posúvajte vodorovne"><table class="payment-table"><thead><tr>${visible.map(id=>`<th scope="col" data-column="${id}"><span class="payment-column-drag" draggable="true" data-payment-drag="${id}" title="Potiahnutím zmeníte poradie stĺpcov; poradie môžete meniť aj v nastaveniach Stĺpce">${paymentColumns[id]}</span></th>`).join('')}<th scope="col" class="payment-expand-cell"><span class="sr-only">Detail pokusu</span></th></tr></thead><tbody>${rows}</tbody></table></div>`:empty('Pre zvolené filtre zatiaľ nie sú žiadne pokusy.')}
    <div class="payment-workspace-footer"><span>${d.matchingTotal} z ${d.total} pokusov · Bratislava</span><div class="payment-pager"><button type="button" class="button secondary" data-payment-page="-1" ${d.page<=1?'disabled':''} aria-label="Predchádzajúca strana">←</button><span>Strana ${d.page} / ${d.pages}</span><button type="button" class="button secondary" data-payment-page="1" ${d.page>=d.pages?'disabled':''} aria-label="Ďalšia strana">→</button></div></div></section>
    <details class="payment-log-disclosure" data-payment-panel="log"${paymentPanelOpen('log')}><summary id="payment-log-toggle"><span>Denník udalostí</span><small>${d.logs.length} záznamov${d.errors24?' · technické signály za 24 h: '+d.errors24:''}</small><span aria-hidden="true">⌄</span></summary><div class="payment-log-body"><div class="payment-log-heading"><p>Posledných 200 dostupných udalostí vo zvolenom období. Diagnostika sa uchováva 90 dní; hlásenie prehliadača ani časový limit nepotvrdzujú zlyhanie platby.</p><label>Udalosti<select id="payment-category">${options([['','Všetky udalosti'],['technical','Technické signály'],['bank','Odmietnutia bankou'],['validation','Oprava údajov'],['customer','Kroky zákazníka'],['lifecycle','Priebeh platby']],state.paymentCategory)}</select></label></div>${paymentLogTable(d.logs)}</div></details>`;
}
function paymentParams(){return new URLSearchParams({days:state.paymentDays,category:state.paymentCategory,status:state.paymentStatus,page:state.paymentPage});}
async function refreshPaymentHealth(){
  if(!state.context||document.hidden||$('#view').getAttribute('aria-busy')==='true')return;
  const view=currentView();if(view==='payments'){void load();return;}if(view!=='dashboard')return;
  const id=loadingId;
  try{const d=await api('/api/admin/payments');if(id===loadingId&&currentView()==='dashboard')$('#payment-overview').innerHTML=paymentHealth(d,true);}
  catch{if(id===loadingId&&$('#payment-overview'))$('#payment-overview').innerHTML='<section class="payment-health attention" role="alert"><h2>Stav platieb sa nepodarilo načítať</h2><p>Aktuálny stav nie je overený. Skúste obnoviť administráciu.</p><a href="#payments" class="button">Otvoriť platby a chyby →</a></section>';}
}
function orders(rows){return table(['Objednávka','Zákazník','Produkty','Nákup','Suma','Platba'],rows.map(o=>[`<strong>${escape(o.id)}</strong>`,`<button class="link-button" data-customer="${escape(o.customer_id)}">${escape(o.customer_name)}</button><small>${escape(o.email)}</small>`,escape(o.products),date(o.created_at),`<strong class="order-total">${money(o.total_cents,o.currency)}</strong>`,badge(o.status)]))+`<p class="definition">Najnovších 200 objednávok vo vybranej kohorte. Platby sa overujú na serveri; každý nákup má samostatný prístup.</p>`;}
const checklistNames={printed:'Materiály stiahnuté a vytlačené',placed:'Materiály rozmiestnené po byte','device-understood':'Hra sa bude hrať na tomto telefóne'};
const eventNames={opened:'Otvorenie úlohy',heartbeat:'Aktivita v hre',hint:'Použitá nápoveda','wrong-answer':'Nesprávny pokus',solved:'Úloha vyriešená',completed:'Hra dokončená'};
const extensionNames={'story-book-before':'Ako vznikli Pixelkovia','story-book-after':'Po veľkom záblesku'};
const options=(list,value)=>list.map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${label}</option>`).join('');
function searchTools(){return `<div class="journey-filters search-tools"><label>Hľadať zákazníka<input id="customer-search" type="search" value="${escape(state.q)}" placeholder="Meno alebo e-mail"></label><label>Stav zákazníka<select id="customer-state">${options([['','Všetky stavy'],['active','Aktívni · nedokončené'],['purchased','Zakúpené · bez prípravy'],['preparing','Pripravuje hru'],['playing','Práve hrá'],['completed','Dokončené'],['expired','Prístup vypršal'],['payment-pending','Čaká na platbu']],state.status)}</select></label><label>Verzia hry<select id="customer-version">${options([['','Všetky verzie'],['base','Iba základná hra'],['extensions','S knihami'],['full','Obe knihy']],state.version)}</select></label><label>Customer page<select id="customer-portal">${options([['','Všetci zákazníci'],['opened','Už otvoril'],['unopened','Ešte neotvoril']],state.portal)}</select></label><label>Zoradenie<select id="customer-sort">${options([['purchase','Najnovší nákup'],['activity','Posledná aktivita'],['customer','Meno zákazníka'],['stage','Aktuálna úloha']],state.sort)}</select></label></div>`;}
function stars(c){const labels=[...(c.has_base?['Základná hra']:[]),...c.extension_ids.map(id=>extensionNames[id])];return `<span class="purchase-stars" role="img" aria-label="${escape(labels.join(', ')||'Bez zaplateného produktu')}" title="${escape(labels.join(' · '))}">${labels.map((label,i)=>`<span class="${i?'extension-star':'base-star'}" aria-hidden="true">★</span>`).join('')}</span>`;}
function journeySteps(c){return [
  {label:'Kúpil',kind:'purchase',done:c.has_base,at:c.purchase_at},
  {label:'Customer page',kind:'onboarding',done:c.portal_opened_at!=null,at:c.portal_opened_at},
  {label:'Spustil hru',kind:'onboarding',done:c.started_at!=null,at:c.started_at},
  ...c.stages.map(s=>({label:s.title,kind:'game',done:s.completed_at!=null,current:s.first_opened_at!=null&&s.completed_at==null,at:s.completed_at??s.first_opened_at})),
  {label:'Dokončil',kind:'finish',done:c.completed_at!=null,at:c.completed_at}
];}
function dot(s){const label=s.label+' · '+(s.done?'Hotovo':s.current?'Práve rieši':'Čaká')+(s.at!=null?' · '+date(s.at):'');return `<span class="journey-dot ${s.kind} ${s.done?'done':s.current?'current':'waiting'}" role="img" aria-label="${escape(label)}" title="${escape(label)}">${s.done?'✓':s.current?'•':''}</span>`;}
function analytics(data){
  const headers=['Kúpil','Customer page','Spustil hru',...data.stages.map(s=>s.title),'Dokončil'];
  let previousGroup='';
  const rows=data.rows.map((c,i)=>{
    const group=c.state==='completed'?'Dokončené':c.state==='expired'||c.state==='payment-pending'?'Ostatní zákazníci':'Aktívni zákazníci';
    const separator=group!==previousGroup?`<tr class="journey-group"><th colspan="14" scope="colgroup">${group}<span>${group==='Dokončené'?'Úspešne uzavreté dobrodružstvá':group==='Aktívni zákazníci'?'Majú pred sebou ďalší krok':''}</span></th></tr>`:'';previousGroup=group;
    const detailId='journey-detail-'+i,expanded=state.expanded.has(c.customer_id),cached=state.details.get(c.customer_id);
    return separator+`<tr class="journey-row ${expanded?'expanded':''}" data-row="${escape(c.customer_id)}"><td class="customer-cell"><button class="journey-toggle" data-journey="${escape(c.customer_id)}" aria-expanded="${expanded}" aria-controls="${detailId}"><span class="customer-avatar" aria-hidden="true">${escape(c.name.replace(/^FAKE · /,'').split(' ').map(v=>v[0]).slice(0,2).join(''))}</span><span class="customer-copy"><span class="customer-name">${escape(c.name)} ${stars(c)}</span><span class="customer-email">${escape(c.email)}</span></span></button></td>${journeySteps(c).map(step=>`<td class="step-cell">${dot(step)}</td>`).join('')}<td class="customer-status">${badge(c.state)}</td><td class="expand-cell" aria-hidden="true">${expanded?'−':'+'}</td></tr><tr class="journey-detail-row" id="${detailId}" ${expanded?'':'hidden'}><td colspan="14"><div class="inline-detail">${cached?detail(cached):'<p role="status">Načítavam detail zákazníka…</p>'}</div></td></tr>`;
  }).join('');
  return searchTools()+`<div class="journey-board ${state.wide?'is-wide':''}"><div class="journey-toolbar"><div><h2>Cesta zákazníkov <span class="count-pill">${data.total}</span></h2><p>Aktívni hore, dokončení dole. Kliknutím na zákazníka otvoríte detail.</p></div><button id="expand-analysis" class="button secondary" type="button" aria-pressed="${state.wide}">${state.wide?'↙ Zmenšiť':'⛶ Rozšíriť na celú šírku'}</button></div><div class="journey-legend"><span><i class="legend-dot amber"></i>Nákup a príprava</span><span><i class="legend-dot mint"></i>7 herných úloh</span><span><i class="legend-dot purple"></i>Dokončenie</span><span><i class="legend-dot outlined"></i>Čaká</span><span class="stars-legend">★ základná hra <b>★</b> každé rozšírenie</span></div>${data.rows.length?`<div class="journey-table-wrap"><table class="journey-table"><thead><tr><th scope="col">Zákazník</th>${headers.map((label,i)=>`<th scope="col" class="step-heading ${i<3?'onboarding':i===headers.length-1?'finish':'game'}"><span class="step-label">${escape(label)}</span><span class="step-number" title="${escape(label)}">${i<3?['Kúpa','Portál','Štart'][i]:i===headers.length-1?'Cieľ':i-2}</span></th>`).join('')}<th scope="col" class="status-heading">Stav</th><th scope="col"><span class="sr-only">Detail</span></th></tr></thead><tbody>${rows}</tbody></table></div>`:empty('Pre zvolené filtre nie sú žiadni zákazníci.')}<div class="table-meta"><span>${data.total} zákazníkov · ★ vychádzajú zo zaplatených produktov</span><div class="pager"><button class="button secondary" data-pagination="-1" ${data.page===1?'disabled':''}>← Predchádzajúca</button><span>${data.page} / ${Math.max(1,Math.ceil(data.total/data.pageSize))}</span><button class="button secondary" data-pagination="1" ${data.page*data.pageSize>=data.total?'disabled':''}>Nasledujúca →</button></div></div></div>`;
}
function facts(items){return `<dl class="detail-facts">${items.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;}
function detail(data){
  const p=data.portal,portalMs=p.visits.reduce((sum,v)=>sum+Math.max(0,v.last_at-v.started_at),0);
  const checks=data.checklist.filter(c=>c.completed),latestCheck=checks.length?Math.max(...checks.map(c=>c.updated_at)):null;
  const paid=data.orders.filter(o=>o.status==='paid'),firstPurchase=paid.length?Math.min(...paid.map(o=>o.created_at)):null;
  return `<div class="detail-summary"><span class="eyebrow">DETAIL ZÁKAZNÍKA</span><strong>${escape(data.customer.name)}</strong><span>${escape(data.customer.email)}</span></div><div class="detail-columns"><section class="detail-block"><h3>Nákup a príprava</h3>${facts([['Zakúpené',date(firstPurchase)],['Prvé otvorenie customer page',date(p.firstVisit)],['Od nákupu k otvoreniu',firstPurchase!=null&&p.firstVisit!=null?time(p.firstVisit-firstPurchase):'—'],['Návštevy rodičovskej stránky',number(p.count)],['Čas návštev ≈',p.count?time(portalMs):'—'],['Posledná návšteva',date(p.lastVisit)]])}<p class="caption">Čas návštev je interval medzi prvou a poslednou zaznamenanou aktivitou, vrátane prestávok.</p><details><summary>Aktivity na rodičovskej stránke · checklist ${checks.length}/${data.entitlements.length*13}</summary>${latestCheck!=null?`<p class="caption">Posledné potvrdenie ${date(latestCheck)}</p>`:''}${data.checklist.length?table(['Príprava','Stav','Zmenené'],data.checklist.map(c=>[escape(checklistNames[c.step_key]||c.step_key),c.completed?'✓ Hotovo':'Čaká',date(c.updated_at)])):empty('Zatiaľ bez zaznamenanej prípravy.')}${table(['Otvorenie','Posledná aktivita','Trvanie ≈'],p.visits.map(v=>[date(v.started_at),date(v.last_at),time(v.last_at-v.started_at)]))}</details></section><section class="detail-block"><h3>Zakúpené produkty</h3>${table(['Produkt','Dátum','Cena','Platba'],data.orders.map(o=>[escape(o.product_name),date(o.created_at),money(o.unit_price_cents*o.quantity,o.currency),badge(o.status)]))}${data.entitlements.length?`<details><summary>Prístupy a opakovania</summary>${data.entitlements.map(e=>facts([['Produkt',escape(e.product_id)],['Prvá aktivácia',date(e.activated_at)],['Prvé dokončenie',date(e.first_completed_at)],['Opakovanie do',date(e.replay_until)]])).join('')}</details>`:''}</section></div>${data.runs.map(run=>`<section class="detail-block run-detail"><div class="run-heading"><h3>Hranie ${run.run_number} ${badge(run.status)}</h3><span>${date(run.started_at)} → ${date(run.completed_at)}</span></div>${facts([['Spustenie hry',date(run.started_at)],['Od otvorenia customer page po štart',p.firstVisit!=null?time(run.started_at-p.firstVisit):'—'],['Trvanie hry',run.completed_at!=null?time(run.completed_at-run.started_at):'Prebieha'],['Posledná aktivita',date(run.last_at)]])}${table(['Úloha','Otvorená','Vyriešená','Trvanie','Aktívny čas ≈','Správne','Nesprávne','Nápovedy','Stav'],run.stages.map(s=>[`${s.stage}. ${escape(s.title)}`,date(s.first_opened_at),date(s.completed_at),s.completed_at!=null?time(s.completed_at-s.first_opened_at):'—',s.first_opened_at!=null?time(s.active_ms):'—',s.attempts!=null?Math.max(0,s.attempts-s.wrong_attempts):'—',s.wrong_attempts??'—',s.hints??'—',s.completed_at!=null?badge('completed'):s.first_opened_at!=null?badge('playing'):'Čaká']))}<p class="caption">Trvanie zahŕňa prestávky. Aktívny čas je odhad podľa zaznamenanej aktivity.</p></section>`).join('')||'<p class="caption">Zákazník ešte nespustil hru.</p>'}<details class="detail-block"><summary>E-maily <span class="count-pill">${data.email.length}</span></summary>${table(['Vytvorené','Šablóna','Stav','Odoslané'],data.email.map(e=>[date(e.created_at),escape(e.template_key),badge(e.status),date(e.sent_at)]))}${data.email.length?'':'<p class="caption">Zatiaľ bez e-mailových udalostí.</p>'}</details><details class="detail-block"><summary>História hry <span class="count-pill">${data.events.length}</span></summary>${table(['Čas','Udalosť','Úloha','Relácia'],data.events.map(e=>[date(e.occurred_at),escape(eventNames[e.type]||e.type),e.stage??'Finále',escape(e.run_id)]))}</details>`;
}
function currentView(){const hash=location.hash.slice(1);return ['customers','emails','events'].includes(hash)?'analytics':Object.hasOwn(titles,hash)?hash:'dashboard';}
async function load(){
  const id=++loadingId,view=currentView();
  $('#page-title').textContent=titles[view][0];$('#page-description').textContent=titles[view][1];$('#breadcrumb').textContent=titles[view][0];
  document.body.classList.toggle('analysis-wide',view==='analytics'&&state.wide);
  syncPaymentShell();
  document.querySelectorAll('[data-page]').forEach(a=>{a.classList.toggle('active',a.dataset.page===view);if(a.dataset.page===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#filters').hidden=view==='payments';
  $('#notice').textContent='';$('#view').setAttribute('aria-busy','true');
  try{
    const p=view==='payments'?paymentParams():params();if(view==='analytics'){p.set('view','journey');for(const [key,value] of Object.entries({page:state.page,q:state.q,state:state.status,sort:state.sort,direction:state.sort==='customer'?'asc':'desc',version:state.version,portal:state.portal}))p.set(key,value);}
    const data=await api('/api/admin/'+(view==='analytics'?'customers':view),p);if(id!==loadingId)return;
    const focused=document.activeElement?.id,selection=document.activeElement?.selectionStart;
    const paymentSnapshot=view==='payments'?capturePaymentUI():null;
    if(view==='payments')paymentData=data;
    $('#view').innerHTML=({dashboard,orders,analytics,payments})[view](data);
    if(view==='payments'){state.paymentPage=data.page;restorePaymentUI(paymentSnapshot);}else state.page=data.page||state.page;
    if(view==='dashboard'){
      $('#view').insertAdjacentHTML('afterbegin','<div id="payment-overview"></div>');
      const paymentData=await api('/api/admin/payments').catch(()=>null);
      if(id!==loadingId)return;
      $('#payment-overview').innerHTML=paymentData?paymentHealth(paymentData,true):'<section class="payment-health attention" role="alert"><h2>Stav platieb sa nepodarilo načítať</h2><p>Aktuálny stav nie je overený.</p><a class="button" href="#payments">Otvoriť platby a chyby →</a></section>';
      const reviews=await api('/api/admin/feedback');
      if(id!==loadingId)return;
      $('#view').insertAdjacentHTML('beforeend','<section class="panel"><h2>Hodnotenia hráčov</h2>'+table(['Hodnotenie','Rodina','Komentár','Dátum'],reviews.map(r=>[r.stars+' / 5 ★',escape(r.name),escape(r.comment),date(r.created_at)]))+'</section>');
    }
    document.querySelectorAll('[data-height]').forEach(e=>{e.style.height=Math.max(2,Math.min(75,Number(e.dataset.height)*.75))+'%';});
    document.querySelectorAll('[data-width]').forEach(e=>{e.style.width=e.dataset.width+'%';});
    if(focused==='customer-search'){$('#customer-search').focus({preventScroll:true});$('#customer-search').setSelectionRange(selection,selection);}
    for(const c of data.rows||[])if(state.expanded.has(c.customer_id)&&!state.details.has(c.customer_id))fetchInlineDetail(c.customer_id);
  }catch(error){if(id!==loadingId)return;$('#view').innerHTML=empty('Dáta sa nepodarilo načítať.');$('#notice').textContent=error.message;if(view==='payments')$('#view').innerHTML='<section class="payment-load-error" role="alert"><div><h2>Stav platieb nie je overený</h2><p>Prehľad sa nepodarilo načítať. Skontrolujte pripojenie.</p></div><button class="button secondary" id="refresh-payments">Skúsiť znova</button></section>';}
  finally{if(id===loadingId)$('#view').setAttribute('aria-busy','false');}
}
async function fetchInlineDetail(customerId){
  try{
    const data=await api('/api/admin/customers/'+encodeURIComponent(customerId));state.details.set(customerId,data);
    const row=[...document.querySelectorAll('[data-row]')].find(r=>r.dataset.row===customerId);
    if(row?.nextElementSibling)row.nextElementSibling.querySelector('.inline-detail').innerHTML=detail(data);
  }catch(error){
    const row=[...document.querySelectorAll('[data-row]')].find(r=>r.dataset.row===customerId);
    if(row?.nextElementSibling)row.nextElementSibling.querySelector('.inline-detail').innerHTML=empty(error.message)+'<button class="button secondary" data-retry="'+escape(customerId)+'">Skúsiť znova</button>';
  }
}
$('#filters').addEventListener('submit',e=>{e.preventDefault();state.page=1;load();});
$('#clear-filters').addEventListener('click',()=>{$('#filters').reset();Object.assign(state,{page:1,q:'',status:'',version:'',portal:'',sort:'purchase'});load();});
window.addEventListener('hashchange',()=>{state.page=1;load();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.wide){state.wide=false;document.body.classList.remove('analysis-wide');$('#view .journey-board')?.classList.remove('is-wide');const b=$('#expand-analysis');if(b){b.textContent='⛶ Rozšíriť na celú šírku';b.setAttribute('aria-pressed','false');b.focus();}}});
$('#view').addEventListener('input',e=>{if(e.target.id==='payment-column-search'){paymentUI.columnQuery=e.target.value;document.querySelectorAll('[data-payment-column-option]').forEach(el=>{el.hidden=!paymentColumnMatches(el.dataset.paymentColumnOption);});return;}if(e.target.id==='customer-search'){state.q=e.target.value;state.page=1;clearTimeout(debounce);debounce=setTimeout(load,300);}});
$('#view').addEventListener('change',e=>{
  const column=e.target.dataset.paymentColumn;
  if(column&&Object.hasOwn(paymentColumns,column)){
    const hidden=new Set(paymentLayout.hidden);
    if(e.target.checked)hidden.delete(column);else if(paymentLayout.order.length-hidden.size>1)hidden.add(column);
    paymentLayout.hidden=[...hidden];savePaymentLayout();renderPaymentWorkspace();return;
  }
  if(e.target.id==='payment-density'){paymentLayout.density=e.target.value==='comfortable'?'comfortable':'compact';savePaymentLayout();renderPaymentWorkspace();return;}
  const paymentKeys={'payment-days':'paymentDays','payment-category':'paymentCategory'};if(paymentKeys[e.target.id]){state[paymentKeys[e.target.id]]=e.target.value;state.paymentPage=1;load();return;}const keys={'customer-state':'status','customer-sort':'sort','customer-version':'version','customer-portal':'portal'};if(keys[e.target.id]){clearTimeout(debounce);state[keys[e.target.id]]=e.target.value;state.page=1;load();}});
$('#view').addEventListener('click',async e=>{
  if(e.target.closest('#refresh-payments')){load();return;}
  const chip=e.target.closest('[data-payment-state]');if(chip){state.paymentStatus=chip.dataset.paymentState;state.paymentPage=1;$('#payment-table-scroll')?.scrollTo({top:0});load();return;}
  const expand=e.target.closest('[data-payment-expand]');if(expand){const id=expand.dataset.paymentExpand;if(paymentUI.expanded.has(id))paymentUI.expanded.delete(id);else paymentUI.expanded.add(id);renderPaymentWorkspace();return;}
  const move=e.target.closest('[data-payment-move]');if(move){movePaymentColumn(move.dataset.paymentMove,Number(move.dataset.step));return;}
  if(e.target.closest('#reset-payment-layout')){paymentLayout=defaultPaymentLayout();paymentUI.columnQuery='';savePaymentLayout();syncPaymentShell();renderPaymentWorkspace();return;}
  if(e.target.closest('#close-payment-columns')){closePaymentColumns();return;}
  const paymentPager=e.target.closest('[data-payment-page]');if(paymentPager){state.paymentPage+=Number(paymentPager.dataset.paymentPage);$('#payment-table-scroll')?.scrollTo({top:0});load();return;}
  const pager=e.target.closest('[data-pagination]');if(pager){state.page+=Number(pager.dataset.pagination);load();return;}
  if(e.target.closest('#expand-analysis')){state.wide=!state.wide;document.body.classList.toggle('analysis-wide',state.wide);$('#view .journey-board').classList.toggle('is-wide',state.wide);const b=$('#expand-analysis');b.textContent=state.wide?'↙ Zmenšiť':'⛶ Rozšíriť na celú šírku';b.setAttribute('aria-pressed',String(state.wide));return;}
  const retry=e.target.closest('[data-retry]');if(retry){fetchInlineDetail(retry.dataset.retry);return;}
  const row=e.target.closest('[data-row]');if(row){
    const customerId=row.dataset.row,button=row.querySelector('[data-journey]'),expanded=button.getAttribute('aria-expanded')!=='true';
    if(expanded)state.expanded.add(customerId);else state.expanded.delete(customerId);
    row.classList.toggle('expanded',expanded);button.setAttribute('aria-expanded',String(expanded));row.querySelector('.expand-cell').textContent=expanded?'−':'+';row.nextElementSibling.hidden=!expanded;
    if(expanded&&!state.details.has(customerId))fetchInlineDetail(customerId);return;
  }
  const button=e.target.closest('[data-customer]');if(!button)return;
  const id=++detailId;$('#detail-content').innerHTML='<h2 id="detail-title">Detail zákazníka</h2><p>Načítavam…</p>';$('#detail').showModal();
  try{const data=await api('/api/admin/customers/'+encodeURIComponent(button.dataset.customer));if(id===detailId)$('#detail-content').innerHTML='<h2 id="detail-title">Detail zákazníka</h2>'+detail(data);}catch(error){if(id===detailId)$('#detail-content').innerHTML='<h2 id="detail-title">Detail zákazníka</h2>'+empty(error.message);}
});
function movePaymentColumn(id,step){
  const from=paymentLayout.order.indexOf(id),to=from+step;
  if(from<0||to<0||to>=paymentLayout.order.length)return;
  [paymentLayout.order[from],paymentLayout.order[to]]=[paymentLayout.order[to],paymentLayout.order[from]];
  savePaymentLayout();renderPaymentWorkspace();
}
function closePaymentColumns(){
  const menu=$('.payment-column-options');if(!menu)return;
  menu.open=false;paymentUI.panels.delete('columns');$('#payment-column-toggle').focus({preventScroll:true});
}
$('#payment-nav-toggle').addEventListener('click',()=>{paymentLayout.navCollapsed=!paymentLayout.navCollapsed;savePaymentLayout();syncPaymentShell();});
$('#view').addEventListener('dragstart',e=>{
  const column=e.target.closest('[data-payment-drag]');if(!column)return;
  paymentDragColumn=column.dataset.paymentDrag;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',paymentDragColumn);
});
$('#view').addEventListener('dragover',e=>{if(paymentDragColumn&&e.target.closest('th[data-column]')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
$('#view').addEventListener('drop',e=>{
  const target=e.target.closest('th[data-column]');if(!paymentDragColumn||!target)return;
  e.preventDefault();const from=paymentLayout.order.indexOf(paymentDragColumn),to=paymentLayout.order.indexOf(target.dataset.column);
  if(from>=0&&to>=0&&from!==to){paymentLayout.order.splice(from,1);paymentLayout.order.splice(to,0,paymentDragColumn);savePaymentLayout();renderPaymentWorkspace();}
  paymentDragColumn=null;
});
$('#view').addEventListener('dragend',()=>{paymentDragColumn=null;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('.payment-column-options')?.open){e.preventDefault();closePaymentColumns();}});
document.addEventListener('click',e=>{const menu=$('.payment-column-options');if(menu?.open&&!e.target.closest('.payment-column-options')){menu.open=false;paymentUI.panels.delete('columns');}});
$('#close-detail').addEventListener('click',()=>{detailId++;$('#detail').close();});
(async()=>{try{
  const context=await api('/api/admin/context');state.context=context;
  $('#identity-label').textContent=context.admin;
  if(context.authMode==='password'){
    $('#logout-button').hidden=false;
    $('#logout-button').addEventListener('click',async()=>{
      try{const response=await fetch('/api/admin/logout',{method:'POST',credentials:'same-origin'});if(!response.ok)throw Error('Odhlásenie sa nepodarilo.');location.replace('/admin/login');}catch(error){$('#notice').textContent=error.message;}
    });
  }
  $('#mode-label').textContent=context.environment==='local'?'Lokálne prostredie':context.authMode==='password'?'Prihlásenie heslom':'Overené cez Cloudflare Access';
  if(context.environment==='local'){$('#environment-banner').hidden=false;$('#environment-banner').textContent=context.demo?'LOKÁLNE DEMO · Všetci zákazníci, nákupy a herné relácie sú fiktívne testovacie údaje.':'LOKÁLNY TEST · Bez produkčného prihlásenia. Prázdne dáta sa nenahrádzajú demo zákazníkmi.';}
  if(context.fakeCustomers>0){$('#environment-banner').hidden=false;$('#environment-banner').textContent=`FAKE ÚDAJE · Databáza obsahuje ${context.fakeCustomers} fiktívnych zákazníkov. Prehľady zahŕňajú ich simulované nákupy, tržby a hrania. Nejde o skutočné platby.`;}
  if(context.webUrl){const base=new URL(context.webUrl);if(base.protocol==='https:')$('#external-links').innerHTML=[['Funnel','/'],['Supervisor','/Supervisor'],['Storyboard','/admin/storyboard']].map(([label,path])=>`<a href="${escape(new URL(path,base).href)}" target="_blank" rel="noopener noreferrer">${label} <span>↗</span></a>`).join('');}
  const products=await api('/api/admin/products');$('#product').insertAdjacentHTML('beforeend',products.map(p=>`<option value="${escape(p.id)}">${escape(p.name)}</option>`).join(''));
  await load();
}catch(error){$('#notice').textContent=error.message;$('#view').innerHTML=empty('Administrátorské prihlásenie alebo konfigurácia nie sú dostupné.');$('#view').setAttribute('aria-busy','false');}})();

setInterval(refreshPaymentHealth,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshPaymentHealth();});
