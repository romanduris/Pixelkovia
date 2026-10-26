// Keep the downloadable OpenGen prompt and authoring notes in sync with the storyboard.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
(async()=>{
 const root=path.resolve(__dirname,'..'),context={window:{}};
 vm.runInNewContext(await fs.readFile(path.join(root,'game-data.js'),'utf8'),context);
 const game=context.window.GAME,finale=game.stages.find(stage=>stage.id==='finale');
 await fs.writeFile(path.join(root,'assets/finale-opengen-scenar.txt'),game.finaleVideoPrompt+'\n');
 const references=game.characters.map(character=>`- ${character.image}`).join('\n');
 const notes=`# Záverečná rozlúčka a scenár pre OpenGen

QR na pracovnom liste úlohy 7 otvorí zadanie hesla. Rozlúčka sa sprístupní po jeho správnom overení. Kým nie sú dodané médiá, hra používa text rozlúčky; nevytvára sa zástupné video ani nahrávka.

## Reč na nahovorenie

${finale.narrative.before.join('\n\n')}

Prednes: ${game.voiceScripts.finale.direction} ${game.voiceScripts.finale.duration}.

## Obrazové referencie

Do OpenGen prilož schválené portréty a spoločnú ilustráciu. Názvy sú len označením súborov; do videa sa nepíšu.

${references}
- assets/printable-scenes/p7-navrat-portrait.png

## Prompt na vloženie do OpenGen

${game.finaleVideoPrompt}

## Zapojenie hotových médií

Hotové video MP4 a samostatný hlas MP3 patria do assets/. Polia GAME.finaleVideo a GAME.finaleAudio zatiaľ zostávajú null. Po dodaní sa uvedú skutočné cesty; ovládanie je ručné, prehrávanie neopúšťa stránku a text rozlúčky zostáva dostupný. Nevkladaj cestu k neexistujúcemu súboru.

Zdroj textu je game-data.js. Po jeho úprave spusti node scripts/export-finale-script.cjs.
`;
 await fs.writeFile(path.join(root,'docs/finale-podklady.md'),notes);
 console.log('Exported the OpenGen scenario and matching finale production notes.');
})().catch(error=>{console.error(error);process.exit(1);});
