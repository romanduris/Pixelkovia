import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
export class LocalD1 {
  constructor(){this.sqlite=new DatabaseSync(':memory:');this.sqlite.exec('PRAGMA foreign_keys=ON');}
  prepare(sql){const db=this;return {values:[],bind(...values){this.values=values;return this;},async all(){return {results:db.sqlite.prepare(sql).all(...this.values)};},async first(){return db.sqlite.prepare(sql).get(...this.values)||null;},async run(){const r=db.sqlite.prepare(sql).run(...this.values);return {success:true,meta:{changes:Number(r.changes)}};}};}
  async batch(statements){this.sqlite.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
  migrate(){for(const file of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())this.sqlite.exec(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));}
  close(){this.sqlite.close();}
}
export const fresh=()=>{const db=new LocalD1();db.migrate();return db;};
