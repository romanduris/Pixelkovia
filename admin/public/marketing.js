import {chartContent,bindChartDays,paymentLink,sourceGroups} from './marketing-charts.js';
import {readPreferences,savePreferences} from './marketing-preferences.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>value==null?'Nedostupné':new Intl.NumberFormat('sk-SK',{maximumFractionDigits:1}).format(value);
const pct=value=>value==null?'Nedostupné':num(value*100)+' %';
const money=value=>value==null?'Nedostupné':new Intl.NumberFormat('sk-SK',{style:'currency',currency:'EUR'}).format(value/100);
const date=value=>value==null?'Zatiaľ nezaznamenané':new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(value);
const clock=value=>new Intl.DateTimeFormat('sk-SK',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Bratislava'}).format(value);
const sourceNames={facebook_ads:'Facebook reklama',instagram_ads:'Instagram reklama',meta:'Meta (UTM)',facebook:'Facebook odkaz',instagram:'Instagram odkaz',influencer:'Influencer',direct:'Bez informácie o pôvode',organic:'Neplatená návštevnosť',unknown:'Neznámy alebo iný zdroj'};
const sourceDescriptions={direct:'Prehliadač neposlal odkazujúcu stránku a odkaz nemá označenie kampane. Môže ísť o zadanú adresu, záložku alebo odkaz zo správy či aplikácie.',unknown:'Iný alebo nerozpoznaný zdroj, prípadne starší nákup bez priradenej návštevy.',organic:'Neplatený zdroj, napríklad vyhľadávač Google alebo Bing, alebo odkaz označený ako organic.'};
const devices={mobile:'Mobil',desktop:'Desktop',tablet:'Tablet',unknown:'Neznáme'},products={game:'Hra',books:'Knihy',combination:'Hra + knihy'};
export {sourceNames,devices as marketingDevices,products as marketingProducts};
const periods={today:'Dnes','7':'7 dní','14':'14 dní','30':'30 dní','90':'90 dní',since:'Od dátumu',custom:'Vlastný rozsah'};
const preferences=readPreferences();
let selected=preferences.selected,renderedData;
// Presentation state stays separate from server observations and API filters.
const ui={...preferences,open:new Set(preferences.open),restore:null};
const persist=()=>savePreferences(selected,ui);
export const marketingParams=()=>new URLSearchParams(selected);
export function rememberMarketing(){
  const root=document.querySelector('.marketing-dashboard');if(!root)return;
  root.querySelectorAll('details[data-marketing-detail]').forEach(el=>{if(el.open)ui.open.add(el.dataset.marketingDetail);else ui.open.delete(el.dataset.marketingDetail);});
  persist();
  ui.restore={top:window.scrollY,focus:root.contains(document.activeElement)?document.activeElement.id:null};
}
const options=(items,value)=>Object.entries(items).map(([id,label])=>`<option value="${esc(id)}"${id===value?' selected':''}>${esc(label)}</option>`).join('');
const open=id=>ui.open.has(id)?' open':'';
const disclosure=(id,label,content,extra='')=>`<details class="marketing-disclosure ${extra}" id="marketing-${id}" data-marketing-detail="${id}"${open(id)}><summary id="marketing-summary-${id}">${label}<span aria-hidden="true">⌄</span></summary><div class="marketing-disclosure-body">${content}</div></details>`;
const kpi=(id,label,value,context,note,href)=>`<details class="marketing-kpi" data-marketing-detail="kpi-${id}"${open('kpi-'+id)}><summary id="marketing-kpi-${id}"><span class="marketing-kpi-label">${label}<span class="marketing-info" aria-hidden="true">i</span><span class="sr-only"> · definícia metriky</span></span><strong${value==='Nedostupné'?' class="is-unavailable"':''}>${href?`<a class="marketing-purchase-link" href="${esc(href)}" aria-label="Zobraziť ${esc(value)} platených nákupov s rovnakými filtrami" title="Otvoriť zodpovedajúce platby">${esc(value)}</a>`:esc(value)}</strong><small>${esc(context)}</small></summary><p>${esc(note)}</p></details>`;
const metric=(id,label,value,note,extra='',content='')=>`<details class="marketing-metric ${extra}" data-marketing-detail="metric-${id}"${open('metric-'+id)}><summary id="marketing-metric-${id}"><span>${label}<span class="marketing-info" aria-hidden="true">i</span></span><strong>${esc(value)}</strong></summary><p>${esc(note)}</p>${content}</details>`;
function overviewMetrics(d){
  const p=d.periodMetrics,m=d.metrics,u=d.uniqueMetrics,unique=ui.overviewUnique;
  const visitNote=unique?`Unikátne prehliadače za celé obdobie, nie súčet denných počtov. Rozlíšenie vyžaduje analytický súhlas; jeden človek môže používať viac prehliadačov. ${u.partial?'Dostupná je iba identifikovaná časť návštev od '+date(d.charts.uniqueStartedAt)+'.':''}`:!d.collectionEnabled?'Historické záznamy. Nové návštevy sa v prehliadači nemerajú.':'Namerané návštevné relácie; po 30 minútach bez otvorenia stránky začína nová. Meranie vyžaduje analytický súhlas.';
  const checkoutNote=(unique?'Počet rozlíšených prehliadačov, ktoré otvorili checkout v zvolenom období.':'Počet zaznamenaných otvorení stránky /checkout v zvolenom období, vrátane opätovného otvorenia a obnovenia stránky.')+` Meranie vyžaduje analytický súhlas. Opakované otvorenia meriame od ${date(d.checkoutOpensStartedAt)}; staršie údaje obsahujú iba prvé otvorenie v relácii. Platobný pokus znamená vytvorenú Stripe reláciu, nie bankové potvrdenie; pokusy zahŕňajú aj nepriradené a bezplatné relácie.`;
  const conversionNote=unique?(u.conversionReason||`Unikátne prehliadače s priradeným plateným nákupom / unikátne prehliadače návštevnej kohorty (${num(u.buyers)} / ${num(u.visits)}). Viac nákupov jedného prehliadača sa v tomto pomere počíta raz. Nákupy a tržby vedľa zostávajú overenými transakciami za celé obdobie. ${u.partial?'Iba identifikovaná časť návštev.':''}`):(d.conversionReason||`Nákupy priradené nameraným návštevám / tieto návštevy. ${d.partialPeriod?'Iba nameraná časť obdobia od '+date(d.observedStart)+'.':'Celá zvolená návštevná kohorta.'}`);
  return kpi('visits','Funnel',num(unique?u.visits:p.visits),unique?'Unikátne prehliadače':'Návštevy webu',visitNote)
    +kpi('checkout','Check Out',num(unique?u.checkouts:p.checkouts),'Platobné pokusy: '+num(p.attempts),checkoutNote)
    +kpi('purchases','Nákupy',num(p.purchases),'Platené · zdarma '+num(p.freePurchases),'Serverom overené platené transakcie podľa dátumu úhrady, aj bez návštevnej atribúcie. Darček sa počíta raz. Objednávky zdarma ('+num(p.freePurchases)+') nevstupujú do platených nákupov ani konverzie. Prepínač unikátnych používateľov nemení počet transakcií.',paymentLink(d))
    +kpi('conversion','Konverzia',pct(unique?u.conversion:m.conversion),unique?'Kupujúci / prehliadače':'Nákupy z návštev / návštevy',conversionNote)
    +kpi('revenue','Tržby',money(m.revenueCents),d.costs==null?'Reklama: Nedostupné':'Reklama − '+money(d.costs),'Hrubé inkaso pred refundáciami, poplatkami a reklamnými nákladmi, podľa dátumu overenej úhrady. '+(d.costReason||'Reklamné náklady sa vykazujú samostatne; nejde o zisk.'));
}
const sourceColumns=[['label','Zdroj'],['visits','Návštevy'],['purchases','Nákupy z návštev'],['conversion','Konverzia']];
export function groupedSources(d){
  const grouped=sourceGroups.flatMap(([, ,keys])=>keys);
  const rows=d.rows.filter(row=>![...grouped,'influencer'].includes(row.source));
  for(const [source,label,keys]of sourceGroups){
    const children=keys.map(key=>d.rows.find(row=>row.source===key)).filter(Boolean);
    if(!children.length)continue;
    const sum=key=>children.some(row=>row[key]==null)?null:children.reduce((total,row)=>total+row[key],0);
    const visits=sum('visits'),purchases=sum('purchases');
    rows.push({source:'group-'+source,label,group:source,children,visits,purchases,periodPurchases:sum('periodPurchases'),conversion:!d.conversionReason&&visits>0&&purchases!=null?purchases/visits:null});
  }
  return rows;
}
function sortedSources(d){
  return groupedSources(d).sort((a,b)=>{
    const av=a[ui.sort],bv=b[ui.sort];if(av==null&&bv==null)return 0;if(av==null)return 1;if(bv==null)return -1;
    const compared=typeof av==='string'?av.localeCompare(bv,'sk'):av-bv;return ui.direction==='asc'?compared:-compared;
  });
}
function sourceRows(d){
  const cells=r=>sourceColumns.slice(1).map(([key,label])=>`<td data-label="${label}">${key==='conversion'?pct(r[key]):num(r[key])}</td>`).join('');
  const childHeading=(child,group)=>{
    const label=group==='other'?sourceNames[child.source]:child.source.endsWith('_ads')?'Reklama':'Bežný príspevok';
    const description=sourceDescriptions[child.source]||(child.source===group?'Odkaz alebo príspevok bez označenia reklamy. Neoznačenú reklamu nemožno spoľahlivo odlíšiť.':'');
    return `<th scope="row"${description?` title="${esc(description)}"`:''}>${esc(label)}</th>`;
  };
  return sortedSources(d).map(r=>{
    if(!r.group)return `<tr data-marketing-root="${esc(r.source)}"><th scope="row">${esc(r.label)}</th>${cells(r)}</tr>`;
    const expanded=ui.open.has('source-'+r.group);
    return `<tr data-marketing-root="${r.source}" class="marketing-source-group"><th scope="row"><button type="button" id="marketing-group-${r.group}" data-marketing-group="${r.group}" aria-expanded="${expanded}" aria-controls="${r.children.map(child=>'marketing-source-'+child.source).join(' ')}" aria-label="${expanded?'Zbaliť':'Rozbaliť'} ${r.label}"><span class="marketing-source-arrow" aria-hidden="true">›</span>${r.label}</button></th>${cells(r)}</tr>`+r.children.map(child=>`<tr id="marketing-source-${child.source}" class="marketing-source-child" data-marketing-child="${r.group}"${expanded?'':' hidden'}>${childHeading(child,r.group)}${cells(child)}</tr>`).join('');
  }).join('');
}
const staleText='Prehľad je starší než 5 minút. Obnovte údaje pred rozhodovaním.';
function adsControls(d){
  const ads=d.ads;if(!ads)return '';
  return `<div class="marketing-ads-controls"><p>${ads.lastSuccessAt?'Posledný úspešný import: '+esc(date(ads.lastSuccessAt))+'.':'Výdavky zatiaľ neboli importované.'}</p><button type="button" id="marketing-sync-ads"${ads.configured?'':' disabled'}>Obnoviť výdavky za obdobie</button><p id="marketing-ads-status" role="status" aria-live="polite">${ads.configured?'Import číta iba výdavky; nemení reklamy.':'Čaká sa na serverový prístup Meta Ads.'}</p>${ads.campaigns.length?`<p>Priraďte presný utm_campaign z existujúcich reklamných odkazov. Predvolene sa používa ID kampane; názov sa neodhaduje.</p><datalist id="marketing-utm-campaigns">${d.campaigns.map(c=>`<option value="${esc(c)}"></option>`).join('')}</datalist>${ads.campaigns.map(c=>`<form class="marketing-ads-campaign" data-campaign="${esc(c.id)}"><label>${esc(c.name)} <small>(${esc(c.id)})</small><input name="utmCampaign" aria-label="UTM kampane ${esc(c.name)}" value="${esc(c.utm)}" list="marketing-utm-campaigns" maxlength="80"></label><button type="submit">Uložiť priradenie</button></form>`).join('')}`:''}</div>`;
}
export function marketing(d){
  rememberMarketing();renderedData=d;
  const m=d.metrics,p=d.periodMetrics,f=d.filters,checks=d.checks||[];
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(d.generatedAt);
  const earliest=new Date(Date.parse(today)-365*86400000).toISOString().slice(0,10);
  const stale=Date.now()-d.generatedAt>300000;
  const checksFailed=checks.some(c=>!c.ok),checksUnknown=checks.length<2,checksStale=checks.some(c=>d.generatedAt-c.checked_at>1800000);
  const actionable=(m.technicalSignals||0)>0||(m.accessIssueOrders||0)>0||checksFailed;
  const health=actionable?'Vyžaduje pozornosť':checksUnknown?'Kontroly nedostupné':checksStale?'Kontroly neaktuálne':'Kontroly aktuálne';
  const conversionNote=d.conversionReason||`Nákupy priradené nameraným návštevám / tieto návštevy. ${d.partialPeriod?'Iba nameraná časť obdobia od '+date(d.observedStart)+'.':'Celá zvolená návštevná kohorta.'}`;
  const notices=[];
  if(!d.collectionEnabled)notices.push('Zber návštev je vypnutý; zobrazené návštevy a checkouty sú historické. Platby sa sledujú naďalej.');
  else if(!d.lastEventAt)notices.push('Čakáme na prvú nameranú návštevu. Chýbajúce návštevy neuvádzame ako nulu.');
  else if(d.generatedAt-d.lastEventAt>86400000)notices.push('Viac než 24 hodín neprišla návštevná udalosť; zber môže byť neúplný.');
  if(d.partialPeriod)notices.push(`Iba nameraná časť obdobia od ${date(d.observedStart)}. Úhrady zahŕňajú celé obdobie.`);
  if(d.conversionReason&&d.lastEventAt&&d.collectionEnabled)notices.push(`Konverzia nedostupná: ${d.conversionReason}`);
  const active=Object.entries({source:f.source,campaign:f.campaign,device:f.device,product:f.product}).filter(([,v])=>v);
  const labels={source:'Zdroj',campaign:'Kampaň',device:'Zariadenie',product:'Produkt'};
  const filterValue=(key,value)=>({source:sourceNames,device:devices,product:products}[key]?.[value]||value);
  const funnelExplanation=`<p>Jeden prehľad zvoleného obdobia: návštevy podľa začiatku relácie, checkout podľa zaznamenaných otvorení stránky, platobné pokusy podľa vytvorenia Stripe relácie a nákupy podľa overenej úhrady. Pokusy a nákupy zahŕňajú aj transakcie bez návštevnej atribúcie. Neskoršia úhrada preto môže patriť do iného obdobia ako návšteva či pokus.</p><p>Konverzia návštev používa samostatnú návštevnú kohortu od ${date(d.observedStart)}: ${num(m.visits)} návštev, ${num(m.checkouts)} relácií s checkoutom, ${num(d.cohort.attempts)} priradených pokusov a ${num(d.cohort.purchases)} platených nákupov. Neskoršie nákupy tejto kohorty sa dopĺňajú do času aktualizácie. ${esc(conversionNote)}</p><p>Meranie návštev vyžaduje analytický súhlas, serverové platby sa overujú nezávisle. Tieto počty preto nie sú uzavretou postupnosťou a neuvádzame medzi nimi percentá odchodu. Jedna návšteva môže mať viac nákupov; konverzia môže prekročiť 100 %. Platobný pokus znamená vytvorenú Stripe reláciu, nie zadanie karty ani potvrdenie bankou. Bezplatné objednávky (${num(p.freePurchases)}) sú uvedené oddelene a nevstupujú do platených nákupov ani konverzie.</p>`;
  return `<div class="marketing-dashboard">
    <header class="marketing-toolbar"><div class="marketing-title"><button type="button" id="marketing-nav-toggle" class="marketing-icon-button" aria-label="Rozbaliť alebo zbaliť navigáciu" aria-controls="admin-sidebar" aria-expanded="${!document.body.classList.contains('payments-nav-collapsed')}">☰</button><h1>Predajný funnel</h1></div><div class="marketing-toolbar-actions"><div class="marketing-period-controls"><div class="marketing-period-buttons" role="group" aria-label="Obdobie">${[['today','1d'],['7','7d'],['14','14d'],['30','30d'],['90','90d']].map(([period,label])=>`<button type="button" id="marketing-period-${period}" data-marketing-period="${period}" aria-pressed="${f.period===period}"${period==='today'?' title="Dnes podľa času v Bratislave"':''}>${label}</button>`).join('')}</div><label class="marketing-since-date${f.period==='since'?' is-active':''}"><span>Od dátumu</span><svg class="marketing-date-icon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg><input id="marketing-since" type="date" aria-label="Zobrazovať od dátumu" value="${f.period==='since'?esc(f.from):''}" max="${today}" min="${earliest}"></label></div><button type="button" id="marketing-filter-toggle" aria-controls="marketing-filter-panel" aria-expanded="${ui.open.has('filters')}">Filtre${active.length?' · '+active.length:''} <span aria-hidden="true">⌄</span></button><button type="button" id="refresh-marketing"><span aria-hidden="true">↻</span> Obnoviť</button><button type="button" id="marketing-logout" class="marketing-icon-button" aria-label="Odhlásiť sa" title="Odhlásiť sa" hidden>↪</button></div><div class="marketing-toolbar-meta"><span>${esc(f.from)} – ${esc(f.to)} <span class="marketing-timezone">· Bratislava</span></span><span class="marketing-freshness" data-generated="${d.generatedAt}" title="${esc(date(d.generatedAt))}"${stale?' role="alert"':''}>${stale?staleText:'Obnovené '+clock(d.generatedAt)}</span></div></header>
    ${active.length?`<div class="marketing-filter-chips" aria-label="Aktívne filtre">${active.map(([key,value])=>`<button type="button" id="marketing-chip-${key}" data-marketing-remove="${key}" aria-label="Odstrániť filter ${labels[key]}: ${esc(filterValue(key,value))}">${labels[key]}: ${esc(filterValue(key,value))}<span aria-hidden="true">×</span></button>`).join('')}<button type="button" id="marketing-reset-chips" data-marketing-reset>Reset filtrov</button></div>`:''}
    <section id="marketing-filter-panel" class="marketing-filter-panel" aria-label="Rozšírené filtre"${ui.open.has('filters')?'':' hidden'}><form id="marketing-filters" class="marketing-filters" aria-label="Filtre predajného funnelu"><label>Obdobie<select id="marketing-period" name="period">${options(periods,f.period)}</select></label><div class="marketing-custom-dates"${['custom','since'].includes(f.period)?'':' hidden'}><label>Od<input type="date" name="from" value="${esc(f.from)}" required ${['custom','since'].includes(f.period)?'':'disabled'}></label><label${f.period==='since'?' hidden':''}>Do<input type="date" name="to" value="${esc(f.to)}" required ${f.period==='custom'?'':'disabled'}></label></div><label>Zdroj<select name="source">${options({'':'Všetky zdroje',...sourceNames},f.source)}</select></label><label>Kampaň<select name="campaign">${options({'':'Všetky kampane',...Object.fromEntries([...new Set([...d.campaigns,...f.campaign?[f.campaign]:[]])].map(c=>[c,c]))},f.campaign)}</select></label><label>Zariadenie<select name="device">${options({'':'Všetky zariadenia',...devices},f.device)}</select></label><label>Produkt<select name="product">${options({'':'Všetky produkty',...products},f.product)}</select></label><div class="marketing-filter-actions"><button type="submit">Použiť filtre</button><button type="button" id="marketing-reset" data-marketing-reset>Reset filtrov</button></div></form></section>
    ${notices.length?`<aside class="marketing-quality" aria-label="Kvalita merania"><span aria-hidden="true">ⓘ</span><div class="marketing-period-note">${notices.map(n=>`<p>${esc(n)}</p>`).join('')}</div></aside>`:''}
    <section class="marketing-panel marketing-funnel" aria-labelledby="marketing-funnel-title"><div class="marketing-section-heading marketing-overview-heading"><div><h2 id="marketing-funnel-title">Prehľad za obdobie</h2><span class="marketing-overview-period">${esc(f.from)} – ${esc(f.to)}</span></div><label class="marketing-period-toggle"><input type="checkbox" id="marketing-overview-unique"${ui.overviewUnique?' checked':''}> Unikátni používatelia</label></div><div class="marketing-kpis" aria-label="Hlavné metriky">${overviewMetrics(d)}</div>${p.visits==null?'<p class="marketing-empty">Návštevy nie sú dostupné. Serverové platobné pokusy a nákupy sa zobrazujú za celé obdobie.</p>':''}${disclosure('funnel-details','Ako čítať tieto údaje',funnelExplanation)}</section>
    ${disclosure('charts',`<span>Návštevnosť</span><label class="marketing-period-toggle marketing-chart-unique"><input type="checkbox" id="marketing-unique" aria-label="Unikátni návštevníci"${ui.unique?' checked':''}> Unikátni</label>`,`<div id="marketing-charts-content">${chartContent(d,ui.unique)}</div>`,'marketing-chart-panel')}
    <div class="marketing-overview-grid"><section class="marketing-panel marketing-sources" aria-labelledby="marketing-sources-title"><div class="marketing-section-heading"><h2 id="marketing-sources-title">Návštevnosť podľa zdroja</h2></div><label class="marketing-mobile-sort" for="marketing-source-sort">Zoradiť<select id="marketing-source-sort">${options(Object.fromEntries(sourceColumns.flatMap(([key,label])=>[['desc',' ↓'],['asc',' ↑']].map(([direction,arrow])=>[key+':'+direction,label+arrow]))),ui.sort+':'+ui.direction)}</select></label><div class="marketing-table-wrap"><table><caption class="sr-only">Namerané návštevy a pripísané nákupy návštevnej kohorty.</caption><thead><tr>${sourceColumns.map(([key,label])=>`<th scope="col" data-marketing-sort-header="${key}" aria-sort="${ui.sort===key?(ui.direction==='asc'?'ascending':'descending'):'none'}"><button type="button" id="marketing-sort-${key}" data-marketing-sort="${key}">${label}<span aria-hidden="true">${ui.sort===key?(ui.direction==='asc'?' ↑':' ↓'):''}</span></button></th>`).join('')}</tr></thead><tbody id="marketing-source-rows">${sourceRows(d)}</tbody></table></div><div class="marketing-source-footer"><span id="marketing-source-count">${groupedSources(d).length} zdrojov</span></div>${disclosure('attribution','Atribúcia a dátumy',`<p>Facebook reklama a Instagram reklama používajú označenie plateného UTM média. Facebook odkaz a Instagram odkaz rozpoznáme z UTM alebo z odkazujúcej domény; samy nepotvrdzujú neplatený príspevok. Reklamné odkazy označte napríklad utm_source=facebook a utm_medium=paid_social. Samotný fbclid nepreukazuje reklamu. Historické neznáme zdroje spätne nemeníme.</p><p>Nákupy z návštev a konverzia patria k návštevnej kohorte od ${date(d.observedStart)}. Konverzia = pripísané nákupy / namerané návštevy zdroja. ${esc(conversionNote)}</p><p>Pri filtri produktu sú návštevy nedostupné, pretože zámer návštevníka pred checkoutom nepoznáme. Facebook a Instagram sú súhrnné riadky; šípka zobrazí reklamu a bežný príspevok alebo odkaz bez označenia reklamy. Others zoskupuje Meta (UTM), vstupy bez informácie o pôvode, neznáme alebo iné zdroje a neplatenú návštevnosť (napríklad vyhľadávače). Označenie meta nerozlišuje Facebook a Instagram. Graf má tri spoločné kategórie Facebook, Instagram a Others. Konverzia každého súhrnu = pripísané nákupy / návštevy skupiny. Zoradenie mení iba poradie už vypočítaných hodnôt.</p>`)}</section>
    <div class="marketing-business"><section class="marketing-panel marketing-commercial" aria-labelledby="marketing-commercial-title"><div class="marketing-section-heading"><h2 id="marketing-commercial-title">Tržby a obchod</h2><span>EUR</span></div>${metric('revenue','Hrubé tržby',money(m.revenueCents),'Hrubé inkaso v EUR pred refundáciami a poplatkami; rovnaký rozsah ako Nákupy, podľa dátumu overenej úhrady. Nejde o čisté tržby.','marketing-revenue')}${metric('costs','Reklamné náklady',money(d.costs),d.costReason,'',adsControls(d))}${metric('cac','CAC · na nákup',money(d.cac),d.cacReason||d.costReason)}</section>
    <section class="marketing-panel marketing-health${actionable?' has-issues':''}" aria-labelledby="marketing-health-title"><div class="marketing-section-heading"><h2 id="marketing-health-title">Prevádzka</h2><span class="marketing-health-status">${health}</span></div>${metric('technical','Technické signály',d.technicalComplete?num(m.technicalSignals):'Nedostupné',`${m.technicalSignals} zaznamenaných deduplikovaných signálov; ${m.technicalAttempts} unikátnych priradených pokusov. Nejde o presný počet porúch. Logy sa uchovávajú 90 dní. Za dlhšie obdobie nie je celková metrika dostupná.`,m.technicalSignals>0?'has-issue':'')}${metric('access','Problémy s prístupom',num(m.accessIssueOrders),`${m.accessIssues} dotknutých platených transakcií. Počet zaplatených objednávok s chýbajúcim vytvorením po 2 min., chybou e-mailu alebo čakaním nad 10 min. Odovzdanie poskytovateľovi nepotvrdzuje doručenie do schránky.`,m.accessIssueOrders>0?'has-issue':'')}${metric('refunds','Refundované transakcie',num(m.refunds),'Úspešná platba ostáva historickým nákupom aj po refundácii; refundácie sa vykazujú samostatne a neodpočítavajú sa od hrubých tržieb.')}${disclosure('checks','Kontroly a diagnostika',`<ul>${checks.length?checks.map(c=>`<li><strong>${esc(c.id)}:</strong> ${!c.ok?'zlyhala':d.generatedAt-c.checked_at>1800000?'neaktuálna':'úspešná'} · ${date(c.checked_at)}</li>`).join(''):'<li>Nedostupné — chýba kontrola platobného zdroja.</li>'}</ul><p>Chýbajúce alebo neaktuálne kontroly nepotvrdzujú zdravý stav. Technický signál sám osebe nemení overený výsledok platby. Prvý dostupný technický signál: ${date(d.technicalStartedAt)}.</p>`)}</section></div></div>
  </div>`;
}
export function bindMarketing(refresh){
  const root=document.querySelector('.marketing-dashboard'),form=root.querySelector('#marketing-filters');
  const filterPanel=root.querySelector('#marketing-filter-panel'),filterToggle=root.querySelector('#marketing-filter-toggle');
  const setFilters=value=>{ui.open[value?'add':'delete']('filters');filterPanel.hidden=!value;filterToggle.setAttribute('aria-expanded',String(value));persist();};
  const commit=()=>{if(!form.reportValidity())return;selected=Object.fromEntries(new FormData(form));persist();refresh();};
  root.querySelectorAll('[data-marketing-period]').forEach(button=>button.addEventListener('click',()=>{form.elements.period.value=button.dataset.marketingPeriod;form.querySelector('.marketing-custom-dates').hidden=true;for(const name of ['from','to'])form.elements[name].disabled=true;commit();}));
  const bindOverview=()=>{
    root.querySelector('.marketing-purchase-link')?.addEventListener('click',event=>event.stopPropagation());
    root.querySelectorAll('.marketing-kpi[data-marketing-detail]').forEach(el=>el.addEventListener('toggle',()=>{ui.open[el.open?'add':'delete'](el.dataset.marketingDetail);persist();}));
  };
  bindOverview();
  root.querySelector('#marketing-overview-unique').addEventListener('change',event=>{
    rememberMarketing();ui.overviewUnique=event.target.checked;
    root.querySelector('.marketing-kpis').innerHTML=overviewMetrics(renderedData);bindOverview();persist();
  });
  root.querySelector('#marketing-since').addEventListener('change',event=>{
    const input=event.target;
    if(!input.value){selected={...selected,period:'14'};delete selected.from;delete selected.to;persist();refresh();return;}
    if(!input.reportValidity())return;
    form.elements.period.value='since';form.elements.from.disabled=false;form.elements.from.value=input.value;form.elements.to.disabled=true;commit();
  });
  bindChartDays(root,renderedData,ui.unique);
  root.querySelector('.marketing-chart-unique').addEventListener('click',event=>event.stopPropagation());
  root.querySelector('#marketing-unique').addEventListener('change',event=>{ui.unique=event.target.checked;root.querySelector('#marketing-charts-content').innerHTML=chartContent(renderedData,ui.unique);bindChartDays(root,renderedData,ui.unique);persist();});
  filterToggle.addEventListener('click',()=>setFilters(filterPanel.hidden));
  root.querySelector('#marketing-period').addEventListener('change',e=>{const custom=e.target.value==='custom',since=e.target.value==='since';form.querySelector('.marketing-custom-dates').hidden=!(custom||since);form.elements.from.disabled=!(custom||since);form.elements.to.disabled=!custom;form.elements.to.closest('label').hidden=since;if(custom||since){setFilters(true);form.elements.from.focus();}else commit();});
  form.addEventListener('submit',e=>{e.preventDefault();commit();});
  root.querySelector('#refresh-marketing').addEventListener('click',refresh);
  const adsStatus=root.querySelector('#marketing-ads-status');
  const saveAds=async(path,input,button)=>{
    const buttons=[...root.querySelectorAll('#marketing-sync-ads,.marketing-ads-campaign button')];
    buttons.forEach(b=>b.disabled=true);adsStatus.textContent='Prebieha spracovanie…';
    try{
      const response=await fetch('/api/admin/marketing/ads/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
      const data=await response.json();if(!response.ok)throw Error(data.error||'Operácia zlyhala.');
      adsStatus.textContent=path==='sync'?'Výdavky boli importované.':'Priradenie bolo uložené.';
      ui.restore={top:window.scrollY,focus:button.id||'marketing-sync-ads'};refresh();
    }catch(error){adsStatus.textContent=error.message;buttons.forEach(b=>b.disabled=false);if(!renderedData.ads.configured)root.querySelector('#marketing-sync-ads').disabled=true;if(path==='sync')refresh();}
  };
  root.querySelector('#marketing-sync-ads')?.addEventListener('click',event=>saveAds('sync',{from:renderedData.filters.from,to:renderedData.filters.to},event.currentTarget));
  root.querySelectorAll('.marketing-ads-campaign').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();if(form.reportValidity())saveAds('campaign',{campaignId:form.dataset.campaign,utmCampaign:form.elements.utmCampaign.value},form.querySelector('button'));}));
  root.querySelector('#marketing-nav-toggle').addEventListener('click',e=>{document.querySelector('#payment-nav-toggle').click();e.currentTarget.setAttribute('aria-expanded',String(!document.body.classList.contains('payments-nav-collapsed')));});
  const logout=root.querySelector('#marketing-logout'),originalLogout=document.querySelector('#logout-button');logout.hidden=originalLogout.hidden;logout.addEventListener('click',()=>originalLogout.click());
  root.querySelectorAll('[data-marketing-reset]').forEach(button=>button.addEventListener('click',()=>{selected={period:'14'};persist();ui.restore={top:window.scrollY,focus:'marketing-filter-toggle'};refresh();}));
  root.querySelectorAll('[data-marketing-remove]').forEach(button=>button.addEventListener('click',()=>{selected={...selected,[button.dataset.marketingRemove]:''};persist();refresh();}));
  root.querySelectorAll('details[data-marketing-detail]:not(.marketing-kpi)').forEach(el=>el.addEventListener('toggle',()=>{
    ui.open[el.open?'add':'delete'](el.dataset.marketingDetail);persist();
  }));
  const updateSources=()=>{
    root.querySelector('.marketing-table-wrap tbody').innerHTML=sourceRows(lastData);
    root.querySelectorAll('[data-marketing-sort-header]').forEach(th=>{const key=th.dataset.marketingSortHeader;th.setAttribute('aria-sort',ui.sort===key?(ui.direction==='asc'?'ascending':'descending'):'none');th.querySelector('span').textContent=ui.sort===key?(ui.direction==='asc'?' ↑':' ↓'):'';});
    root.querySelector('#marketing-source-count').textContent=`${groupedSources(lastData).length} zdrojov`;
    const sort=root.querySelector('#marketing-source-sort');sort.value=ui.sort+':'+ui.direction;persist();
  };
  const lastData=renderedData;
  root.querySelector('#marketing-source-rows').addEventListener('click',event=>{
    const button=event.target.closest('[data-marketing-group]');if(!button)return;
    const key='source-'+button.dataset.marketingGroup;
    ui.open[ui.open.has(key)?'delete':'add'](key);updateSources();
    root.querySelector('#'+button.id).focus({preventScroll:true});
  });
  root.querySelectorAll('[data-marketing-sort]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.marketingSort;ui.direction=ui.sort===key&&ui.direction==='desc'?'asc':'desc';ui.sort=key;updateSources();}));
  root.querySelector('#marketing-source-sort').addEventListener('change',e=>{[ui.sort,ui.direction]=e.target.value.split(':');updateSources();});
  root.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const detail=e.target.closest('details[open]');if(detail){detail.open=false;detail.querySelector('summary').focus();}else if(filterPanel.contains(e.target)){setFilters(false);filterToggle.focus();}});
  if(ui.restore){const snapshot=ui.restore;ui.restore=null;requestAnimationFrame(()=>{(document.getElementById(snapshot.focus)||filterToggle).focus({preventScroll:true});window.scrollTo({top:snapshot.top,behavior:'instant'});});}
}
