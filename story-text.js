/* Shared, readable story copy for the game, storyboard and printed worksheets. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  function html(stageOrId, phase='before') {
    const stage=typeof stageOrId==='string'?window.GAME.stages.find(stage=>stage.id===stageOrId):stageOrId;
    const paragraphs=stage?.narrative?.[phase]||[];
    return `<section class="quest-story" data-story-stage="${esc(stage.id)}" data-story-phase="${esc(phase)}" aria-label="${phase==='after'?'Pokračovanie príbehu':'Príbeh zadania'}">${paragraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</section>`;
  }
  window.STORY_TEXT={html};
})();
