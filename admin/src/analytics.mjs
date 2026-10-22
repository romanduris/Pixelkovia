import {query,first} from './db.mjs';
import {HttpError} from './auth.mjs';
import {stages} from './game-rules.mjs';
export const median=list=>{const a=list.filter(Number.isFinite).sort((a,b)=>a-b);return a.length?a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2:null;};
const mean=list=>list.length?list.reduce((a,b)=>a+b,0)/list.length:null;
export function filters(params){
  const parse=key=>{const value=params.get(key);if(!value)return null;const timestamp=Date.parse(value);if(!Number.isFinite(timestamp))throw new HttpError(400,'Neplatný dátum filtra.');return timestamp;};
  const from=parse('from')??0,to=parse('to')??8640000000000000;
  if(from>=to)throw new HttpError(400,'Začiatok obdobia musí byť pred koncom.');
  return {from,to,product:params.get('product')||null};
}
function scope(f,alias='o',productAlias='i'){return {sql:`${alias}.created_at>=? AND ${alias}.created_at<?${f.product?` AND ${productAlias}.product_id=?`:''}`,args:[f.from,f.to,...(f.product?[f.product]:[])]};}
export async function cohort(db,f){
  const s=scope(f);
  return query(db,`SELECT e.*,c.name customer_name,c.email,p.name product_name,o.id order_id,o.created_at purchase_at FROM entitlements e JOIN customers c ON c.id=e.customer_id JOIN products p ON p.id=e.product_id JOIN order_items i ON i.id=e.order_item_id JOIN orders o ON o.id=i.order_id WHERE o.status='paid' AND ${s.sql}`, ...s.args);
}
async function runCohort(db,f){const s=scope(f);return query(db,`SELECT r.*,e.customer_id,e.product_id FROM game_runs r JOIN entitlements e ON e.id=r.entitlement_id JOIN order_items i ON i.id=e.order_item_id JOIN orders o ON o.id=i.order_id WHERE o.status='paid' AND ${s.sql}`, ...s.args);}
function byDay(values){const map=new Map();for(const value of values){if(value==null)continue;const day=new Date(value).toISOString().slice(0,10);map.set(day,(map.get(day)||0)+1);}return [...map].sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count}));}
export async function analytics(db,f){
  const runs=await runCohort(db,f),s=scope(f);
  const progress=await query(db,`SELECT sp.* FROM game_stage_progress sp JOIN game_runs r ON r.id=sp.run_id JOIN entitlements e ON e.id=r.entitlement_id JOIN order_items i ON i.id=e.order_item_id JOIN orders o ON o.id=i.order_id WHERE o.status='paid' AND ${s.sql}`,...s.args);
  return {unit:'game-runs',stages:stages.map(rule=>{
    const rows=progress.filter(p=>p.stage===rule.stage),solved=rows.filter(p=>p.completed_at!==null);
    const elapsed=solved.map(p=>p.completed_at-p.first_opened_at);
    return {stage:rule.stage,title:rule.title,started:rows.length,solved:solved.length,completionRate:rows.length?solved.length/rows.length:null,meanElapsedMs:mean(elapsed),medianElapsedMs:median(elapsed),meanActiveMs:mean(solved.map(p=>p.active_ms)),wrongAttempts:rows.reduce((s,p)=>s+p.wrong_attempts,0),meanHints:rows.length?mean(rows.map(p=>p.hints)):null,unfinished:runs.filter(r=>r.status==='active'&&r.current_stage===rule.stage).length};
  })};
}
export async function dashboard(db,f){
  const [rights,runs,analysis]=await Promise.all([cohort(db,f),runCohort(db,f),analytics(db,f)]),s=scope(f);
  const paid=await query(db,`SELECT o.id,o.created_at,o.currency,SUM(i.quantity*i.unit_price_cents) revenue FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.status='paid' AND ${s.sql} GROUP BY o.id,o.created_at,o.currency`,...s.args);
  const customerCount=await first(db,`SELECT COUNT(DISTINCT o.customer_id) count FROM orders o JOIN order_items i ON i.order_id=o.id WHERE ${s.sql}`,...s.args);
  const finished=runs.filter(r=>r.status==='completed'),times=finished.map(r=>r.completed_at-r.started_at),revenue={};
  for(const order of paid)revenue[order.currency]=(revenue[order.currency]||0)+order.revenue;
  return {metrics:{customers:customerCount.count,paidOrders:paid.length,revenueByCurrency:revenue,purchasedGames:rights.length,unactivated:rights.filter(e=>e.activated_at===null).length,activated:rights.filter(e=>e.activated_at!==null).length,playing:runs.filter(r=>r.status==='active').length,completed:finished.length,meanCompletionMs:mean(times),medianCompletionMs:median(times)},charts:{purchases:byDay(paid.map(o=>o.created_at)),activations:byDay(rights.map(e=>e.activated_at)),completions:byDay(finished.map(r=>r.completed_at))},funnel:analysis.stages.map(s=>({stage:s.stage,title:s.title,started:s.started,solved:s.solved})),cohort:'Dátum nákupu; zákazníci a oprávnenia sa počítajú samostatne, dokončenia zahŕňajú samostatné opakovania.'};
}
const statusSql=`CASE WHEN e.status='revoked' OR (e.expires_at IS NOT NULL AND e.expires_at<=?) OR (e.replay_until IS NOT NULL AND e.replay_until<=?) THEN 'expired' WHEN EXISTS(SELECT 1 FROM game_runs r WHERE r.entitlement_id=e.id AND r.status='active') THEN 'playing' WHEN e.first_completed_at IS NOT NULL THEN 'completed' WHEN EXISTS(SELECT 1 FROM checklist_progress cp WHERE cp.entitlement_id=e.id AND cp.completed=1) THEN 'preparing' WHEN o.status='paid' THEN 'purchased' ELSE 'payment-pending' END`;
export async function customers(db,params){
  if(params.get('view')==='journey')return customerJourney(db,params);
  const f=filters(params),s=scope(f),at=Date.now();
  const page=Math.max(1,Math.min(100000,Number.parseInt(params.get('page')||'1')||1)),size=20;
  const fields={customer:'name',email:'email',purchase:'purchase_at',activity:'last_activity',stage:'current_stage'};
  const sort=fields[params.get('sort')]||'purchase_at',direction=params.get('direction')==='asc'?'ASC':'DESC';
  const q=(params.get('q')||'').slice(0,200),state=params.get('state')||'';
  const conditions=[s.sql],args=[at,at,...s.args];
  if(q){conditions.push('(c.name LIKE ? OR c.email LIKE ?)');args.push('%'+q+'%','%'+q+'%');}
  const base=`SELECT c.id customer_id,c.name,c.email,p.name product,e.id entitlement_id,o.id order_id,o.status payment_status,o.created_at purchase_at,e.activated_at,${statusSql} state,COALESCE((SELECT MAX(current_stage) FROM game_runs r WHERE r.entitlement_id=e.id AND r.status='active'),(SELECT current_stage FROM game_runs r WHERE r.entitlement_id=e.id ORDER BY run_number DESC LIMIT 1)) current_stage,(SELECT MAX(last_at) FROM game_runs r WHERE r.entitlement_id=e.id) last_activity FROM customers c JOIN orders o ON o.customer_id=c.id JOIN order_items i ON i.order_id=o.id JOIN products p ON p.id=i.product_id LEFT JOIN entitlements e ON e.order_item_id=i.id WHERE ${conditions.join(' AND ')}`;
  const wrapped=`SELECT * FROM (${base}) WHERE (?='' OR state=?)`,values=[...args,state,state];
  const total=await first(db,`SELECT COUNT(*) count FROM (${wrapped})`,...values);
  const rows=await query(db,`${wrapped} ORDER BY ${sort} ${direction},order_id ASC LIMIT ? OFFSET ?`,...values,size,(page-1)*size);
  return {rows,total:total.count,page,pageSize:size};
}
export async function customerDetail(db,id){
  const customer=await first(db,'SELECT * FROM customers WHERE id=?',id);if(!customer)throw new HttpError(404,'Zákazník neexistuje.');
  const [orders,rights,visits,checks,runs,events,email]=await Promise.all([
    query(db,`SELECT o.*,i.product_id,p.name product_name,i.unit_price_cents,i.quantity FROM orders o JOIN order_items i ON i.order_id=o.id JOIN products p ON p.id=i.product_id WHERE o.customer_id=? ORDER BY o.created_at DESC`,id),
    query(db,'SELECT * FROM entitlements WHERE customer_id=?',id),
    query(db,'SELECT * FROM portal_sessions WHERE customer_id=? ORDER BY started_at',id),
    query(db,'SELECT cp.* FROM checklist_progress cp JOIN entitlements e ON e.id=cp.entitlement_id WHERE e.customer_id=?',id),
    query(db,'SELECT r.id,r.entitlement_id,r.run_number,r.status,r.current_stage,r.started_at,r.last_at,r.completed_at FROM game_runs r JOIN entitlements e ON e.id=r.entitlement_id WHERE e.customer_id=? ORDER BY r.started_at',id),
    query(db,'SELECT g.id,g.run_id,g.stage,g.type,g.occurred_at FROM game_events g JOIN game_runs r ON r.id=g.run_id JOIN entitlements e ON e.id=r.entitlement_id WHERE e.customer_id=? ORDER BY occurred_at DESC LIMIT 200',id),
    query(db,'SELECT * FROM email_events WHERE customer_id=? ORDER BY created_at DESC',id)
  ]);
  const progress=await query(db,'SELECT sp.* FROM game_stage_progress sp JOIN game_runs r ON r.id=sp.run_id JOIN entitlements e ON e.id=r.entitlement_id WHERE e.customer_id=? ORDER BY r.run_number,sp.stage',id);
  return {customer,orders,entitlements:rights,portal:{visits,count:visits.length,firstVisit:visits[0]?.started_at??null,lastVisit:visits.at(-1)?.last_at??null,returnsBeforeActivation:Math.max(0,visits.filter(v=>v.before_activation).length-1)},checklist:checks,runs:runs.map(r=>({...r,stages:stages.map(s=>({stage:s.stage,title:s.title,...progress.find(p=>p.run_id===r.id&&p.stage===s.stage)}))})),events,email};
}
export async function orders(db,params){const s=scope(filters(params));return query(db,`SELECT o.*,c.name customer_name,c.email,GROUP_CONCAT(p.name,', ') products FROM orders o JOIN customers c ON c.id=o.customer_id JOIN order_items i ON i.order_id=o.id JOIN products p ON p.id=i.product_id WHERE ${s.sql} GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`,...s.args);}

// One customer per row. Keep the original order-item API available for integrations.
export async function customerJourney(db,params){
  const f=filters(params),s=scope(f),q=(params.get('q')||'').slice(0,200);
  const rows=await query(db,`SELECT c.id customer_id,c.name,c.email,
    (SELECT MIN(o.created_at) FROM orders o JOIN order_items i ON i.order_id=o.id JOIN products p ON p.id=i.product_id WHERE o.customer_id=c.id AND o.status='paid' AND p.episode_id IN ('episode-1','bundle')) purchase_at,
    (SELECT GROUP_CONCAT(DISTINCT i.product_id) FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.customer_id=c.id AND o.status='paid') owned_products,
    e.id entitlement_id,e.status entitlement_status,e.expires_at,e.activated_at,e.first_completed_at,
    (SELECT MIN(started_at) FROM portal_sessions WHERE customer_id=c.id) portal_opened_at,
    r.id run_id,r.status run_status,r.current_stage,r.started_at,r.completed_at,r.last_at last_activity,
    EXISTS(SELECT 1 FROM checklist_progress cp WHERE cp.entitlement_id=e.id AND cp.completed=1) preparing
    FROM customers c
    LEFT JOIN entitlements e ON e.id=(SELECT e2.id FROM entitlements e2 JOIN products p ON p.id=e2.product_id JOIN order_items i ON i.id=e2.order_item_id JOIN orders o ON o.id=i.order_id WHERE e2.customer_id=c.id AND o.status='paid' AND p.episode_id IN ('episode-1','bundle') ORDER BY EXISTS(SELECT 1 FROM game_runs a WHERE a.entitlement_id=e2.id AND a.status='active') DESC,e2.granted_at DESC,e2.id LIMIT 1)
    LEFT JOIN game_runs r ON r.id=(SELECT id FROM game_runs WHERE entitlement_id=e.id ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END,started_at DESC,id LIMIT 1)
    WHERE EXISTS(SELECT 1 FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.customer_id=c.id AND ${s.sql})
    AND (c.name LIKE ? OR c.email LIKE ?)`,...s.args,'%'+q+'%','%'+q+'%');
  const now=Date.now(),extensions=['bedtime-book','piko-mission','listok-mission','kvak-mission'];
  let customers=rows.map(c=>{
    const owned=(c.owned_products||'').split(',').filter(Boolean),bundle=owned.includes('complete');
    const extensionIds=bundle?extensions:extensions.filter(id=>owned.includes(id));
    const state=c.run_status==='active'?'playing':c.first_completed_at!=null||c.run_status==='completed'?'completed':c.entitlement_status==='revoked'||(c.expires_at!=null&&c.expires_at<=now)?'expired':c.portal_opened_at!=null||c.preparing?'preparing':c.purchase_at!=null?'purchased':'payment-pending';
    return {...c,state,has_base:bundle||owned.includes('episode-1'),extension_count:extensionIds.length,extension_ids:extensionIds};
  });
  const status=params.get('state')||'',version=params.get('version')||'',portal=params.get('portal')||'';
  if(status)customers=customers.filter(c=>status==='active'?['purchased','preparing','playing'].includes(c.state):c.state===status);
  if(version)customers=customers.filter(c=>version==='base'?c.has_base&&c.extension_count===0:version==='extensions'?c.extension_count>0:version==='full'?c.extension_count===extensions.length:true);
  if(portal)customers=customers.filter(c=>portal==='opened'?c.portal_opened_at!=null:portal==='unopened'?c.portal_opened_at==null:true);
  const fields={customer:'name',purchase:'purchase_at',activity:'last_activity',stage:'current_stage'},sort=fields[params.get('sort')]||'purchase_at',direction=params.get('direction')==='asc'?1:-1;
  customers.sort((a,b)=>{
    const priority=c=>['purchased','preparing','playing'].includes(c.state)?0:c.state==='completed'?2:1;
    const group=priority(a)-priority(b);if(group)return group;
    const x=a[sort],y=b[sort];return (typeof x==='string'?x.localeCompare(y||'','sk'):Number(x||0)-Number(y||0))*direction||a.customer_id.localeCompare(b.customer_id);
  });
  const pageSize=20,total=customers.length,page=Math.max(1,Math.min(Math.ceil(total/pageSize)||1,Number.parseInt(params.get('page')||'1')||1));
  const selected=customers.slice((page-1)*pageSize,page*pageSize),runIds=selected.map(c=>c.run_id).filter(Boolean);
  const progress=runIds.length?await query(db,`SELECT * FROM game_stage_progress WHERE run_id IN (${runIds.map(()=>'?').join(',')})`,...runIds):[];
  return {rows:selected.map(c=>({...c,stages:stages.map(rule=>({stage:rule.stage,title:rule.title,...progress.find(p=>p.run_id===c.run_id&&p.stage===rule.stage)}))})),total,page,pageSize,stages:stages.map(({stage,title})=>({stage,title}))};
}
