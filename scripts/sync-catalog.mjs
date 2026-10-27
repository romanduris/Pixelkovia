import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{},URL};
vm.runInNewContext(fs.readFileSync(new URL('../site-config.js',import.meta.url),'utf8'),context);
const c=context.window.SITE_CONFIG;
fs.writeFileSync(new URL('../admin/src/catalog.mjs',import.meta.url),`// Generated from site-config.js by scripts/sync-catalog.mjs.\nexport const products=${JSON.stringify(c.products)};\nexport const offer=${JSON.stringify(c.offer)};\nexport const product=${c.product.toString()};\nexport const quote=${c.quote.toString()};\n`);
