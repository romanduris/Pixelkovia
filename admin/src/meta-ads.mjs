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
  return centsFromUnits(spendUnits(value));
}
const spendScale=10n**20n,centScale=spendScale/100n;
function spendUnits(value){
  if(typeof value!=='string'||!/^\d{1,12}(?:\.\d{1,20})?$/.test(value))throw new MetaSpendError(value);
  const [whole,fraction='']=value.split('.');
  return BigInt(whole)*spendScale+BigInt(fraction.padEnd(20,'0'));
}
function centsFromUnits(units){
  const cents=Number((units+centScale/2n)/centScale);
  if(!Number.isSafeInteger(cents))throw new HttpError(502,'Meta vrátila príliš veľkú sumu.');return cents;
}
const count=value=>typeof value==='string'&&/^\d{1,16}$/.test(value)&&Number.isSafeInteger(Number(value))?Number(value):null;
function actionCount(value,type){
  // Action lists are sparse: an omitted type/list in a successful Insights
  // response means no reported action. Malformed lists are unavailable.
  if(value===undefined)return 0;
  if(!Array.isArray(value)||value.some(r=>!r||typeof r!=='object'||typeof r.action_type!=='string'))return null;
  const rows=value.filter(r=>r?.action_type===type);
  return rows.length===0?0:rows.length===1?count(rows[0].value):null;
}
class MetaSpendError extends HttpError {
  constructor(value){
    // Describe the rejected format, never persist the provider's raw value.
    const decimal=typeof value==='string'&&/^\d{1,12}\.(\d{1,20})$/.exec(value);
    const format=decimal?decimal[1].length+' desatinných miest':value==null?'chýbajúca hodnota':typeof value==='string'?'nepodporovaný text':'typ '+typeof value;
    super(502,'Meta vrátila neplatnú sumu výdavkov ('+format+').');
  }
}
function providerError(status,error){
  const code=Number.isSafeInteger(error?.code)?error.code:null,sub=Number.isSafeInteger(error?.error_subcode)?error.error_subcode:null;
  const detail=code===190?'Token je neplatný alebo vypršal.':code===10||code===200?'Token nemá potrebné oprávnenie ads_read alebo prístup k reklamnému účtu.':[4,17,32,613].includes(code)?'Meta obmedzila počet požiadaviek; skúste neskôr.':'Overte prístup k účtu a dostupnosť Marketing API.';
  // Never persist or return raw provider messages, URLs, headers or tokens.
  const failure=new HttpError(502,`Meta API HTTP ${status}${code!==null?' · kód '+code:''}${sub!==null?' / '+sub:''}. ${detail}`);
  failure.retryable=status===429||status>=500||[4,17,32,613].includes(code)||error?.is_transient===true;
  return failure;
}
async function graphOnce(env,path,params,signal){
  const accessToken=String(env.META_ADS_ACCESS_TOKEN).trim();
  if(!/^[\x21-\x7e]+$/.test(accessToken))throw new HttpError(502,'Meta token má neplatný formát. Vložte celý token bez vnútorných medzier alebo zalomenia riadkov.');
  const url=new URL(`https://graph.facebook.com/${metaVersion}/${path}`);
  for(const [key,value]of Object.entries(params))url.searchParams.set(key,value);
  let response,data;
  try{response=await (env.META_ADS_FETCH||fetch)(url,{headers:{Authorization:'Bearer '+accessToken},redirect:'manual',signal});}
  catch{const failure=new HttpError(502,signal.aborted?'Meta API prekročilo časový limit. Skúste import znova.':'Spojenie s Meta API zlyhalo pred prijatím HTTP odpovede. Overte sieťovú dostupnosť; platnosť tokenu zatiaľ nebola potvrdená.');failure.retryable=!signal.aborted;throw failure;}
  if(response.status>=300&&response.status<400)throw new HttpError(502,`Meta API HTTP ${response.status}: presmerovanie bolo odmietnuté.`);
  try{data=await response.json();}
  catch{const failure=new HttpError(502,`Meta API HTTP ${response.status}: odpoveď nie je platný JSON. Obsah odpovede sa z bezpečnostných dôvodov nezobrazuje.`);failure.retryable=response.status===429||response.status>=500;throw failure;}
  if(!data||typeof data!=='object'||Array.isArray(data))throw new HttpError(502,`Meta API HTTP ${response.status}: neočakávaný formát JSON odpovede.`);
  if(!response.ok||data.error)throw providerError(response.status,data.error);
  return data;
}
async function graph(env,path,params,signal){
  for(let attempt=0;attempt<2;attempt++){
    try{return await graphOnce(env,path,params,signal);}
    catch(error){if(!error.retryable||attempt||signal.aborted)throw error;await waitForRetry(signal);}
  }
}

async function insights(env,from,to,days,signal){
  const rows=[],keys=new Set();let after='';
  for(let page=0;page<20;page++){
    const data=await graph(env,'act_'+metaAccount+'/insights',{fields:'account_id,account_currency,campaign_id,campaign_name,date_start,date_stop,spend,impressions,inline_link_clicks,outbound_clicks,actions',level:'campaign',time_increment:'1',time_range:JSON.stringify({since:from,until:to}),breakdowns:'publisher_platform',limit:'500',...(after?{after}:{})},signal);
    if(!Array.isArray(data.data))throw new HttpError(502,'Meta nevrátila denný prehľad výdavkov.');
    for(const r of data.data){
      if(r.account_id!==metaAccount||r.account_currency!=='EUR'||!id(r.campaign_id)||typeof r.campaign_name!=='string'||r.campaign_name.length>400||!days.includes(r.date_start)||r.date_stop!==r.date_start||typeof r.publisher_platform!=='string'||!/^\w{1,40}$/.test(r.publisher_platform))throw new HttpError(502,'Meta vrátila neplatné alebo neporovnateľné riadky výdavkov.');
      const key=[r.date_start,r.campaign_id,r.publisher_platform].join(':');
      if(keys.has(key))throw new HttpError(502,'Meta vrátila duplicitný riadok výdavkov.');keys.add(key);
      // Missing/malformed impressions must not corrupt or suppress valid costs.
      const impressions=count(r.impressions);
      rows.push({day:r.date_start,campaign:r.campaign_id,name:r.campaign_name,platform:r.publisher_platform,cents:spendCents(r.spend),amount:r.spend,impressions,linkClicks:count(r.inline_link_clicks),outboundClicks:actionCount(r.outbound_clicks,'outbound_click'),landingViews:actionCount(r.actions,'landing_page_view')});
    }
    if(rows.length>5000)throw new HttpError(502,'Prehľad je príliš veľký; vyberte kratší rozsah.');
    if(!data.paging?.next)break;
    // Rebuild the request from a cursor; never follow a token-bearing paging URL.
    const cursor=data.paging?.cursors?.after;
    if(page===19||typeof cursor!=='string'||!cursor||cursor===after||cursor.length>2000)throw new HttpError(502,'Meta nevrátila úplný prehľad; pôvodné výdavky zostali zachované.');
    after=cursor;
  }
  return rows;
}

function waitForRetry(signal){
  return new Promise((resolve,reject)=>{
    const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new HttpError(502,'Meta API prekročilo časový limit. Skúste import znova.'));};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},3000);
    signal.addEventListener('abort',abort,{once:true});
    if(signal.aborted)abort();
  });
}

// Only GETs against the pinned advertising account. No campaign mutations.
export async function syncMetaAds(env,input={},at=Date.now(),{automatic=false}={}){
  if(!env.META_ADS_ACCESS_TOKEN){if(automatic)return {skipped:true};throw new HttpError(503,'Chýba serverový secret META_ADS_ACCESS_TOKEN s oprávnením ads_read pre účet '+metaAccount+'.');}
  const today=localDate(at),from=input.from||shift(today,-29),to=input.to||today,days=dates(from,to);
  if(to>today||from<shift(today,-365))throw new HttpError(400,'Vyberte minulé alebo aktuálne dni, najviac 366 dní dozadu.');
  const db=env.TQ_DB,token=crypto.randomUUID();
  const lock=await first(db,`UPDATE meta_ads_state SET lock_token=?,lock_until=?,last_attempt_at=? WHERE id=1 AND lock_until<=? AND coalesce(last_attempt_at,0)<=CASE WHEN last_error IS NOT NULL THEN ? ELSE ? END RETURNING id`,token,at+120000,at,at,at-(automatic?600000:60000),at-(automatic?hour:60000));
  if(!lock){if(automatic)return {skipped:true};throw new HttpError(429,'Import už prebieha alebo bol spustený pred menej než minútou.');}
  try{
    const signal=AbortSignal.timeout(45000);
    const account=await graph(env,'act_'+metaAccount,{fields:'account_id,currency,timezone_name'},signal);
    if(account.account_id!==metaAccount)throw new HttpError(502,'Meta vrátila iný reklamný účet.');
    if(account.currency!=='EUR')throw new HttpError(502,'Reklamný účet musí používať EUR; prevod meny sa neodhaduje.');
    // Prague and Bratislava have identical calendar boundaries and DST rules.
    if(!['Europe/Bratislava','Europe/Prague'].includes(account.timezone_name))throw new HttpError(502,'Časové pásmo reklamného účtu nezodpovedá dňom v Bratislave.');
    let rows;
    for(let attempt=0;attempt<2;attempt++){
      try{rows=await insights(env,from,to,days,signal);break;}
      catch(error){
        // A transient malformed spend gets one fresh, fully validated read.
        // Discard every page from the rejected attempt; the timeout is shared.
        if(!(error instanceof MetaSpendError)||attempt===1||signal.aborted)throw error;
        await waitForRetry(signal);
      }
    }
    const statements=[db.prepare('DELETE FROM meta_ads_spend WHERE day>=? AND day<=?').bind(from,to)];
    for(let i=0;i<rows.length;i+=100)statements.push(db.prepare(`INSERT INTO meta_ads_spend(day,campaign_id,campaign_name,platform,spend_cents) SELECT json_extract(value,'$.day'),json_extract(value,'$.campaign'),json_extract(value,'$.name'),json_extract(value,'$.platform'),json_extract(value,'$.cents') FROM json_each(?)`).bind(JSON.stringify(rows.slice(i,i+100))));
    statements.push(db.prepare('DELETE FROM meta_ads_spend_amounts WHERE day>=? AND day<=?').bind(from,to));
    for(let i=0;i<rows.length;i+=100)statements.push(db.prepare(`INSERT INTO meta_ads_spend_amounts SELECT json_extract(value,'$.day'),json_extract(value,'$.campaign'),json_extract(value,'$.platform'),json_extract(value,'$.amount') FROM json_each(?)`).bind(JSON.stringify(rows.slice(i,i+100))));
    statements.push(db.prepare(`INSERT INTO meta_ads_days SELECT value,? FROM json_each(?) WHERE 1 ON CONFLICT(day) DO UPDATE SET synced_at=excluded.synced_at`).bind(at,JSON.stringify(days)));
    statements.push(db.prepare('DELETE FROM meta_ads_impressions WHERE day>=? AND day<=?').bind(from,to));
    for(let i=0;i<rows.length;i+=100)statements.push(db.prepare(`INSERT INTO meta_ads_impressions SELECT json_extract(value,'$.day'),json_extract(value,'$.campaign'),json_extract(value,'$.platform'),json_extract(value,'$.impressions') FROM json_each(?) WHERE json_extract(value,'$.impressions') IS NOT NULL`).bind(JSON.stringify(rows.slice(i,i+100))));
    statements.push(db.prepare(`INSERT INTO meta_ads_impression_days SELECT value,? FROM json_each(?) WHERE 1 ON CONFLICT(day) DO UPDATE SET synced_at=excluded.synced_at`).bind(rows.every(r=>r.impressions!==null)?at:null,JSON.stringify(days)));
    statements.push(db.prepare('DELETE FROM meta_ads_traffic WHERE day>=? AND day<=?').bind(from,to));
    for(let i=0;i<rows.length;i+=100)statements.push(db.prepare(`INSERT INTO meta_ads_traffic SELECT json_extract(value,'$.day'),json_extract(value,'$.campaign'),json_extract(value,'$.platform'),json_extract(value,'$.linkClicks'),json_extract(value,'$.outboundClicks'),json_extract(value,'$.landingViews') FROM json_each(?)`).bind(JSON.stringify(rows.slice(i,i+100))));
    statements.push(db.prepare(`INSERT INTO meta_ads_traffic_days SELECT value,? FROM json_each(?) WHERE 1 ON CONFLICT(day) DO UPDATE SET synced_at=excluded.synced_at`).bind(at,JSON.stringify(days)));
    statements.push(db.prepare(`UPDATE meta_ads_state SET currency='EUR',timezone=?,last_success_at=?,last_error=NULL,lock_token=NULL,lock_until=0 WHERE id=1 AND lock_token=?`).bind(account.timezone_name,at,token));
    statements.push(db.prepare('DELETE FROM meta_ads_reach WHERE last_attempt_at<? AND lock_until<=?').bind(at-90*day,at));
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
  const impressions=await first(env.TQ_DB,'SELECT 1 FROM meta_ads_impression_days WHERE synced_at IS NOT NULL LIMIT 1');
  const traffic=await first(env.TQ_DB,'SELECT 1 FROM meta_ads_traffic_days LIMIT 1');
  try{return await syncMetaAds(env,{from:shift(today,state.last_success_at&&impressions&&traffic?-6:-29),to:today},at,{automatic:true});}
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
  if(!state.last_success_at)return unavailable(state.last_error||'Výdavky ešte neboli úspešne importované.');
  if(f.device||f.product)return unavailable('Meta výdavky nemajú porovnateľné rozdelenie podľa produktu ani zariadenia. Odstráňte tieto filtre.');
  if(f.source&&!['facebook_ads','instagram_ads'].includes(f.source))return unavailable('Výdavky možno filtrovať na Facebook reklamu alebo Instagram reklamu. Tento zdroj nemá doložené reklamné náklady.');
  const days=dates(f.from,f.to),coverage=await query(db,'SELECT * FROM meta_ads_days WHERE day>=? AND day<=?',f.from,f.to);
  if(coverage.length!==days.length)return unavailable('Pre časť zvoleného obdobia chýba úspešný import. Obnovte výdavky pre toto obdobie.');
  const current=coverage.find(r=>r.day===localDate(at));
  base.ads.syncedAt=Math.min(...coverage.map(r=>r.synced_at));
  base.ads.stale=!!state.last_error||!!(current&&at-current.synced_at>2*hour);
  base.ads.warning=state.last_error||base.ads.stale&&'Dnešné výdavky sú staršie než dve hodiny. Obnovte import.'||'';
  const platform=f.source==='facebook_ads'?'facebook':f.source==='instagram_ads'?'instagram':'';
  const rows=await query(db,`SELECT s.*,p.amount,coalesce(m.utm_campaign,s.campaign_id) utm FROM meta_ads_spend s LEFT JOIN meta_ads_spend_amounts p USING(day,campaign_id,platform) LEFT JOIN meta_ads_campaigns m USING(campaign_id) WHERE s.day>=? AND s.day<=?`+(platform?' AND s.platform=?':''),f.from,f.to,...(platform?[platform]:[]));
  const selected=rows.filter(r=>!f.campaign||r.utm===f.campaign);
  if(f.campaign&&!campaigns.some(c=>c.utm===f.campaign))return unavailable('Vybraná UTM kampaň ešte nemá priradenie k importovanej Meta kampani.');
  base.costs=centsFromUnits(selected.reduce((sum,r)=>sum+(r.amount==null?BigInt(r.spend_cents)*centScale:spendUnits(r.amount)),0n));
  base.costReason='Skutočné výdavky Meta Ads v EUR podľa dňa, kampane a platformy; vybraný súčet zaokrúhlený na centy. Stav importu: '+dateLabel(base.ads.syncedAt)+' (Bratislava).'+(current?' Dnešok je priebežný; Meta môže sumy doplniť.':'')+(base.ads.stale?' Zobrazené sú posledné úspešné údaje. '+base.ads.warning:'');
  const noCAC=reason=>({...base,cacReason:reason});
  if(base.ads.stale)return noCAC('CAC čaká na aktuálny import. '+base.ads.warning);
  if(!collection.enabled||!collection.lastEventAt||f.start<collection.startedAt)return noCAC('CAC vyžaduje zber návštev počas celého porovnávaného obdobia.');
  const hasSpend=r=>r.amount==null?r.spend_cents>0:spendUnits(r.amount)>0n;
  if(selected.some(r=>hasSpend(r)&&!['facebook','instagram'].includes(r.platform)))return noCAC('Časť výdavkov patrí iným Meta platformám bez porovnateľnej návštevnej atribúcie.');
  const purchases=await query(db,attemptsCTE+` SELECT source,campaign,count(*) purchases FROM a WHERE paid=1 AND paid_at<=? AND visit_started_at>=? AND visit_started_at<? AND source IN('facebook_ads','instagram_ads')`+(f.source?' AND source=?':'')+(f.campaign?' AND campaign=?':'')+' GROUP BY source,campaign',at-600000,at-120000,at,f.start,f.end,...(f.source?[f.source]:[]),...(f.campaign?[f.campaign]:[]));
  const known=new Set(campaigns.map(c=>c.utm)),observed=await query(db,`SELECT DISTINCT source,campaign FROM marketing_visits WHERE started_at>=? AND started_at<? AND source IN('facebook_ads','instagram_ads')`+(f.source?' AND source=?':'')+(f.campaign?' AND campaign=?':''),f.start,f.end,...(f.source?[f.source]:[]),...(f.campaign?[f.campaign]:[]));
  if(observed.some(r=>!known.has(r.campaign))||selected.some(r=>!observed.some(v=>v.campaign===r.utm&&v.source===(r.platform==='facebook'?'facebook_ads':'instagram_ads'))&&hasSpend(r)))return noCAC('Chýba doložené priradenie medzi Meta kampaňami, platformami a nameranými UTM návštevami. Priraďte UTM názvy; nepomenované návštevy neodhadujeme.');
  const count=purchases.reduce((sum,r)=>sum+r.purchases,0);base.ads.attributedPurchases=count;
  if(!count)return noCAC('V porovnávanej návštevnej kohorte zatiaľ nie je priradený platený nákup.');
  base.cac=base.costs/count;
  base.cacReason='Výdavky / '+count+' priradených platených transakcií z reklamných návštev v rovnakých dňoch. Neskoršie úhrady kohorty sa dopĺňajú; darček je jedna transakcia, zdarma sa vylučuje, refundovaná platba ostáva historickým nákupom. Ide o cenu za nameraný nákup, nie overeného nového zákazníka; návštevy bez súhlasu a nepriradené nákupy chýbajú.';
  return base;
}

// Additive reporting only. Cost/CAC calculations above retain their definitions.
export async function metaImpressionsReport(env,f,costReport,at=Date.now()){
  const unavailable=reason=>({total:null,facebook:null,instagram:null,other:null,syncedAt:null,partial:false,reason});
  const scopeReason=metaScopeReason(env,f,costReport);
  if(scopeReason)return unavailable(scopeReason);
  const coverage=await query(env.TQ_DB,'SELECT day,synced_at impressions_synced_at FROM meta_ads_impression_days WHERE day>=? AND day<=?',f.from,f.to);
  if(coverage.length!==dates(f.from,f.to).length||coverage.some(r=>r.impressions_synced_at==null))return unavailable('Pre časť obdobia chýba overený import zobrazení reklamy. Obnovte Meta údaje pre zvolené obdobie.');
  const syncedAt=Math.min(...coverage.map(r=>r.impressions_synced_at));
  const stale=!!costReport.ads.error||coverage.some(r=>r.day===localDate(at)&&at-r.impressions_synced_at>2*hour);
  const platform=f.source==='facebook_ads'?'facebook':f.source==='instagram_ads'?'instagram':'';
  const rows=await query(env.TQ_DB,`SELECT i.impressions,s.platform,coalesce(m.utm_campaign,s.campaign_id) utm FROM meta_ads_spend s LEFT JOIN meta_ads_impressions i USING(day,campaign_id,platform) LEFT JOIN meta_ads_campaigns m USING(campaign_id) WHERE s.day>=? AND s.day<=?`+(platform?' AND s.platform=?':''),f.from,f.to,...(platform?[platform]:[]));
  const selected=rows.filter(r=>!f.campaign||r.utm===f.campaign);
  if(selected.some(r=>r.impressions==null))return unavailable('Meta neposkytla platný počet zobrazení pre všetky vybrané riadky. Výdavky sú vykázané samostatne.');
  const result={total:0,facebook:0,instagram:0,other:0,syncedAt,stale,partial:coverage.some(r=>r.day===localDate(at)),reason:'Zobrazenia reklamy z Meta, nie unikátni ľudia ani návštevy webu. Dnešok je priebežný; Meta môže údaje doplniť.'+(stale?' Posledné úspešné údaje; nový import sa nepodaril alebo sú staršie než dve hodiny. '+(costReport.ads.error||''):'')};
  for(const row of selected){result.total+=row.impressions;result[['facebook','instagram'].includes(row.platform)?row.platform:'other']+=row.impressions;}
  if(!Number.isSafeInteger(result.total))return unavailable('Počet zobrazení je mimo podporovaného číselného rozsahu.');
  return result;
}

export async function metaTrafficReport(env,f,costReport,at=Date.now()){
  const unavailable=reason=>({total:null,platforms:[],days:[],syncedAt:null,reason});
  const scopeReason=metaScopeReason(env,f,costReport);
  if(scopeReason)return unavailable(scopeReason);
  const coverage=await query(env.TQ_DB,'SELECT * FROM meta_ads_traffic_days WHERE day>=? AND day<=?',f.from,f.to);
  if(coverage.length!==dates(f.from,f.to).length)return unavailable('Pre časť obdobia chýba import kliknutí a LPV. Použite existujúce obnovenie Meta údajov za obdobie. Staré výdavky nepreukazujú tieto metriky.');
  const platform=f.source==='facebook_ads'?'facebook':f.source==='instagram_ads'?'instagram':'';
  const rows=(await query(env.TQ_DB,`SELECT s.*,i.impressions,t.link_clicks,t.outbound_clicks,t.landing_views,p.amount,coalesce(m.utm_campaign,s.campaign_id) utm
    FROM meta_ads_spend s LEFT JOIN meta_ads_traffic t USING(day,campaign_id,platform)
    LEFT JOIN meta_ads_impressions i USING(day,campaign_id,platform) LEFT JOIN meta_ads_spend_amounts p USING(day,campaign_id,platform)
    LEFT JOIN meta_ads_campaigns m USING(campaign_id) WHERE s.day>=? AND s.day<=?${platform?' AND s.platform=?':''}`,
    f.from,f.to,...(platform?[platform]:[]))).filter(r=>!f.campaign||r.utm===f.campaign);
  const aggregate=selected=>({
    ...Object.fromEntries(['impressions','link_clicks','outbound_clicks','landing_views'].map(k=>{
      const total=selected.reduce((n,r)=>n+(r[k]||0),0);
      return [k,selected.some(r=>r[k]==null)||!Number.isSafeInteger(total)?null:total];
    })),
    spendCents:centsFromUnits(selected.reduce((n,r)=>n+(r.amount==null?BigInt(r.spend_cents)*centScale:spendUnits(r.amount)),0n))
  });
  const labels={facebook:'Facebook',instagram:'Instagram',audience_network:'Audience Network',messenger:'Messenger',threads:'Threads'};
  const platforms=[...new Set(['facebook','instagram',...rows.map(r=>r.platform)])].filter(p=>!platform||p===platform).map(p=>({platform:p,label:labels[p]||p,...aggregate(rows.filter(r=>r.platform===p))}));
  return {total:aggregate(rows),platforms,days:dates(f.from,f.to).map(date=>({date,...aggregate(rows.filter(r=>r.day===date))})),
    syncedAt:Math.min(...coverage.map(r=>r.synced_at)),stale:!!costReport.ads.error||coverage.some(r=>r.day===localDate(at)&&at-r.synced_at>2*hour),partial:f.to===localDate(at),
    reason:'Meta Ads Insights, rovnaký denný import a predvolené atribučné nastavenia API. LPV = landing_page_view; omni_landing_page_view nepripočítavame. Akcia nevrátená v úspešnom riedkom zozname Meta znamená 0; chybná hodnota je Neznáme. Dnešok je priebežný.'};
}

function metaScopeReason(env,f,costReport){
  if(!env.META_ADS_ACCESS_TOKEN)return 'Chýba serverový prístup Meta Ads (META_ADS_ACCESS_TOKEN / ads_read).';
  if(f.device||f.product)return 'Meta nemá porovnateľné rozdelenie podľa produktu ani zariadenia. Odstráňte tieto filtre.';
  if(f.source&&!['facebook_ads','instagram_ads'].includes(f.source))return 'Meta údaje možno filtrovať na Facebook reklamu alebo Instagram reklamu.';
  if(f.campaign&&!costReport.ads.campaigns.some(c=>c.utm===f.campaign))return 'Vybraná UTM kampaň ešte nemá priradenie k importovanej Meta kampani.';
  return '';
}

export async function metaReachReport(env,f,costReport,at=Date.now()){
  const reason=metaScopeReason(env,f,costReport);
  const unavailable=reason=>({total:null,impressions:null,syncedAt:null,partial:false,stale:false,reason});
  if(reason)return unavailable(reason);
  if(f.start>at)return unavailable('Zvolené obdobie ešte nezačalo.');
  const platform=f.source==='facebook_ads'?'facebook':f.source==='instagram_ads'?'instagram':'';
  const campaigns=f.campaign?costReport.ads.campaigns.filter(c=>c.utm===f.campaign).map(c=>c.id).sort():[];
  const scope=JSON.stringify([f.from,f.to,platform,campaigns]),db=env.TQ_DB;
  await execute(db,'INSERT OR IGNORE INTO meta_ads_reach(scope) VALUES(?)',scope);
  let cached=await first(db,'SELECT * FROM meta_ads_reach WHERE scope=?',scope);
  const due=!cached.synced_at||at-cached.synced_at>=hour||costReport.ads.lastSuccessAt>cached.synced_at;
  if(due){
    const token=crypto.randomUUID();
    const lock=await first(db,`UPDATE meta_ads_reach SET lock_token=?,lock_until=?,last_attempt_at=? WHERE scope=? AND lock_until<=? AND coalesce(last_attempt_at,0)<=? RETURNING scope`,token,at+30000,at,scope,at,at-(cached.last_error?600000:60000));
    if(lock){
      try{
        const filtering=[...(platform?[{field:'publisher_platform',operator:'IN',value:[platform]}]:[]),...(campaigns.length?[{field:'campaign.id',operator:'IN',value:campaigns}]:[])];
        const data=await graph(env,'act_'+metaAccount+'/insights',{fields:'account_id,date_start,date_stop,reach,impressions',level:'account',time_range:JSON.stringify({since:f.from,until:f.to}),limit:'2',...(filtering.length?{filtering:JSON.stringify(filtering)}:{})},AbortSignal.timeout(20000));
        if(!Array.isArray(data.data)||data.data.length>1||data.paging?.next)throw new HttpError(502,'Meta nevrátila úplný súhrn Reach za obdobie.');
        const row=data.data[0];
        if(row&&(row.account_id!==metaAccount||row.date_start!==f.from||row.date_stop!==f.to||count(row.reach)==null||count(row.impressions)==null))throw new HttpError(502,'Meta vrátila neplatný alebo neporovnateľný súhrn Reach.');
        await execute(db,'UPDATE meta_ads_reach SET total=?,impressions=?,synced_at=?,last_error=NULL,lock_token=NULL,lock_until=0 WHERE scope=? AND lock_token=?',row?count(row.reach):0,row?count(row.impressions):0,at,scope,token);
      }catch(error){
        await execute(db,'UPDATE meta_ads_reach SET last_error=?,lock_token=NULL,lock_until=0 WHERE scope=? AND lock_token=?',error instanceof HttpError?error.message:'Načítanie Reach zlyhalo; posledné úspešné údaje zostali zachované.',scope,token);
      }
      cached=await first(db,'SELECT * FROM meta_ads_reach WHERE scope=?',scope);
    }
  }
  if(cached.total==null)return unavailable(cached.last_error||'Prvý import Reach práve prebieha. Údaje sa doplnia po obnovení.');
  const stale=!!cached.last_error||at-cached.synced_at>2*hour;
  return {total:cached.total,impressions:cached.impressions,syncedAt:cached.synced_at,stale,partial:f.to===localDate(at),reason:'Reach je odhadovaný počet ľudí, ktorí videli reklamu aspoň raz za celé vybrané obdobie. Meta ho deduplikuje naprieč dňami, kampaňami a platformami; denné dosahy nesčítavame. Impressions sú všetky zobrazenia reklamy z toho istého súhrnu.'+(stale?' Zobrazené sú posledné úspešné údaje. '+(cached.last_error||'Import je starší než dve hodiny.'):'')};
}

export async function metaReachBreakdownReport(env,f,costReport,at=Date.now()){
  const totalPromise=metaReachReport(env,f,costReport,at);
  if(metaScopeReason(env,f,costReport)||f.start>at)return {...await totalPromise,facebook:null,instagram:null,platformsSyncedAt:null,platformsReason:''};
  const excluded={total:0,syncedAt:null,stale:false};
  // Each platform gets its own full-period, deduplicated account query.
  // Reuse the selected-platform query rather than issuing it twice.
  const [total,facebook,instagram]=await Promise.all([
    totalPromise,
    f.source==='facebook_ads'?totalPromise:f.source?excluded:metaReachReport(env,{...f,source:'facebook_ads'},costReport,at),
    f.source==='instagram_ads'?totalPromise:f.source?excluded:metaReachReport(env,{...f,source:'instagram_ads'},costReport,at)
  ]);
  const snapshots=[total,facebook,instagram],times=snapshots.map(r=>r.syncedAt).filter(t=>t!=null);
  const platformsReason=[['FB',facebook],['IG',instagram]].filter(([,r])=>r.total==null||r.stale).map(([name,r])=>name+': '+r.reason).join(' ');
  return {...total,facebook:facebook.total,instagram:instagram.total,
    syncedAt:times.length?Math.min(...times):null,
    platformsSyncedAt:facebook.total!=null&&instagram.total!=null?Math.min(...[facebook.syncedAt,instagram.syncedAt].filter(t=>t!=null)):null,
    stale:snapshots.some(r=>r.stale)||facebook.total==null||instagram.total==null,
    platformsReason,
    reason:total.reason+' Segmenty FB a IG zobrazujú samostatné dosahy; ich šírky vyjadrujú pomer týchto hodnôt. Publikum sa prekrýva, preto ich súčet nemusí zodpovedať celkovému Reach napravo. Celok môže zahŕňať aj ďalšie Meta platformy.'+(platformsReason?' '+platformsReason:'')};
}
