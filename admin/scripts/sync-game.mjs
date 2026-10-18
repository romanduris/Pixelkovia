// Authoring only: derive server validation rules from the unchanged current game.
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../../game-data.js',import.meta.url),'utf8'),context);
const stages=context.window.GAME.stages.slice(1,9).map((s,index)=>({stage:index+1,title:s.title,answers:s.answer,digital:!!s.digital,hints:s.hints}));
fs.writeFileSync(new URL('../src/game-rules.mjs',import.meta.url),'// Generated from root game-data.js. Server source; never part of admin/public.\nexport const stages = '+JSON.stringify(stages,null,2)+';\n');
