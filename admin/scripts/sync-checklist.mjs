import fs from 'node:fs';import vm from 'node:vm';
const context={window:{},localStorage:{getItem(){return null;}}};
vm.runInNewContext(fs.readFileSync(new URL('../../prep-store.js',import.meta.url),'utf8'),context);
const steps=context.window.PREP_STORE.steps.map(s=>({id:s.id,label:s.label}));
fs.writeFileSync(new URL('../src/checklist.mjs',import.meta.url),'// Derived from the existing parent preparation.\nexport const checklist = '+JSON.stringify(steps,null,2)+';\n');
