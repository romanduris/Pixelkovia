import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
const script=fs.readFileSync(new URL('../funnel-metrics.js',import.meta.url),'utf8');
function collector({path='/',referrer='',allowed=true}={}){
 const events=[],store=new Map(),local=new Map(),listeners={};
 const storage=map=>({getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)});
 const context={URL,URLSearchParams,Date,crypto:webcrypto,AbortSignal,navigator:{userAgent:'Desktop'},location:new URL('https://pixelkovia.rodulab.com'+path),sessionStorage:storage(store),localStorage:storage(local),setTimeout,
  document:{referrer,addEventListener:(type,fn)=>listeners[type]=fn},fetch:async(url,options)=>{events.push(JSON.parse(options.body));return {ok:true};},window:{PixelkoviaConsent:{allows:()=>allowed,pending:false,ready:new Promise(()=>{})}}};
 vm.runInNewContext(script,context);
 return {events,store,local,context,grant(){allowed=true;listeners['pixelkovia:consent']();}};
}
test('social sources distinguish tagged ads, ordinary referrals and unknown origins without guessing from fbclid',()=>{
 const cases=[
  ['/', 'https://www.facebook.com/', 'facebook'],['/', 'https://l.facebook.com/l.php?u=DO_NOT_STORE', 'facebook'],['/', 'https://lm.facebook.com/', 'facebook'],['/', 'https://m.facebook.com/', 'facebook'],['/', 'https://fb.com/', 'facebook'],
  ['/', 'https://l.instagram.com/', 'instagram'],['/', 'https://www.instagram.com/', 'instagram'],
  ['/?utm_source=facebook&utm_medium=paid_social', '', 'facebook_ads'],['/?utm_source=FB&utm_medium=CPC','https://instagram.com/','facebook_ads'],
  ['/?utm_source=ig&utm_medium=paid_social', 'https://facebook.com/','instagram_ads'],['/?utm_source=meta&utm_medium=paid_social', 'https://facebook.com/','meta'],
  ['/?utm_source=facebook&utm_medium=social', '', 'facebook'],['/?utm_campaign=campaign-only', 'https://facebook.com/', 'facebook'],['/?utm_medium=paid_social', 'https://facebook.com/', 'facebook_ads'],
  ['/?fbclid=DO_NOT_STORE', 'https://facebook.com/', 'facebook'],['/?fbclid=DO_NOT_STORE', '', 'unknown'],
  ['/?utm_source=newsletter', 'https://facebook.com/', 'unknown'],['/?utm_medium=email', 'https://facebook.com/', 'unknown'],
  ['/', 'https://facebook.com.attacker.invalid/', 'unknown'],['/', 'https://notfacebook.com/', 'unknown'],['/', 'https://facebook.com@attacker.invalid/', 'unknown'],['/', 'https://instagram.com.attacker.invalid/', 'unknown'],
  ['/', 'https://pixelkovia.rodulab.com/checkout', 'unknown'],['/', '', 'direct'],['/', 'https://www.google.com/', 'organic'],['/', 'not a URL', 'unknown']
 ];
 for(const [path,referrer,source] of cases){const c=collector({path,referrer});assert.equal(c.events[0].source,source,path+' ref='+referrer);assert.equal(c.events[0].campaign,path.includes('campaign-only')?'campaign-only':'');assert.ok(!JSON.stringify([...c.store.values(),...c.local.values(),c.events]).includes('DO_NOT_STORE'));}
});
test('referral classification waits for consent, retains first touch through checkout and does not store raw referrers',()=>{
 const c=collector({referrer:'https://l.facebook.com/?private=DO_NOT_STORE',allowed:false});
 assert.equal(c.events.length,0);assert.equal(c.store.size,0);assert.equal(c.local.size,0);
 c.grant();assert.equal(c.events[0].source,'facebook');const first=c.events[0];
 c.context.location=new URL('https://pixelkovia.rodulab.com/checkout');
 c.context.document.referrer='https://pixelkovia.rodulab.com/';
 // The existing session is restored by the next page's real collector.
 vm.runInNewContext(script,c.context);
 const next=c.events.at(-1);assert.equal(next.source,'facebook');assert.equal(next.type,'checkout');assert.equal(next.visitId,first.visitId);assert.equal(next.visitorId,first.visitorId);
 assert.ok(!JSON.stringify([...c.store.values(),...c.local.values(),c.events]).includes('DO_NOT_STORE'));
});
test('a different social acquisition starts a new visit without relabelling the previous one or losing checkout continuity',()=>{
 const c=collector({path:'/?utm_source=unrecognized'}),first=c.events[0];assert.equal(first.source,'unknown');
 c.context.location=new URL('https://pixelkovia.rodulab.com/');c.context.document.referrer='https://l.facebook.com/';vm.runInNewContext(script,c.context);
 const facebook=c.events.at(-1);assert.equal(facebook.source,'facebook');assert.notEqual(facebook.visitId,first.visitId);
 c.context.location=new URL('https://pixelkovia.rodulab.com/?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch-2026');vm.runInNewContext(script,c.context);
 const ad=c.events.at(-1);assert.equal(ad.source,'facebook_ads');assert.notEqual(ad.visitId,facebook.visitId);assert.equal(first.source,'unknown');assert.equal(facebook.source,'facebook');
 vm.runInNewContext(script,c.context);assert.equal(c.events.at(-1).visitId,ad.visitId,'reload keeps the acquisition');
 c.context.location=new URL('https://pixelkovia.rodulab.com/checkout');c.context.document.referrer='https://pixelkovia.rodulab.com/';vm.runInNewContext(script,c.context);assert.equal(c.events.at(-1).visitId,ad.visitId);assert.equal(c.events.at(-1).source,'facebook_ads');
});
