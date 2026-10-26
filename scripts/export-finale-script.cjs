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
 const references=game.characters.map(character=>`- ${character.image}`).join('\n');
 const kit=`# OpenGen — hotové podklady pre Seedance 2.0

Použi režim Start Image / Image to Video, pomer 9:16, zvuk ON.
Odporúčaný model na finál: ${plan.model}. ${plan.resolution}.
Na priloženej snímke používateľa šípka ukazuje na Seedance 2.0, ale fajkou a v spodnej lište je vybraný Seedance 2.0 Fast.

1. Pre klip A nahraj start-a.png, nastav 8 sekúnd a vlož celý prompt-a.txt.
2. Pre klip B nahraj start-b.png, nastav 12 sekúnd a vlož celý prompt-b.txt.
3. Každý klip generuj samostatne. Neposielaj oba prompty do jedného 15-sekundového behu.
4. Spoj A a B v tomto poradí. Výsledok má približne 20 sekúnd; krátky prestrih alebo prelínačka môže spoj zjemniť.

${plan.instructions}

## Zvuk
Zapni generovanie zvuku. V oboch promptoch sú iba nehovorené elektronické pípnutia, jemné poskoky a zvuk brány. Žiadne hovorenie, spev, ľudské hlasy ani hudba. Hlasová záverečná reč na hernej stránke je samostatný podklad, nie súčasť tohto videa.

## Referencie
Pri Start Image použi iba príslušný hotový obrázok. Sedem samostatných portrétov v priečinku references je záloha pre alternatívny režim References a úpravu obrázkov. Do tohto behu ich nepridávaj. Režimy snímok a referencií sa v dokumentovaných integráciách Seedance používajú oddelene.

## Kontrola výsledku
${plan.review.map(item=>'- '+item).join('\n')}

Presný vzhľad a pohyb nie sú zaručené ani s referenciou. Pred druhým plateným behom skontroluj prvý klip. Výsledok Fast nie je zárukou rovnakého výsledku pri štandardnom modeli; pri vyššom rozlíšení vzniká nové generovanie. Pred spustením vždy použi cenu zobrazenú priamo v OpenGen.

Modelové podklady:
https://seed.bytedance.com/en/blog/seedance-2-0-official-launch
https://elevenlabs.io/docs/overview/capabilities/image-video
`;
 await fs.writeFile(path.join(root,'assets/finale-production/README.txt'),kit);
 const notes=`# Záverečná rozlúčka a scenár pre OpenGen

QR na pracovnom liste úlohy 7 otvorí zadanie hesla. Rozlúčka sa sprístupní po jeho správnom overení. Kým nie sú dodané médiá, hra používa text rozlúčky; nevytvára sa zástupné video ani nahrávka.

## Reč na nahovorenie

${finale.narrative.before.join('\n\n')}

Prednes: ${game.voiceScripts.finale.direction} ${game.voiceScripts.finale.duration}.

## Obrazové referencie

Na každý z dvoch behov použi jeho hotový Start Image. Samostatné portréty sú záložné podklady; nekombinujú sa s týmto režimom. Názvy sú len označením súborov; do videa sa nepíšu.

- assets/finale-production/start-a.png
- assets/finale-production/start-b.png

${references}
- assets/printable-scenes/p7-navrat-portrait.png

## Prompt na vloženie do OpenGen

${game.finaleVideoPrompt}

## Zapojenie hotových médií

Hotové video MP4 s nehovorenými pixelkovými zvukmi a prípadný samostatný hlas MP3 patria do assets/. Polia GAME.finaleVideo a GAME.finaleAudio zatiaľ zostávajú null. Po dodaní sa uvedú skutočné cesty; ovládanie je ručné, prehrávanie neopúšťa stránku a text rozlúčky zostáva dostupný. Nevkladaj cestu k neexistujúcemu súboru.

Zdroj textu je game-data.js. Po jeho úprave spusti node scripts/export-finale-script.cjs.
`;
 await fs.writeFile(path.join(root,'docs/finale-podklady.md'),notes);
 console.log('Exported the OpenGen scenario and matching finale production notes.');
})().catch(error=>{console.error(error);process.exit(1);});
