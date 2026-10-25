/* Four touch games. Progress lives inside the existing saved team adventure. */
(() => {
  const titles=['Pozbieraj pixely','Poskladaj obrázok','Nájdi dvojice','Rozsvieť cestu'];
  const instructions=['Ťukni na všetkých 12 svetielok.','Potiahni dielik do obrázka. Alebo naň ťukni a potom vyber miesto.','Otáčaj kartičky a nájdi tri rovnaké dvojice.','Ťukaním otáčaj tri označené dieliky. Spoj VSTUP s JADROM.'];
  const faces=['☀','★','☾','★','☾','☀'];
  function data(state){
    if(!state.cipko||state.cipko.version!==1)state.cipko={version:1,round:0,won:false,pixels:[],tiles:[null,null,null,null],selected:null,matched:[],open:[],turns:[1,0,1]};
    return state.cipko;
  }
  const button=(kind,index,content,attrs='')=>`<button type="button" data-action="cipko" data-kind="${kind}" data-index="${index}" ${attrs}>${content}</button>`;
  function digitsHTML(c){return `<ol class="cipko-digits" aria-label="Získané číslice">${GAME.cipkoPuzzle.digits.map((n,i)=>`<li><small>${i+1}. hra</small><strong>${i<c.round||(i===c.round&&c.won)?n:'·'}</strong></li>`).join('')}</ol>`;}
  const piece=(i)=>`<span class="cipko-piece" style="--piece-x:${i%2*100}%;--piece-y:${Math.floor(i/2)*100}%" aria-hidden="true"></span>`;
  function pipe(c){
    const rotations=[0,0,c.turns[0],c.turns[2],0,c.turns[1]],rotatable={2:0,3:2,5:1};
    return `<div class="cipko-pipe-labels"><span>VSTUP →</span></div><div class="cipko-pipes">${rotations.map((rotation,i)=>{
      const svg=`<svg viewBox="0 0 80 80" aria-hidden="true"><path d="${[2,5].includes(i)?'M40 0V40H80':'M0 40H80'}" transform="rotate(${rotation*90} 40 40)"/></svg>`;
      return i in rotatable?button('pipe',rotatable[i],svg,`class="cipko-pipe movable" aria-label="Otočiť potrubie ${rotatable[i]+1}"`):`<span class="cipko-pipe">${svg}</span>`;
    }).join('')}</div><p class="cipko-core">← JADRO</p>`;
  }
  function render(state){
    const c=data(state),r=c.round;
    if(r===4)return `${digitsHTML(c)}<h1 tabindex="-1">Opravy sú hotové!</h1><p>Číslice vyhľadajte v kľúči na P5. Časti slova prepíšte po poradí do tajničky.</p><form class="answer-form signal-form"><label for="answer">Aké miesto ste rozlúštili?</label><input id="answer" name="answer" autocomplete="off" spellcheck="false" maxlength="30" required placeholder="Miesto z tajničky" aria-describedby="feedback"><button class="btn" type="submit">Potvrdiť miesto →</button></form><p id="feedback" class="feedback" role="status"></p>`;
    if(c.won)return `${digitsHTML(c)}<div class="cipko-win" role="status"><span>✓ ${titles[r]}</span><h1 tabindex="-1">Podarilo sa!</h1><p>Zapíš si do ${r+1}. políčka na P5 číslicu:</p><strong class="cipko-prize">${GAME.cipkoPuzzle.digits[r]}</strong><p>Číslica tu zostane uložená.</p>${button('next',0,r===3?'Rozlúštiť tajničku →':'Ďalšia hra →','class="btn"')}</div>`;
    let board='';
    if(r===0)board=`<div class="cipko-pixels">${Array.from({length:12},(_,i)=>button('pixel',i,c.pixels.includes(i)?'✓':'✦',`class="cipko-pixel ${c.pixels.includes(i)?'collected':''}" aria-label="Svetielko ${i+1}" ${c.pixels.includes(i)?'disabled':''}`)).join('')}</div><p class="cipko-status" role="status">Pozbierané: ${c.pixels.length} / 12</p>`;
    if(r===1)board=`<div class="cipko-jigsaw"><img class="cipko-reference" src="assets/characters/cipko.png" alt="Takto vyzerá hotový obrázok"><div class="cipko-slots">${c.tiles.map((v,i)=>button('slot',i,v===null?`<span>${i+1}</span>`:piece(v),`class="cipko-slot ${v===null?'':'placed'}" aria-label="Miesto ${i+1}${v===null?'':', správne vyplnené'}" ${v===null?'':'disabled'}`)).join('')}</div></div><div class="cipko-tray" aria-label="Dieliky obrázka">${[2,0,3,1].filter(i=>!c.tiles.includes(i)).map(i=>button('select',i,piece(i),`draggable="true" class="cipko-tile ${c.selected===i?'selected':''}" aria-pressed="${c.selected===i}" aria-label="Vybrať dielik ${i+1}"`)).join('')}</div><p class="cipko-status" role="status">${c.notice||'Vyber dielik a jeho miesto.'}</p>`;
    if(r===2)board=`<div class="cipko-memory">${faces.map((face,i)=>{const match=c.matched.includes(i),show=match||c.open.includes(i);return button('card',i,show?face:'?',`class="cipko-card ${match?'matched':''} ${show?'flipped':''}" aria-label="Karta ${i+1}: ${show?face:'otočiť'}" ${match?'disabled':''}`);}).join('')}</div><p class="cipko-status" role="status">${c.open.length===2?'Tieto dve sú rozdielne. Vyber ďalšiu kartičku.':`Nájdené dvojice: ${c.matched.length/2} / 3`}</p>`;
    if(r===3)board=pipe(c);
    return `<p class="cipko-round">HRA ${r+1} ZO 4</p><h1 tabindex="-1">${titles[r]}</h1><p class="cipko-instruction">${instructions[r]}</p>${board}${digitsHTML(c)}`;
  }
  function act(state,kind,index){
    const c=data(state);if(c.round>=4)return;
    if(kind==='next'&&c.won){c.round++;c.won=false;return;}
    if(c.won)return;
    if(c.round===0&&kind==='pixel'&&Number.isInteger(index)&&index>=0&&index<12){if(!c.pixels.includes(index))c.pixels.push(index);c.won=c.pixels.length===12;}
    if(c.round===1){
      if(kind==='select'&&[0,1,2,3].includes(index)&&!c.tiles.includes(index)){c.selected=index;c.notice='Teraz vyber miesto v obrázku.';}
      if(kind==='slot'&&c.tiles[index]===null&&c.selected!==null){if(index===c.selected){c.tiles[index]=c.selected;c.selected=null;c.notice='Dielik zapadol! Vyber ďalší.';}else c.notice='Sem ešte nepasuje. Skús iné miesto.';}
      c.won=c.tiles.every((v,i)=>v===i);
    }
    if(c.round===2&&kind==='card'&&index>=0&&index<6&&!c.matched.includes(index)){
      if(c.open.length===2)c.open=[];
      if(!c.open.includes(index))c.open.push(index);
      if(c.open.length===2&&faces[c.open[0]]===faces[c.open[1]]){c.matched.push(...c.open);c.open=[];}
      c.won=c.matched.length===6;
    }
    if(c.round===3&&kind==='pipe'&&[0,1,2].includes(index)){c.turns[index]=(c.turns[index]+1)%4;c.won=c.turns[0]===2&&c.turns[1]===3&&c.turns[2]%2===0;}
  }
  window.CIPKO_GAME={data,render,act,ready:state=>data(state).round===4};
})();
