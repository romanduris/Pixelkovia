export const query=async(db,sql,...values)=>(await db.prepare(sql).bind(...values).all()).results;
export const first=(db,sql,...values)=>db.prepare(sql).bind(...values).first();
export const statement=(db,sql,...values)=>db.prepare(sql).bind(...values);
export const execute=(db,sql,...values)=>statement(db,sql,...values).run();
export const uuid=()=>crypto.randomUUID();
export const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export const now=()=>Date.now();
export function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');}
