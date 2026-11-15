import {HttpError} from './auth.mjs';
import {first,query,execute,statement} from './db.mjs';

const address=value=>typeof value==='string'&&value.length<=254&&/^[^\s<>@,;\x00-\x1f\x7f]+@[^\s<>@,;\x00-\x1f\x7f]+\.[^\s<>@,;\x00-\x1f\x7f]+$/.test(value);
const configured=env=>!!env.RESEND_API_KEY&&env.MAIL_DOMAIN_VERIFIED==='true'&&address(env.SUPPORT_FORWARD_TO);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function orderNotificationEmail(row){
  const total=new Intl.NumberFormat('sk-SK',{style:'currency',currency:row.currency}).format(row.total_cents/100);
  const time=new Intl.DateTimeFormat('sk-SK',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Bratislava'}).format(row.paid_at);
  const link='https://pixelkovia.rodulab.com/admin#analytics'+(row.attempt_id?'?'+new URLSearchParams({attempt:row.attempt_id}):'');
  const note=row.kind==='gift'?'Je to druhá hra na preposlanie ďalšej rodine.':'Ďalšie dobrodružstvo sa môže začať.';
  return {
    subject:'🎉 Mám skvelé správy! Nová objednávka za '+total,
    text:`Mám skvelé správy! 🎉\n\nPráve prišla nová objednávka za ${total}.\nOd: ${row.email}\nKedy: ${time} (Bratislava)\n${note}\n\nPozrieť v hernej analýze: ${link}\n\nTeším sa s tebou!\nPixi · Pixelkovia\n\nUpozornenia vypneš políčkom Notification v administrácii.`,
    html:`<!doctype html><html lang="sk"><body style="margin:0;background:#eff5f3;color:#183e38;font-family:Arial,sans-serif"><table role="presentation" style="width:100%;padding:28px 12px"><tr><td align="center"><table role="presentation" style="width:100%;max-width:500px;background:#fff;border-radius:20px;padding:30px"><tr><td><p style="margin:0 0 20px;color:#357264;font-size:13px;letter-spacing:1px">PIXI · PIXELKOVIA</p><p style="font-size:36px;margin:0">🎉</p><h1 style="font-size:27px;line-height:1.25;margin:12px 0">Mám skvelé správy!</h1><p style="line-height:1.6">Práve prišla nová objednávka.<br>${esc(note)}</p><table role="presentation" style="width:100%;background:#edf7f1;border-radius:12px;padding:18px"><tr><td><strong style="font-size:32px">${esc(total)}</strong><p style="margin:12px 0 6px;font-size:14px;overflow-wrap:anywhere">Od: <strong>${esc(row.email)}</strong></p><p style="margin:0;font-size:13px;color:#4e6a61">${esc(time)} · Bratislava</p></td></tr></table><p style="margin:24px 0"><a href="${esc(link)}" style="display:inline-block;background:#216853;color:white;text-decoration:none;padding:14px 20px;border-radius:9px;font-weight:bold">Pozrieť v hernej analýze →</a></p><p style="line-height:1.6;margin-bottom:0">Teším sa s tebou!<br><strong>Pixi</strong></p><p style="font-size:11px;line-height:1.6;color:#6a7e76;margin:24px 0 0">Upozornenia vypneš políčkom Notification v administrácii.</p></td></tr></table></td></tr></table></body></html>`
  };
}

export async function orderNotificationSettings(env){
  const row=await first(env.TQ_DB,'SELECT enabled FROM order_notification_settings WHERE id=1');
  return {enabled:!!row?.enabled,configured:configured(env)};
}
export async function saveOrderNotificationSettings(env,input){
  if(typeof input.enabled!=='boolean')throw new HttpError(400,'Vyberte zapnutie alebo vypnutie upozornení.');
  if(input.enabled&&!configured(env))throw new HttpError(503,'Odosielanie upozornení e-mailom nie je nakonfigurované.');
  await env.TQ_DB.batch([
    statement(env.TQ_DB,'UPDATE order_notification_settings SET enabled=? WHERE id=1',input.enabled?1:0),
    statement(env.TQ_DB,"UPDATE order_notifications SET status='skipped' WHERE status='queued' AND ?=0",input.enabled?1:0)
  ]);
  return orderNotificationSettings(env);
}
export function queueOrderNotification(db,orderId,at){
  return statement(db,`INSERT INTO order_notifications(order_id,created_at)
    SELECT ?,? WHERE EXISTS(SELECT 1 FROM order_notification_settings WHERE id=1 AND enabled=1)
    AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status='paid')`,orderId,at,orderId);
}
export async function sendOrderNotifications(env){
  if(!configured(env)||(await orderNotificationSettings(env)).enabled!==true)return;
  const db=env.TQ_DB,at=Date.now();
  const rows=await query(db,`SELECT n.order_id,o.total_cents,o.currency,o.paid_at,c.email,co.kind,co.attempt_id
    FROM order_notifications n JOIN orders o ON o.id=n.order_id JOIN customers c ON c.id=o.customer_id LEFT JOIN checkout_orders co ON co.order_id=o.id
    WHERE n.status='queued' AND o.status='paid' AND (n.last_attempt_at IS NULL OR n.last_attempt_at<?)
    ORDER BY n.created_at,n.order_id LIMIT 20`,at-600000);
  for(const row of rows){
    const claim=await execute(db,`UPDATE order_notifications SET last_attempt_at=? WHERE order_id=? AND status='queued'
      AND (last_attempt_at IS NULL OR last_attempt_at<?)
      AND EXISTS(SELECT 1 FROM order_notification_settings WHERE id=1 AND enabled=1)
      AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status='paid')`,at,row.order_id,at-600000,row.order_id);
    if(!claim.meta.changes)continue;
    try{
      const response=await fetch('https://api.resend.com/emails',{
        method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'order-notification/'+row.order_id},
        body:JSON.stringify({from:'Pixi · Pixelkovia <Pixi@pixelkovia.rodulab.com>',to:[env.SUPPORT_FORWARD_TO],reply_to:'miky@pixelkovia.rodulab.com',...orderNotificationEmail(row)}),
        signal:AbortSignal.timeout(20000)
      });
      if(!response.ok){await response.body?.cancel();continue;}
      const sent=await response.json();if(!sent.id)continue;
      await execute(db,"UPDATE order_notifications SET status='sent',sent_at=?,provider_id=? WHERE order_id=?",Date.now(),sent.id,row.order_id);
    }catch{/* The existing ten-minute cron retries without affecting customer delivery. */}
  }
}
