// Extend only Pixelkovia's existing webhook. No keys or signing secrets change.
import Stripe from '../admin/node_modules/stripe/esm/stripe.esm.node.js';
const required=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','payment_intent.payment_failed','charge.refunded'];
if(!process.env.STRIPE_SECRET_KEY)throw Error('Chýba existujúci STRIPE_SECRET_KEY.');
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:'2026-08-26.dahlia'});
try{
  const account=await stripe.accounts.retrieve();
  if(account.id!=='acct_1UVB5BGle1VvIsLT')throw Error('Nesprávny Stripe účet.');
  const hooks=await stripe.webhookEndpoints.list({limit:100});
  const hook=hooks.data.find(h=>h.url==='https://pixelkovia.rodulab.com/api/stripe/webhook'&&h.status==='enabled');
  if(!hook)throw Error('Existujúci aktívny Pixelkovia webhook sa nenašiel.');
  if(!hook.enabled_events.includes('*')&&required.some(e=>!hook.enabled_events.includes(e))){
    await stripe.webhookEndpoints.update(hook.id,{enabled_events:[...new Set([...hook.enabled_events,...required])]});
  }
  const verified=await stripe.webhookEndpoints.retrieve(hook.id);
  if(verified.status!=='enabled'||(!verified.enabled_events.includes('*')&&required.some(e=>!verified.enabled_events.includes(e))))throw Error('Overenie platobného monitorovania neprešlo.');
  console.log('Existujúci Pixelkovia webhook prijíma aj podpísané hlásenia zlyhania.');
}catch(error){console.error(error.type?'Stripe HTTP '+(error.statusCode||'unknown')+' · '+error.type:error.message);process.exitCode=1;}
