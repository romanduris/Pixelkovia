// Derive the seven server task rules from the current game.
import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('../../game-data.js',import.meta.url),'utf8'),context);
const game=context.window.GAME;
const stages=game.stages.slice(1,-1).map((s,index)=>({stage:index+1,title:s.title,answers:s.id==='maze'?[game.cipkoPuzzle.digits.join('')]:s.answer,digital:!!s.digital,hints:s.hints}));
fs.writeFileSync(new URL('../src/game-rules.mjs',import.meta.url),'// Generated from root game-data.js. Server source; never part of admin/public.\nexport const stages = '+JSON.stringify(stages,null,2)+';\n');
