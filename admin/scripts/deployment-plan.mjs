// Prints a plan only; no Cloudflare calls and no deployment/migration capability.
import fs from 'node:fs';
const file=new URL('../docs/cloudflare-inventory.local.json',import.meta.url);
if(!fs.existsSync(file))throw Error('Run the read-only inventory first.');
const inventory=JSON.parse(fs.readFileSync(file,'utf8'));
const names=['treasurequest-admin','treasurequest-admin-preview'],databases=['treasurequest-db','treasurequest-db-preview'];
const occupied=names.filter(name=>inventory.workers.some(w=>w.name===name)).concat(databases.filter(name=>inventory.d1.some(db=>db.name===name)));
console.log(JSON.stringify({planOnly:true,approvalRequired:true,account:inventory.account,occupiedNames:occupied,proposed:{workers:names,databases,binding:'TQ_DB',adminUrl:`https://treasurequest-admin.${inventory.subdomain.subdomain}.workers.dev`,apiUrl:`https://treasurequest-admin.${inventory.subdomain.subdomain}.workers.dev/api`,authentication:'User-approved password-only login: Worker secrets, D1 hashed sessions, secure cookies, rate limits; no Access/email required.',dnsChanges:false},untouched:{workers:inventory.workers,d1:inventory.d1,zones:inventory.zones},requiredApprovals:['Exact account and resource names','New D1 names and, after creation, exact database IDs before any remote migration','First protected deployment']},null,2));
