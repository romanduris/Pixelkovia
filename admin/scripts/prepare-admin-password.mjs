// Reads a protected local file; does not print passwords, hashes or pepper and does not contact Cloudflare.
import fs from 'node:fs';
import {makePasswordSecrets} from '../src/password-auth.mjs';
const input='/tmp/treasurequest-admin-password',output='/tmp/treasurequest-admin-secrets.json';
if(!fs.existsSync(input))throw Error('Najskôr uložte heslo cez skrytý terminálový vstup.');
fs.chmodSync(input,0o600);
const password=fs.readFileSync(input,'utf8');
const secrets=await makePasswordSecrets(password);
fs.writeFileSync(output,JSON.stringify(secrets),{mode:0o600});fs.chmodSync(output,0o600);
console.log('Serverové heslové secrets sú pripravené v chránenom dočasnom súbore. Žiadna hodnota sa nevypísala a Cloudflare sa nemenil.');
