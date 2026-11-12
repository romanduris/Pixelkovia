import {HttpError} from './auth.mjs';
import {first,query,execute} from './db.mjs';
import {localDate,midnight,safeCampaign,attemptsCTE} from './marketing-query.mjs';

export const metaAccount='1141555698571585';
export const metaVersion='v26.0';
const day=86400000,hour=3600000;
const dateLabel=at=>new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(at);
const id=value=>typeof value==='string'&&/^[0-9]{1,30}$/.test(value);
const shift=(date,days)=>new Date(Date.parse(date+'T12:00:00Z')+days*day).toISOString().slice(0,10);
function dates(from,to){
  midnight(from);midnight(to);
  if(to<from||Date.parse(to)-Date.parse(from)>365*day)throw new HttpError(400,'Import podporuje najviac 366 kalendárnych dní.');
  const days=[];for(let d=from;d<=to;d=shift(d,1))days.push(d);return days;
}
export function spendCents(value){
  if(typeof value!=='string'||!/^\d{1,12}(?:\.\d{1,2})?$/.test(value))throw new HttpError(502,'Meta vrátila neplatnú sumu výdavkov.');
  const [whole,fraction='']=value.split('.'),cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(cents))throw new HttpError(502,'Meta vrátila príliš veľkú sumu.');return cents;
}
function providerError(status,error){
  const code=Number.isSafeInteger(error?.code)?error.code:null,sub=Number.isSafeInteger(error?.error_subcode)?error.error_subcode:null;
  const detail=code===190?'Token je neplatný alebo vypršal.':code===10||code===200?'Token nemá potrebné oprávnenie ads_read alebo prístup k reklamnému účtu.':[4,17,32,613].includes(code)?'Meta obmedzila počet požiadaviek; skúste neskôr.':'Overte prístup k účtu a dostupnosť Marketing API.';
  // Never persist or return raw provider messages, URLs, headers or tokens.
  return new HttpError(502,`Meta API HTTP ${status}${code!==null?' · kód '+code:''}${sub!==null?' / '+sub:''}. ${detail}`);
}
async function graph(env,path,params,signal){
  const accessToken=String(env.META_ADS_ACCESS_TOKEN).trim();
  if(!/^[\x21-\x7e]+$/.test(accessToken))throw new HttpError(502,'Meta token má neplatný formát. Vložte celý token bez vnútorných medzier alebo zalomenia riadkov.');
  const url=new URL(`https://graph.facebook.com/${metaVersion}/${path}`);
  for(const [key,value]of Object.entries(params))url.searchParams.set(key,value);
  let response,data;
  try{response=await (env.META_ADS_FETCH||fetch)(url,{headers:{Authorization:'Bearer '+accessToken},redirect:'error',signal});}
  catch{throw new HttpError(502,signal.aborted?'Meta API prekročilo časový limit. Skúste import znova.':'Spojenie s Meta API zlyhalo pred prijatím HTTP odpovede. Overte sieťovú dostupnosť; platnosť tokenu zatiaľ nebola potvrdená.');}
  try{data=await response.json();}
  catch{throw new HttpError(502,`Meta API HTTP ${response.status}: odpoveď nie je platný JSON. Obsah odpovede sa z bezpečnostných dôvodov nezobrazuje.`);}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new HttpError(502,`Meta API HTTP ${response.status}: neočakávaný formát JSON odpovede.`);
  if(!response.ok||data.error)throw providerError(response.status,data.error);
  return data;
}

// Only GETs against the pinned advertising account. No campaign mutations.
export async function syncMetaAds(env,input={},at=Date.now(),{automatic=false}={}){
  if(!env.META_ADS_ACCESS_TOKEN){if(automatic)return {skipped:true};throw new HttpError(503,'Chýba serverový secret META_ADS_ACCESS_TOKEN s oprávnením ads_read pre účet '+metaAccount+'.');}
  const today=localDate(at),from=input.from||shift(today,-29),to=input.to||today,days=dates(from,to);
  if(to>today||from<shift(today,-365))throw new HttpError(400,'Vyberte minulé alebo aktuálne dni, najviac 366 dní dozadu.');
  const db=env.TQ_DB,token=crypto.randomUUID();
  const lock=await first(db,`UPDATE meta_ads_state SET lock_token=?,lock_until=?,last_attempt_at=? WHERE id=1 AND lock_until<=? AND coalesce(last_attempt_at,0)<=? RETURNING id`,token,at+120000,at,at,at-(automatic?hour:60000));
  if(!lock){if(automatic)return {skipped:true};throw new HttpError(429,'Import už prebieha alebo bol spustený pred menej než minútou.');}
  try{
    const signal=AbortSignal.timeout(45000);
    const account=await graph(env,'act_'+metaAccount,{fields:'account_id,currency,timezone_name'},signal);
    if(account.account_id!==metaAccount)throw new HttpError(502,'Meta vrátila iný reklamný účet.');
    if(account.currency!=='EUR')throw new HttpError(502,'Reklamný účet musí používať EUR; prevod meny sa neodhaduje.');
    // Prague and Bratislava have identical calendar boundaries and DST rules.
    if(!['Europe/Bratislava','Europe/Prague'].includes(account.timezone_name))throw new HttpError(502,'Časové pásmo reklamného účtu nezodpovedá dňom v Bratislave.');
    const rows=[],keys=new Set();let after='';
    for(let page=0;page<20;page++){
      const data=await graph(env,'act_'+metaAccount+'/insights',{fields:'account_id,account_currency,campaign_id,campaign_name,date_start,date_stop,spend',level:'campaign',time_increment:'1',time_range:JSON.stringify({since:from,until:to}),breakdowns:'publisher_platform',limit:'500',...(after?{after}:{})},signal);
      if(!Array.isArray(data.data))throw new HttpError(502,'Meta nevrátila denný prehľad výdavkov.');
      for(const r of data.data){
        if(r.account_id!==metaAccount||r.account_currency!=='EUR'||!id(r.campaign_id)||typeof r.campaign_name!=='string'||r.campaign_name.length>400||!days.includes(r.date_start)||r.date_stop!==r.date_start||typeof r.publisher_platform!=='string'||!/^\w{1,40}$/.test(r.publisher_platform))throw new HttpError(502,'Meta vrátila neplatné alebo neporovnateľné riadky výdavkov.');
        const key=[r.date_start,r.campaign_id,r.publisher_platform].join(':');
        if(keys.has(key))throw new HttpError(502,'Meta vrátila duplicitný riadok výdavkov.');keys.add(key);
        rows.push({day:r.date_start,campaign:r.campaign_id,name:r.campaign_name,platform:r.publisher_platform,cents:spendCents(r.spend)});
      }
      if(rows.length>5000)throw new HttpError(502,'Prehľad je príliš veľký; vyberte kratší rozsah.');
      if(!data.paging?.next)break;
      // Rebuild the request from a cursor; never follow a token-bearing paging URL.
      const cursor=data.paging?.cursors?.after;
      if(page===19||typeof cursor!=='string'||!cursor||cursor===after||cursor.length>2000)throw new HttpError(502,'Meta nevrátila úplný prehľad; pôvodné výdavky zostali zachované.');
      after=cursor;
    }
    const statements=[db.prepare('DELETE FROM meta_ads_spend WHERE day>=? AND day<=?').bind(from,to)];
    for(let i=0;i<rows.length;i+=100)statements.push(db.prepare(`INSERT INTO meta_ads_spend SELECT json_extract(value,'$.day'),json_extract(value,'$.campaign'),json_extract(value,'$.name'),json_extract(value,'$.platform'),json_extract(value,'$.cents') FROM json_each(?)`).bind(JSON.stringify(rows.slice(i,i+100))));
    statements.push(db.prepare(`INSERT INTO meta_ads_days SELECT value,? FROM json_each(?) WHERE 1 ON CONFLICT(day) DO UPDATE SET synced_at=excluded.synced_at`).bind(at,JSON.stringify(days)));
    statements.push(db.prepare(`UPDATE meta_ads_state SET currency='EUR',timezone=?,last_success_at=?,last_error=NULL,lock_token=NULL,lock_until=0 WHERE id=1 AND lock_token=?`).bind(account.timezone_name,at,token));
    // Complete range replacement and coverage are a single D1 transaction.
    await db.batch(statements);
    return {imported:true,from,to,rows:rows.length,syncedAt:at};
  }catch(error){
    const message=error instanceof HttpError?error.message:'Import výdavkov zlyhal; posledné úspešné dáta zostali zachované.';
    await execute(db,'UPDATE meta_ads_state SET last_error=?,lock_token=NULL,lock_until=0 WHERE id=1 AND lock_token=?',message,token);
    throw new HttpError(error instanceof HttpError?error.status:502,message);
  }
}
export async function scheduledMetaAds(env,at=Date.now()){
  if(!env.META_ADS_ACCESS_TOKEN)return {skipped:true};
  const today=localDate(at);
  const state=await first(env.TQ_DB,'SELECT last_success_at FROM meta_ads_state WHERE id=1');
  try{return await syncMetaAds(env,{from:shift(today,state.last_success_at?-6:-29),to:today},at,{automatic:true});}
  catch{return {failed:true};} // The sanitized failure is visible in the admin report.
}
export async function saveMetaCampaign(env,input){
  if(!id(input.campaignId)||typeof input.utmCampaign!=='string'||input.utmCampaign&&safeCampaign(input.utmCampaign)!==input.utmCampaign)throw new HttpError(400,'Vyberte platné ID kampane a UTM názov bez osobných údajov (najviac 80 znakov).');
  if(!await first(env.TQ_DB,'SELECT 1 FROM meta_ads_spend WHERE campaign_id=? LIMIT 1',input.campaignId))throw new HttpError(400,'Kampaň ešte nebola importovaná z Meta.');
  if(input.utmCampaign)await execute(env.TQ_DB,'INSERT INTO meta_ads_campaigns VALUES(?,?) ON CONFLICT(campaign_id) DO UPDATE SET utm_campaign=excluded.utm_campaign',input.campaignId,input.utmCampaign);
  else await execute(env.TQ_DB,'DELETE FROM meta_ads_campaigns WHERE campaign_id=?',input.campaignId);
  return {saved:true};
}

export async function metaAdsReport(env,f,collection,at=Date.now()){
  const db=env.TQ_DB,state=await first(db,'SELECT * FROM meta_ads_state WHERE id=1');
  const campaigns=await query(db,`SELECT s.campaign_id id,max(s.campaign_name) name,coalesce(m.utm_campaign,s.campaign_id) utm FROM meta_ads_spend s LEFT JOIN meta_ads_campaigns m USING(campaign_id) GROUP BY s.campaign_id ORDER BY s.campaign_id`);
  const base={costs:null,cac:null,costReason:'',cacReason:'',ads:{configured:!!env.META_ADS_ACCESS_TOKEN,accountId:metaAccount,lastSuccessAt:state.last_success_at,lastAttemptAt:state.last_attempt_at,error:state.last_error,campaigns,attributedPurchases:null}};
  const unavailable=reason=>({...base,costReason:reason,cacReason:reason});
  if(!env.META_ADS_ACCESS_TOKEN)return unavailable('Chýba serverový prístup Meta Ads (META_ADS_ACCESS_TOKEN / ads_read).');
  if(state.last_error)return unavailable(state.last_error+' Posledný úspešný import: '+(state.last_success_at?dateLabel(state.last_success_at):'zatiaľ žiadny')+'.');
  if(!state.last_success_at)return unavailable('Výdavky ešte neboli úspešne importované.');
  if(f.device||f.product)return unavailable('Meta výdavky nemajú porovnateľné rozdelenie podľa produktu ani zariadenia. Odstráňte tieto filtre.');
  if(f.source&&!['facebook_ads','instagram_ads'].includes(f.source))return unavailable('Výdavky možno filtrovať na Facebook reklamu alebo Instagram reklamu. Tento zdroj nemá doložené reklamné náklady.');
  const days=dates(f.from,f.to),coverage=await query(db,'SELECT * FROM meta_ads_days WHERE day>=? AND day<=?',f.from,f.to);
  if(coverage.length!==days.length)return unavailable('Pre časť zvoleného obdobia chýba úspešný import. Obnovte výdavky pre toto obdobie.');
  const current=coverage.find(r=>r.day===localDate(at));
  if(current&&at-current.synced_at>2*hour)return unavailable('Dnešné výdavky sú staršie než dve hodiny. Obnovte import.');
  const platform=f.source==='facebook_ads'?'facebook':f.source==='instagram_ads'?'instagram':'';
  const rows=await query(db,`SELECT s.*,coalesce(m.utm_campaign,s.campaign_id) utm FROM meta_ads_spend s LEFT JOIN meta_ads_campaigns m USING(campaign_id) WHERE s.day>=? AND s.day<=?`+(platform?' AND s.platform=?':''),f.from,f.to,...(platform?[platform]:[]));
  const selected=rows.filter(r=>!f.campaign||r.utm===f.campaign);
  if(f.campaign&&!campaigns.some(c=>c.utm===f.campaign))return unavailable('Vybraná UTM kampaň ešte nemá priradenie k importovanej Meta kampani.');
  base.costs=selected.reduce((sum,r)=>sum+r.spend_cents,0);
  base.costReason='Skutočné výdavky Meta Ads v EUR podľa dňa, kampane a platformy. Stav importu: '+dateLabel(Math.min(...coverage.map(r=>r.synced_at)))+' (Bratislava).'+(current?' Dnešok je priebežný; Meta môže sumy doplniť.':'');
  const noCAC=reason=>({...base,cacReason:reason});
  if(!collection.enabled||!collection.lastEventAt||f.start<collection.startedAt)return noCAC('CAC vyžaduje zber návštev počas celého porovnávaného obdobia.');
  if(selected.some(r=>r.spend_cents>0&&!['facebook','instagram'].includes(r.platform)))return noCAC('Časť výdavkov patrí iným Meta platformám bez porovnateľnej návštevnej atribúcie.');
  const purchases=await query(db,attemptsCTE+` SELECT source,campaign,count(*) purchases FROM a WHERE paid=1 AND paid_at<=? AND visit_started_at>=? AND visit_started_at<? AND source IN('facebook_ads','instagram_ads')`+(f.source?' AND source=?':'')+(f.campaign?' AND campaign=?':'')+' GROUP BY source,campaign',at-600000,at-120000,at,f.start,f.end,...(f.source?[f.source]:[]),...(f.campaign?[f.campaign]:[]));
  const known=new Set(campaigns.map(c=>c.utm)),observed=await query(db,`SELECT DISTINCT source,campaign FROM marketing_visits WHERE started_at>=? AND started_at<? AND source IN('facebook_ads','instagram_ads')`+(f.source?' AND source=?':'')+(f.campaign?' AND campaign=?':''),f.start,f.end,...(f.source?[f.source]:[]),...(f.campaign?[f.campaign]:[]));
  if(observed.some(r=>!known.has(r.campaign))||selected.some(r=>!observed.some(v=>v.campaign===r.utm&&v.source===(r.platform==='facebook'?'facebook_ads':'instagram_ads'))&&r.spend_cents>0))return noCAC('Chýba doložené priradenie medzi Meta kampaňami, platformami a nameranými UTM návštevami. Priraďte UTM názvy; nepomenované návštevy neodhadujeme.');
  const count=purchases.reduce((sum,r)=>sum+r.purchases,0);base.ads.attributedPurchases=count;
  if(!count)return noCAC('V porovnávanej návštevnej kohorte zatiaľ nie je priradený platený nákup.');
  base.cac=base.costs/count;
  base.cacReason='Výdavky / '+count+' priradených platených transakcií z reklamných návštev v rovnakých dňoch. Neskoršie úhrady kohorty sa dopĺňajú; darček je jedna transakcia, zdarma sa vylučuje, refundovaná platba ostáva historickým nákupom. Ide o cenu za nameraný nákup, nie overeného nového zákazníka; návštevy bez súhlasu a nepriradené nákupy chýbajú.';
  return base;
}
