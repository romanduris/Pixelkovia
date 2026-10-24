/* Shared, readable story copy for the game, storyboard and printed worksheets. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  function html(stageOrId, phase='before') {
    const stage=typeof stageOrId==='string'?window.GAME.stages.find(stage=>stage.id===stageOrId):stageOrId;
    const paragraphs=stage?.narrative?.[phase]||[];
    return `<section class="quest-story" data-story-stage="${esc(stage.id)}" data-story-phase="${esc(phase)}" aria-label="${phase==='after'?'Pokračovanie príbehu':'Príbeh zadania'}">${paragraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</section>`;
  }
  function party(stageOrId, currentClass='') {
    const stage=typeof stageOrId==='string'?window.GAME.stages.find(item=>item.id===stageOrId):stageOrId;
    const index=window.GAME.stages.indexOf(stage);
    const ids=['piko',...window.GAME.stages.slice(1,Math.min(index,6)+1).map(item=>item.character)];
    return `<figure class="quest-party" data-party-stage="${esc(stage.id)}" aria-label="Naša partia Pixelkov"><div class="party-lineup">${ids.map(id=>{const character=window.GAME.characters.find(item=>item.id===id),current=id===stage.character;return `<div class="party-person ${current?'party-current':''}" data-party-character="${id}"><span class="party-sprite ${current?esc(currentClass):''}" role="img" aria-label="${esc(character.name)}" style="--character-image:url('${character.image}');--sprite-x:${character.tile%4*100/3}%;--sprite-y:${character.tile>=4?100:0}%"></span><span>${esc(character.name)}</span></div>`;}).join('')}</div><figcaption>${index<6?'Naša partia rastie. Každý vie niečo iné.':'Celá partia je spolu. Domov sa vrátime všetci.'}</figcaption></figure>`;
  }
  window.STORY_TEXT={html,party};
})();
