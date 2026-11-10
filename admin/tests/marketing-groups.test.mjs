import test from 'node:test';
import assert from 'node:assert/strict';
import {groupedSources} from '../public/marketing.js';
const row=(source,visits,purchases,periodPurchases)=>({source,label:source,visits,purchases,periodPurchases,conversion:visits?purchases/visits:null});
test('social parents sum disjoint sources and calculate weighted conversion, hiding influencer only in the table',()=>{
 const rows=[row('facebook_ads',4,2,3),row('facebook',6,1,2),row('instagram_ads',1,0,0),row('instagram',2,1,2),row('meta',1,0,0),row('influencer',9,4,5),row('unknown',2,0,1)];
 const grouped=groupedSources({rows,conversionReason:null});
 assert.equal(grouped.length,4);assert.ok(!grouped.some(r=>r.source==='influencer'));
 const facebook=grouped.find(r=>r.group==='facebook');assert.equal(facebook.visits,10);assert.equal(facebook.purchases,3);assert.equal(facebook.conversion,.3);assert.equal(facebook.periodPurchases,5);assert.deepEqual(facebook.children.map(r=>r.source),['facebook_ads','facebook']);
 const instagram=grouped.find(r=>r.group==='instagram');assert.equal(instagram.visits,3);assert.equal(instagram.purchases,1);assert.equal(instagram.conversion,1/3);
 assert.equal(rows.length,7);assert.equal(rows.find(r=>r.source==='influencer').visits,9);
});
test('social groups retain unavailable metrics and include only sources returned by active filters',()=>{
 const unavailable=groupedSources({rows:[row('facebook_ads',null,null,2),row('facebook',null,null,1)],conversionReason:'Unavailable'})[0];
 assert.equal(unavailable.visits,null);assert.equal(unavailable.purchases,null);assert.equal(unavailable.conversion,null);assert.equal(unavailable.periodPurchases,3);
 const filtered=groupedSources({rows:[row('instagram_ads',5,2,4)],conversionReason:null});
 assert.equal(filtered.length,1);assert.equal(filtered[0].children.length,1);assert.equal(filtered[0].visits,5);assert.equal(filtered[0].conversion,.4);
 const disabled=groupedSources({rows:[row('facebook',5,2,4)],conversionReason:'Disabled'});assert.equal(disabled[0].conversion,null);
 const empty=groupedSources({rows:[row('facebook',0,0,0)],conversionReason:null});assert.equal(empty[0].conversion,null);
});
