import {HttpError} from './auth.mjs';
import {first} from './db.mjs';
import {readConsent} from './privacy.mjs';
import {verifiedCheckoutStatus} from './commerce.mjs';
export async function claimMetaPurchase(request,env,input){
 const consent=await readConsent(request,env);
 if(!consent?.marketing)throw new HttpError(403,'Marketingové meranie nie je povolené.');
 if(!/^cs_(?:test_|live_)[a-zA-Z0-9]{10,200}$/.test(input.sessionId||''))throw new HttpError(400,'Neplatná platobná relácia.');
 const attempt=await first(env.TQ_DB,'SELECT id,total_cents,created_at,selection FROM checkout_attempts WHERE stripe_session_id=?',input.sessionId);
 // No historic backfill, free orders or price supplied by the browser.
 if(!attempt||attempt.total_cents<=0||consent.marketing_since>attempt.created_at)return {purchase:null};
 if(await first(env.TQ_DB,'SELECT attempt_id FROM meta_pixel_purchases WHERE attempt_id=?',attempt.id))return {purchase:null};
 const verified=await verifiedCheckoutStatus(env,input.sessionId);
 if(!verified.paid||verified.state!=='paid'||verified.noPaymentRequired||verified.totalCents!==attempt.total_cents)return {purchase:null};
 // Consent may have been withdrawn while Stripe was being checked.
 const current=await readConsent(request,env);
 if(!current?.marketing||current.id!==consent.id)return {purchase:null};
 const claim=await env.TQ_DB.prepare('INSERT OR IGNORE INTO meta_pixel_purchases VALUES(?,?,?)').bind(attempt.id,consent.id,Date.now()).run();
 if(!claim.meta.changes)return {purchase:null};
 return {purchase:{eventId:'purchase-'+attempt.id,value:attempt.total_cents/100,currency:'EUR',content_ids:JSON.parse(attempt.selection),content_type:'product'}};
}
