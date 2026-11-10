import test from 'node:test';
import assert from 'node:assert/strict';
import {groupedSources} from '../public/marketing.js';
import {groupChartDay} from '../public/marketing-charts.js';
const row=(source,visits,purchases,periodPurchases)=>({source,label:source,visits,purchases,periodPurchases,conversion:visits?purchases/visits:null});
test('social parents sum disjoint sources and calculate weighted conversion, hiding influencer only in the table',()=>{
 const rows=[row('facebook_ads',4,2,3),row('facebook',6,1,2),row('instagram_ads',1,0,0),row('instagram',2,1,2),row('meta',1,0,0),row('influencer',9,4,5),row('unknown',2,0,1)];
 const grouped=groupedSources({rows,conversionReason:null});
 assert.equal(grouped.length,3);assert.ok(!grouped.some(r=>r.source==='influencer'));
 const facebook=grouped.find(r=>r.group==='facebook');assert.equal(facebook.visits,10);assert.equal(facebook.purchases,3);assert.equal(facebook.conversion,.3);assert.equal(facebook.periodPurchases,5);assert.deepEqual(facebook.children.map(r=>r.source),['facebook_ads','facebook']);
 const instagram=grouped.find(r=>r.group==='instagram');assert.equal(instagram.visits,3);assert.equal(instagram.purchases,1);assert.equal(instagram.conversion,1/3);
 assert.equal(rows.length,7);assert.equal(rows.find(r=>r.source==='influencer').visits,9);
});
test('three chart categories retain totals and disjoint daily unique counts, including Meta and other sources',()=>{
 const sources=['facebook_ads','facebook','instagram_ads','instagram','meta','direct','unknown','organic','influencer'];
 const visits=[4,3,2,1,5,2,1,1,2],unique=[2,0,1,0,1,0,0,0,1];
 const raw={date:'2026-11-10',visits:21,uniqueVisitors:5,partial:true,sources:sources.map((source,i)=>({source,visits:visits[i],uniqueVisitors:unique[i]}))};
 const grouped=groupChartDay(raw);
 assert.deepEqual(grouped.sources.map(r=>[r.label,r.visits,r.uniqueVisitors]),[['Facebook',7,2],['Instagram',3,1],['Others',11,2]]);
 assert.equal(grouped.visits,21);assert.equal(grouped.uniqueVisitors,5);assert.equal(grouped.partial,true);assert.equal(raw.sources.length,9);
 const unavailable=groupChartDay({...raw,visits:null,uniqueVisitors:null});assert.ok(unavailable.sources.every(r=>r.visits===null&&r.uniqueVisitors===null));
 const filtered=groupChartDay({...raw,visits:5,uniqueVisitors:1,sources:[raw.sources[4]]});assert.deepEqual(filtered.sources.map(r=>r.visits),[0,0,5]);
});
test('social groups retain unavailable metrics and include only sources returned by active filters',()=>{
 const unavailable=groupedSources({rows:[row('facebook_ads',null,null,2),row('facebook',null,null,1)],conversionReason:'Unavailable'})[0];
 assert.equal(unavailable.visits,null);assert.equal(unavailable.purchases,null);assert.equal(unavailable.conversion,null);assert.equal(unavailable.periodPurchases,3);
 const filtered=groupedSources({rows:[row('instagram_ads',5,2,4)],conversionReason:null});
 assert.equal(filtered.length,1);assert.equal(filtered[0].children.length,1);assert.equal(filtered[0].visits,5);assert.equal(filtered[0].conversion,.4);
 const disabled=groupedSources({rows:[row('facebook',5,2,4)],conversionReason:'Disabled'});assert.equal(disabled[0].conversion,null);
 const empty=groupedSources({rows:[row('facebook',0,0,0)],conversionReason:null});assert.equal(empty[0].conversion,null);
});
test('additional sources include Meta and preserve filtered and unavailable metrics',()=>{
 const rows=[row('direct',2,1,2),row('unknown',3,2,4),row('organic',5,1,1),row('meta',7,2,3)];
 const grouped=groupedSources({rows,conversionReason:null}),other=grouped.find(r=>r.group==='other');
 assert.equal(other.label,'Others');assert.equal(other.visits,17);assert.equal(other.purchases,6);assert.equal(other.periodPurchases,10);assert.equal(other.conversion,6/17);
 assert.deepEqual(other.children.map(r=>r.source),['meta','direct','unknown','organic']);assert.equal(grouped.length,1);assert.ok(!grouped.some(r=>r.source==='meta'));
 const filtered=groupedSources({rows:[rows[2]],conversionReason:null});assert.equal(filtered[0].children.length,1);assert.equal(filtered[0].visits,5);
 const unavailable=groupedSources({rows:[row('direct',null,null,1),rows[1]],conversionReason:'Unavailable'})[0];
 assert.equal(unavailable.visits,null);assert.equal(unavailable.purchases,null);assert.equal(unavailable.conversion,null);assert.equal(unavailable.periodPurchases,5);
});
