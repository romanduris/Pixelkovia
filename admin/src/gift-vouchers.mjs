import {first,execute} from './db.mjs';
import {HttpError} from './auth.mjs';

export const normalizeVoucher=value=>typeof value==='string'?value.trim().toLowerCase():'';
export const voucherUnavailable=()=>new HttpError(409,'Tento darčekový poukaz už bol použitý alebo sa práve uplatňuje v inej objednávke.');
export async function giftVoucher(db,value){
  const code=normalizeVoucher(value);
  return /^[a-z0-9-]{1,64}$/.test(code)?first(db,'SELECT v.code,c.attempt_id reserved_attempt_id,r.attempt_id redeemed_attempt_id,r.redeemed_at FROM gift_vouchers v LEFT JOIN gift_voucher_claims c ON c.code=v.code LEFT JOIN gift_voucher_redemptions r ON r.code=v.code WHERE v.code=?',code):null;
}
export async function validateVoucher(env,input){
  if(typeof input.code!=='string'||input.code.length>64)throw new HttpError(400,'Zadajte platný kód voucheru.');
  const code=normalizeVoucher(input.code);
  if(['free','1e'].includes(code))return {code,gift:false};
  const row=await giftVoucher(env.TQ_DB,code);
  if(!row)throw new HttpError(400,'Tento voucher nepoznáme. Skontrolujte kód a skúste to znova.');
  if(row.redeemed_attempt_id)throw voucherUnavailable();
  // Validation does not reserve or consume a gift. Availability is checked
  // again atomically when its Stripe checkout is prepared.
  return {code:row.code,gift:true};
}
export async function releaseGiftVoucher(db,attempt){
  if(attempt.gift_voucher_code)await execute(db,'DELETE FROM gift_voucher_claims WHERE code=? AND attempt_id=? AND NOT EXISTS(SELECT 1 FROM gift_voucher_redemptions WHERE code=?)',attempt.gift_voucher_code,attempt.id,attempt.gift_voucher_code);
}
export function verifyGiftVoucher(session,attempt){
  if((session.metadata?.gift_voucher_code||null)!==(attempt.gift_voucher_code||null))throw new HttpError(400,'Darčekový poukaz sa nepodarilo overiť.');
}
