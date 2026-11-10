import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences} from '../public/marketing-preferences.js';
const at=Date.parse('2026-11-10T10:00:00Z');
test('marketing preferences retain only valid filters and display settings',()=>{
  const saved=normalizePreferences({selected:{period:'since',from:'2026-11-01',to:'2026-11-02',source:'facebook',device:'mobile',product:'game',campaign:'launch-2026',email:'private@example.invalid'},open:['charts','filters','attribution','charts','invalid'],unique:true,periodPurchases:true,sort:'conversion',direction:'asc',rows:[{email:'private@example.invalid'}]},at);
  assert.deepEqual(saved,{selected:{period:'since',from:'2026-11-01',source:'facebook',device:'mobile',product:'game',campaign:'launch-2026'},open:['charts','filters','attribution'],unique:true,periodPurchases:true,sort:'conversion',direction:'asc'});
  assert.ok(!JSON.stringify(saved).includes('private'));
  assert.deepEqual(normalizePreferences({...saved,selected:{period:'custom',from:'2026-10-01',to:'2026-11-01'}},at).selected,{period:'custom',from:'2026-10-01',to:'2026-11-01'});
});
test('invalid and stale saved date selections recover to the default period',()=>{
  for(const selected of [{period:'since',from:'2026-02-30'},{period:'since',from:'2026-11-11'},{period:'since',from:'2025-11-09'},{period:'custom',from:'2026-11-10',to:'2026-11-09'},{period:'custom',from:'2026-11-10'},{period:'bad',source:'invalid',campaign:'private@example.invalid'}])assert.deepEqual(normalizePreferences({selected},at).selected,{period:'14'});
  for(const saved of [null,[],true,'bad'])assert.deepEqual(normalizePreferences(saved,at).selected,{period:'14'});
  // The saved start remains fixed as the report moves into the next day in Bratislava.
  assert.deepEqual(normalizePreferences({selected:{period:'since',from:'2026-11-10'}},Date.parse('2026-11-10T23:30:00Z')).selected,{period:'since',from:'2026-11-10'});
});
