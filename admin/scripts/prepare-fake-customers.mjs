// Generates INSERT-only SQL in /tmp; never contacts Cloudflare or changes a deployed DB.
import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {seedFakeCustomers} from '../src/fake-customers.mjs';
const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');
const db={prepare(sql){return {values:[],bind(...values){this.values=values;return this;},async first(){return sqlite.prepare(sql).get(...this.values)||null;},async all(){return {results:sqlite.prepare(sql).all(...this.values)};},async run(){const r=sqlite.prepare(sql).run(...this.values);return {meta:{changes:Number(r.changes)}};}};},async batch(list){sqlite.exec('BEGIN');try{const results=[];for(const s of list)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
try{
 for(const file of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 const summary=await seedFakeCustomers(db,{local:true});
 const tables=['customers','orders','order_items','entitlements','portal_sessions','checklist_progress','game_runs','game_stage_progress','game_events','audit_events'];
 const literal=value=>value===null?'NULL':typeof value==='number'?String(value):"'"+String(value).replaceAll("'","''")+"'";
 const sql=['-- Explicitly FAKE: 15 customers, simulated paid purchases and game history. No real payments or emails.'];
 for(const table of tables){const rows=sqlite.prepare(`SELECT * FROM ${table}`).all();for(const row of rows)sql.push(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.values(row).map(literal).join(',')});`);}
 const output='/tmp/treasurequest-fake-customers.sql';fs.writeFileSync(output,sql.join('\n')+'\n',{mode:0o600});
 // Validate the exported SQL against the same migrated schema, including all foreign keys.
 const verify=new DatabaseSync(':memory:');try{verify.exec('PRAGMA foreign_keys=ON');for(const file of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())verify.exec(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));verify.exec(sql.join('\n'));if(verify.prepare('PRAGMA foreign_key_check').all().length)throw Error('Invalid FAKE fixture foreign keys.');}finally{verify.close();}
 console.log(JSON.stringify({...summary,output,remoteChanges:false}));
}finally{sqlite.close();}
