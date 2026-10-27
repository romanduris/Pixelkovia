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

QR na pracovnom liste úlohy 7 vždy otvorí zadanie hesla, aj pri už dokončenej hre. Uložené splnenie nenahrádza overenie pri novom otvorení. Rozlúčka sa sprístupní po jeho správnom overení. ${game.finaleVideo?`Dodané video ${game.finaleVideo} sa prehráva po ťuknutí, so zvukom a ovládaním pauzy i opakovania. Finálová obrazovka obsahuje iba nadpis NÁVRATOVÝ SIGNÁL PRIJATÝ, veľké video a tlačidlo Koniec hry. Text rozlúčky je naďalej v storyboarde.`:'Kým nie je dodané video, hra používa text rozlúčky.'}

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

GAME.finaleVideo: ${game.finaleVideo||'null'}. GAME.finaleAudio: ${game.finaleAudio||'null (samostatná hlasová stopa ešte nie je dodaná)'}. Používa sa zvuková stopa dodaného MP4 so slovenským dabingom; nepridáva sa ďalší prehrávač hlasu. Po správnom návratovom hesle sa zachovaný prednačítaný prehrávač spustí s oneskorením 1 sekundy; pri odmietnutí automatického prehrávania zostane ručné tlačidlo. Video zostáva na stránke a nezmení uložený postup. Video sa pri odchode zastaví. Po dohraní ostáva posledný záber; po 1 sekunde sa cezň zobrazí KONIEC. Pri opakovaní, posunutí a obnovení stránky sa titulok skryje. Pri chybe ostáva opakovanie pokusu vo videu. Koniec hry zastaví prehrávanie a požiada prehliadač o zavretie karty; pri odmietnutí zobrazí pokyn na ručné zatvorenie.

Zdroj textu je game-data.js. Po jeho úprave spusti node scripts/export-finale-script.cjs.
`;
 await fs.writeFile(path.join(root,'docs/finale-podklady.md'),notes);
 console.log('Exported the OpenGen scenario and matching finale production notes.');
})().catch(error=>{console.error(error);process.exit(1);});
