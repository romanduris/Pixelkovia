const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>value==null?'Nemeriame':new Intl.NumberFormat('sk-SK',{maximumFractionDigits:1}).format(value);
const metaNum=value=>value==null?'Neznáme':num(value);
const date=value=>value?new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(value):'Neznáme';
const money=value=>value==null?'Neznáme':new Intl.NumberFormat('sk-SK',{style:'currency',currency:'EUR'}).format(value/100);
const metaHeaders='<th scope="col">Impressions</th><th scope="col">Kliknutia na odkaz</th><th scope="col">Odchodové kliknutia</th><th scope="col">Meta LPV</th><th scope="col">Výdavky</th>';
const metaCells=r=>['impressions','link_clicks','outbound_clicks','landing_views'].map(k=>`<td>${metaNum(r[k])}</td>`).join('')+`<td>${money(r.spendCents)}</td>`;

export function diagnosticsContent(d){
  const a=d.diagnostics;
  if(!a)return '<p>Diagnostika zatiaľ nie je dostupná.</p>';
  const t=a.totals,m=a.meta;
  const dimensions={source:'Zdroj návštevy',browser:'Prehliadač',os:'Operačný systém',in_app:'Interný prehliadač',device:'Typ zariadenia'};
  const environment=a.reason?`<p>${esc(a.reason)}</p>`:`<label class="marketing-diagnostic-select">Rozdelenie podľa<select id="marketing-diagnostic-dimension">${Object.entries(dimensions).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label>${Object.entries(dimensions).map(([key,label])=>`<div class="marketing-table-wrap" data-diagnostic-group="${key}"${key==='source'?'':' hidden'}><table><caption class="sr-only">${label}: návštevné relácie a pripísané nákupy</caption><thead><tr><th scope="col">${label}</th><th scope="col">Návštevy</th><th scope="col">Relácie s checkoutom</th><th scope="col">Nákupy z návštev</th></tr></thead><tbody>${a.groups[key]?.length?a.groups[key].map(r=>`<tr><th scope="row">${esc(r.label)}</th><td>${num(r.visits)}</td><td>${num(r.checkouts)}</td><td>${num(r.purchases)}</td></tr>`).join(''):'<tr><td colspan="4">Žiadne namerané relácie v tomto výbere.</td></tr>'}</tbody></table></div>`).join('')}`;
  const warnings=[...a.warnings];
  const network=m?.platforms?.find(p=>p.platform==='audience_network');
  if(network?.outbound_clicks>0)warnings.unshift(`Audience Network má ${num(network.outbound_clicks)} odchodových kliknutí z ${metaNum(m.total?.outbound_clicks)} Meta kliknutí. Tieto umiestnenia nie sú Facebook ani Instagram; interný prehliadač návštevy tým nie je dokázaný.`);
  const flow=[['Príchod na web',null],['JS spustený',t.js_started],['Interná návšteva',t.internal_recorded],['Meta PageView pokus',t.meta_attempted]];
  return `<div class="marketing-diagnostics-content">
    <p>Používa horný dátumový filter a celé dni v Bratislave. Dnešok je priebežný. Nové technické signály od ${date(a.startedAt)}, retencia 30 dní; staršie prostredie zostáva Neznáme.</p>
    <h3>Rozdelenie návštev podľa prostredia</h3>${environment}
    <p>Návštevy sú existujúce 30-minútové relácie. Checkout v tejto tabuľke je relácia, ktorá ho dosiahla; nákupy sú jej overené platené transakcie do času reportu vrátane neskorších úhrad. Jeden darčekový nákup je jedna transakcia. Browser, systém a interný prehliadač sú hrubý odhad z User-Agent / Client Hints; nerozpoznaný interný prehliadač nepotvrdzuje bežný prehliadač. Audience Network rozlišujeme iba pri novom označenom vstupe; pôvodnú finančnú atribúciu nemeníme.</p>
    <h3>Diagnostický postup návštevy</h3>
    <ol class="marketing-diagnostic-flow">${flow.map(([label,value])=>`<li><span>${label}</span><strong>${num(value)}</strong></li>`).join('')}</ol>
    <p>HTML spracované, hlásené klientom: <b>${num(t.html_loaded)}</b>. Potvrdené prijatie PageView Metou: <b>Nemeriame</b>. CAPI nie je nakonfigurované; Meta LPV nižšie je samostatná reklamná metrika.</p>
    <p>Postup počíta dokumenty predajnej stránky s doručenou diagnostikou po analytickom súhlase. Obnovenie vytvorí nový dokument, návštevná relácia môže zostať rovnaká. JS a HTML poznáme až po prijatí klientského hlásenia, preto nevidíme požiadavky bez JS ani úplné výpadky merania. Z týchto čísel nemožno vypočítať mieru stratených návštev.</p>
    <p>Voľby v doručených dokumentoch: analytika áno <b>${num(t.js_started)}</b>; marketing áno <b>${num(t.marketing_yes)}</b>, marketing nie <b>${num(t.marketing_no)}</b> (posledný hlásený stav). Dokumenty bez analytického súhlasu, vrátane samostatného marketingového súhlasu: <b>Nemeriame</b>. Odmietnutia nemožno použiť ako počet všetkých návštevníkov.</p>
    ${a.partial?'<p class="marketing-diagnostic-note">Technický postup pokrýva iba čas po nasadení v rámci posledných 30 dní. Historické chýbajúce udalosti nie sú nuly.</p>':''}
    <h3>Chyby a podozrivé rozdiely</h3>
    ${warnings.length?`<ul class="marketing-diagnostic-warnings">${warnings.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>`:'<p>Z doručených signálov nemáme upozornenie. To nepotvrdzuje bezchybný web ani doručenie Pixelu.</p>'}
    <p>Vysoký počet požiadaviek bez JS: <b>Nemeriame</b>; chýba porovnateľný serverový počet. Zlyhanie diagnostiky samotnej nemusíme zachytiť.</p>
    <h3>Porovnanie s Meta Ads</h3>
    ${m?.total?`<p>Import ${date(m.syncedAt)}${m.stale?' · staršie údaje':''}${m.partial?' · priebežné':''}. ${esc(m.reason)}</p><div class="marketing-table-wrap"><table class="marketing-diagnostic-meta"><caption class="sr-only">Meta Ads podľa platformy</caption><thead><tr><th scope="col">Platforma</th>${metaHeaders}</tr></thead><tbody>${[{label:'Meta spolu',...m.total},...m.platforms].map(r=>`<tr><th scope="row">${esc(r.label)}</th>${metaCells(r)}</tr>`).join('')}</tbody></table></div>`:`<p>${esc(m?.reason||'Meta údaje nie sú dostupné.')}</p>`}
    <p>Kliknutie nie je unikátna návšteva. Odchodové kliknutie nezaručuje načítanie stránky. Landing Page Views (LPV) sú metrika Mety; nie sú potvrdením prijatia našich jednotlivých PageView pokusov. Web a Meta používajú odlišné jednotky, súhlasy, atribúciu a oneskorenie, preto sa ich počty nemusia zhodovať.</p>
    <details class="marketing-diagnostic-days"><summary>Údaje po jednotlivých dňoch</summary><p>Technické stĺpce sú dokumenty po analytickom súhlase, Meta stĺpce sú reklamné metriky. Pre prostredie jedného dňa nastavte tento deň v hornom dátumovom filtri.</p><div class="marketing-table-wrap"><table><caption class="sr-only">Denný diagnostický postup a Meta metriky</caption><thead><tr><th scope="col">Deň</th><th scope="col">JS</th><th scope="col">Interná návšteva</th><th scope="col">PageView pokus</th>${metaHeaders}<th scope="col">Priem. TTFB / DOM / load</th></tr></thead><tbody>${a.days.map(r=>{
      const meta=m?.days?.find(day=>day.date===r.date);
      return `<tr><th scope="row">${esc(r.date)}${r.partial?' · časť':''}</th><td>${num(r.js_started)}</td><td>${num(r.internal_recorded)}</td><td>${num(r.meta_attempted)}</td>${meta?metaCells(meta):'<td colspan="5">Neznáme · bez úplného Meta importu</td>'}<td>${[r.ttfb_ms,r.dom_ms,r.load_ms].map(n=>n==null?'Neznáme':num(n)+' ms').join(' / ')}</td></tr>`;
    }).join('')}</tbody></table></div><p>Časy Navigation Timing zaokrúhľujeme na 100 ms a obmedzujeme na 120 s. TTFB je čas od začiatku navigácie po prvý bajt; DOM je DOMContentLoaded, load dokončenie načítania. Chýbajúci čas je Neznáme, nie nula.</p></details>
  </div>`;
}
