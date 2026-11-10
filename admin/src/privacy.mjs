import {HttpError} from './auth.mjs';
import {first,hash,randomToken} from './db.mjs';
export const CONSENT_VERSION='2026-11-10';
export const META_PIXEL_ID='1120983200688486';
export const CONSENT_MS=180*86400000;
const cookieName='__Host-pixelkovia-consent';
const token=request=>request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-pixelkovia-consent=([a-f0-9]{64})(?:;|$)/)?.[1];
const publicChoice=row=>row?{version:row.version,analytics:!!row.analytics,marketing:!!row.marketing,createdAt:row.created_at,expiresAt:row.expires_at}:null;
export async function readConsent(request,env,at=Date.now()){
 const value=token(request);if(!value)return null;
 return first(env.TQ_DB,'SELECT * FROM privacy_consents WHERE id=? AND version=? AND expires_at>? AND revoked_at IS NULL',await hash(value),CONSENT_VERSION,at);
}
export async function consentState(request,env){return {choice:publicChoice(await readConsent(request,env)),pixelId:META_PIXEL_ID};}
export async function saveConsent(request,env,input,at=Date.now()){
 if(input.version!==CONSENT_VERSION||typeof input.analytics!=='boolean'||typeof input.marketing!=='boolean')throw new HttpError(400,'Vyberte platnú voľbu súhlasu.');
 const previous=token(request),before=await readConsent(request,env,at),value=randomToken(),id=await hash(value),db=env.TQ_DB;
 const marketingSince=input.marketing?(before?.marketing?before.marketing_since:at):null;
 const statements=[];
 if(previous)statements.push(db.prepare('UPDATE privacy_consents SET revoked_at=coalesce(revoked_at,?) WHERE id=?').bind(at,await hash(previous)));
 statements.push(db.prepare('INSERT INTO privacy_consents VALUES(?,?,?,?,?,?,?,NULL)').bind(id,CONSENT_VERSION,Number(input.analytics),Number(input.marketing),marketingSince,at,at+CONSENT_MS));
 await db.batch(statements);
 return {state:{choice:publicChoice({version:CONSENT_VERSION,analytics:input.analytics,marketing:input.marketing,created_at:at,expires_at:at+CONSENT_MS}),pixelId:META_PIXEL_ID},cookie:`${cookieName}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${CONSENT_MS/1000}`};
}
export async function prunePrivacy(env,at=Date.now()){
 await env.TQ_DB.prepare('DELETE FROM privacy_consents WHERE expires_at<?').bind(at-CONSENT_MS).run();
}
