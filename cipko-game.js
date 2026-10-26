/* Four touch games. Progress lives inside the existing saved team adventure. */
(() => {
  const titles=['Rozsvieť pixely po poradí','Poskladaj obrázok','Nájdi dvojice','Rozsvieť cestu'];
  const instructions=['Ťukaj na čísla od 1 do 16. Nájdeš ich všetky v správnom poradí?','Poskladaj deväť dielikov podľa malého obrázka. Dielik potiahni, alebo naň ťukni a vyber miesto.','Otáčaj kartičky a nájdi šesť rovnakých dvojíc.','Otáčaj dieliky potrubia. Vytvor neprerušenú cestu od VSTUPU až k JADRU.'];
  const faces=['☀','★','☾','◆','♥','✚','☾','♥','☀','✚','★','◆'];
  const pixelOrder=[9,3,14,6,1,12,7,16,10,5,2,13,4,15,11,8];
  // A single winding route visits all nine tiles; turns are relative to an up/right elbow.
  const pipeTargets=[0,2,1,1,3,1,0,0,3],pipeElbows=new Set([1,2,3,4,6,8]);
  const pipeStart=[1,0,2,2,1,0,2,1,0];
  function data(state){
    const old=state.cipko;
    if(!old||old.version!==2){
      const previousRound=old?.version===1?Math.max(0,Math.min(4,old.round||0)):0;
      const finished=previousRound>=4||(previousRound===3&&old?.won);
      state.cipko={version:2,round:finished?4:previousRound,won:!!old?.won&&!finished,pixels:[],tiles:Array(9).fill(null),selected:null,matched:[],open:[],turns:[...pipeStart]};
    }
    return state.cipko;
  }
  const button=(kind,index,content,attrs='')=>`<button type="button" data-action="cipko" data-kind="${kind}" data-index="${index}" ${attrs}>${content}</button>`;
  function digitsHTML(c){return `<ol class="cipko-digits" aria-label="Získané číslice">${GAME.cipkoPuzzle.digits.map((n,i)=>`<li><small>${i+1}. hra</small><strong>${i<c.round||(i===c.round&&c.won)?n:'·'}</strong></li>`).join('')}</ol>`;}
  const piece=(i)=>`<span class="cipko-piece" style="--piece-x:${i%3*50}%;--piece-y:${Math.floor(i/3)*50}%" aria-hidden="true"></span>`;
  function pipe(c){
    return `<div class="cipko-pipe-board"><div class="cipko-port cipko-inlet"><span>VSTUP →</span><i></i></div><div class="cipko-port cipko-outlet"><span>VÝSTUP →<br>JADRO</span><i></i></div><div class="cipko-pipes">${c.turns.map((rotation,i)=>{
      const svg=`<svg viewBox="0 0 80 80" aria-hidden="true"><path d="${pipeElbows.has(i)?'M40 0V40H80':'M0 40H80'}" transform="rotate(${rotation*90} 40 40)"/></svg>`;
      return button('pipe',i,svg,`class="cipko-pipe movable" aria-label="Otočiť potrubie ${i+1}"`);
    }).join('')}</div></div>`;
  }
  function render(state){
    const c=data(state),r=c.round;
    if(r===4||state.completed?.includes(5))return `<div class="cipko-finished"><h1 tabindex="-1">Štyri hry sú hotové!</h1><p>V jednotlivých hrách ste získali tieto číslice:</p>${digitsHTML({...c,round:4})}<p class="cipko-return-sign">Váš návratový znak: <strong>L</strong>. Zapamätajte si ho do spoločného hesla.</p><p class="cipko-paper-handoff">Teraz pokračujte na papieri. Číslice zapíšte po poradí a pomocou kľúča odhaľte, kde sa skrýva ďalšia indícia.</p><p class="task-completion-note">Telefón môžete odložiť a pokračovať na pracovnom liste.</p><button class="btn cipko-finish-exit" data-action="close-window">Zavrieť okno</button></div>`;
    if(c.won)return `${digitsHTML(c)}<div class="cipko-win" role="status"><span>✓ ${titles[r]}</span><h1 tabindex="-1">Podarilo sa!</h1><p>Zapíš si do ${r+1}. políčka na papieri číslicu:</p><strong class="cipko-prize">${GAME.cipkoPuzzle.digits[r]}</strong><p>Číslica tu zostane uložená.</p>${button('next',0,'Ďalšia hra →','class="btn"')}</div>`;
    let board='';
    if(r===0)board=`<div class="cipko-pixels">${pixelOrder.map(value=>button('pixel',value,c.pixels.includes(value)?'✓':value,`class="cipko-pixel ${c.pixels.includes(value)?'collected':''}" aria-label="Pixel ${value}" ${c.pixels.includes(value)?'disabled':''}`)).join('')}</div><p class="cipko-status" role="status">${c.notice||`Hľadaj číslo ${c.pixels.length+1}.`} Rozsvietené: ${c.pixels.length} / 16</p>`;
    if(r===1)board=`<div class="cipko-jigsaw"><img class="cipko-reference" src="assets/characters/cipko.png" alt="Takto vyzerá hotový obrázok"><div class="cipko-slots">${c.tiles.map((v,i)=>button('slot',i,v===null?`<span>${i+1}</span>`:piece(v),`class="cipko-slot ${v===null?'':'placed'}" aria-label="Miesto ${i+1}${v===null?'':', správne vyplnené'}" ${v===null?'':'disabled'}`)).join('')}</div></div><div class="cipko-tray" aria-label="Dieliky obrázka">${[7,2,4,0,8,3,6,1,5].filter(i=>!c.tiles.includes(i)).map(i=>button('select',i,piece(i),`draggable="true" class="cipko-tile ${c.selected===i?'selected':''}" aria-pressed="${c.selected===i}" aria-label="Vybrať dielik ${i+1}"`)).join('')}</div><p class="cipko-status" role="status">${c.notice||'Vyber dielik a jeho miesto.'}</p>`;
    if(r===2)board=`<div class="cipko-memory">${faces.map((face,i)=>{const match=c.matched.includes(i),show=match||c.open.includes(i);return button('card',i,show?face:'?',`class="cipko-card ${match?'matched':''} ${show?'flipped':''}" aria-label="Karta ${i+1}: ${show?face:'otočiť'}" ${match?'disabled':''}`);}).join('')}</div><p class="cipko-status" role="status">${c.open.length===2?'Tieto dve sú rozdielne. Vyber ďalšiu kartičku.':`Nájdené dvojice: ${c.matched.length/2} / 6`}</p>`;
    if(r===3)board=pipe(c);
    return `<p class="cipko-round">HRA ${r+1} ZO 4</p><h1 tabindex="-1">${titles[r]}</h1><p class="cipko-instruction">${instructions[r]}</p>${board}${digitsHTML(c)}`;
  }
  function act(state,kind,index){
    const c=data(state);if(c.round>=4)return;
    if(kind==='next'&&c.won){c.round++;c.won=false;return;}
    if(c.won)return;
    if(c.round===0&&kind==='pixel'&&Number.isInteger(index)&&index>=1&&index<=16){
      if(index===c.pixels.length+1){c.pixels.push(index);c.notice='';}
      else if(!c.pixels.includes(index))c.notice=`Najprv nájdi číslo ${c.pixels.length+1}.`;
      c.won=c.pixels.length===16;
    }
    if(c.round===1){
      if(kind==='select'&&Number.isInteger(index)&&index>=0&&index<9&&!c.tiles.includes(index)){c.selected=index;c.notice='Teraz vyber miesto v obrázku.';}
      if(kind==='slot'&&c.tiles[index]===null&&c.selected!==null){if(index===c.selected){c.tiles[index]=c.selected;c.selected=null;c.notice='Dielik zapadol! Vyber ďalší.';}else c.notice='Sem ešte nepasuje. Skús iné miesto.';}
      c.won=c.tiles.every((v,i)=>v===i);
    }
    if(c.round===2&&kind==='card'&&index>=0&&index<12&&!c.matched.includes(index)){
      if(c.open.length===2)c.open=[];
      if(!c.open.includes(index))c.open.push(index);
      if(c.open.length===2&&faces[c.open[0]]===faces[c.open[1]]){c.matched.push(...c.open);c.open=[];}
      c.won=c.matched.length===12;
    }
    if(c.round===3&&kind==='pipe'&&Number.isInteger(index)&&index>=0&&index<9){
      c.turns[index]=(c.turns[index]+1)%4;
      if(c.turns.every((value,i)=>pipeElbows.has(i)?value===pipeTargets[i]:value%2===pipeTargets[i]%2)){c.round=4;c.won=false;}
    }
  }
  window.CIPKO_GAME={data,render,act,ready:state=>data(state).round===4};
})();
