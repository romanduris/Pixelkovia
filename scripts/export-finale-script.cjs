// Keep the downloadable OpenGen prompt and authoring notes in sync with the storyboard.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
(async()=>{
 const root=path.resolve(__dirname,'..'),context={window:{}};
 vm.runInNewContext(await fs.readFile(path.join(root,'game-data.js'),'utf8'),context);
 const game=context.window.GAME,finale=game.stages.find(stage=>stage.id==='finale');
 await fs.writeFile(path.join(root,'assets/finale-opengen-scenar.txt'),game.finaleVideoPrompt+'\n');
 const plan=game.finaleProduction;
 await fs.mkdir(path.join(root,'assets/finale-production'),{recursive:true});
 for(const clip of plan.clips)await fs.writeFile(path.join(root,clip.promptFile),clip.prompt+'\n');
 const kit=game.finaleVideoPrompt+'\n\nV ZIP balíku je start-a.png, voliteľný end-empty-room.png, prompt-a.txt a README.txt. Samostatné referenčné portréty sa nepoužívajú.\n';
 await fs.writeFile(path.join(root,'assets/finale-production/README.txt'),kit);
 const notes=`# Záverečná rozlúčka a scenár pre OpenGen

QR na pracovnom liste úlohy 7 otvorí zadanie hesla. Rozlúčka sa sprístupní po jeho správnom overení. ${game.finaleVideo?`Dodané video ${game.finaleVideo} sa prehráva po ťuknutí, so zvukom a ovládaním pauzy i opakovania. Text rozlúčky zostáva dostupný.`:'Kým nie je dodané video, hra používa text rozlúčky.'}

## Reč na nahovorenie

${finale.narrative.before.join('\n\n')}

Prednes: ${game.voiceScripts.finale.direction} ${game.voiceScripts.finale.duration}.

TTS zadanie:
${game.voiceScripts.finale.prompt}

Celý návod s obrázkami, nastaveniami a kopírovaním zadania je priamo v storyboard.html po rozbalení „Scenár pre OpenGen“ pri finále.

## Obrazové referencie

Na jeden 10-sekundový beh použi Start Image. Voliteľný End Image určuje rovnakú izbu po odchode partie. Ak ho vybraný model nesprístupní, stačí Start Image a rovnaký prompt. Samostatné referenčné portréty sa nepridávajú.

- assets/finale-production/start-a.png
- assets/finale-production/end-empty-room.png

## Prompt na vloženie do OpenGen

${game.finaleVideoPrompt}

## Zapojenie hotových médií

GAME.finaleVideo: ${game.finaleVideo||'null'}. GAME.finaleAudio: ${game.finaleAudio||'null (samostatná hlasová stopa ešte nie je dodaná)'}. Používa sa pôvodná zvuková stopa dodaného MP4, bez pridanej TTS nahrávky. Prehrávanie je ručné, zostáva na stránke a nezmení uložený postup. Video sa pri odchode zastaví. Pri chybe ostáva opakovanie pokusu aj text rozlúčky.

Zdroj textu je game-data.js. Po jeho úprave spusti node scripts/export-finale-script.cjs.
`;
 await fs.writeFile(path.join(root,'docs/finale-podklady.md'),notes);
 console.log('Exported the OpenGen scenario and matching finale production notes.');
})().catch(error=>{console.error(error);process.exit(1);});
