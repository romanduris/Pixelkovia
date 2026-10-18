// Seed the local Wrangler SQLite file only. No remote option, credentials or REST mutation.
import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {seedDemo} from '../src/demo.mjs';
const root=path.resolve(import.meta.dirname,'..');
function find(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?find(path.join(dir,e.name)):e.name.endsWith('.sqlite')?[path.join(dir,e.name)]:[]);}
const files=find(path.join(root,'.wrangler/state/v3/d1'));
const candidates=files.filter(file=>{const db=new DatabaseSync(file);try{return !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='entitlements'").get();}finally{db.close();}});
if(candidates.length!==1)throw Error('Expected exactly one migrated local TreasureQuest database. Run npm run migrate:local first.');
const sqlite=new DatabaseSync(candidates[0]);sqlite.exec('PRAGMA foreign_keys=ON');
const db={prepare(sql){return {values:[],bind(...values){this.values=values;return this;},async all(){return {results:sqlite.prepare(sql).all(...this.values)};},async first(){return sqlite.prepare(sql).get(...this.values)||null;},async run(){const result=sqlite.prepare(sql).run(...this.values);return {meta:{changes:Number(result.changes)}};}};},async batch(list){sqlite.exec('BEGIN');try{const result=[];for(const s of list)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
try{console.log(await seedDemo(db,{local:true}));}finally{sqlite.close();}
