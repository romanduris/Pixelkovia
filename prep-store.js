/* Browser-local preparation adapter. Replace the adapter for future server sync. */
(() => {
  'use strict';
  const steps = [
    {id:'printed', revision:'listok-qr-v1', label:'Vytlačil som P1–P6 jednostranne na A4; P2 obsahuje oba kruhy.'},
    {id:'supplies', legacy:1, label:'Pripravil som štyri obálky, dva samostatné obaly, ceruzku, pásku a detské nožnice.'},
    {id:'cut-p4', revision:'party-chair-v1', label:'Z P4 som vystrihol štyri pásiky; hornú časť s príbehom a obrázkami prikladám do obálky. P1 a kruhy P2 strihajú deti.'},
    {id:'envelope-1', label:'Pripravil som obálku Kúpeľňa: obsahuje iba celý P1.'},
    {id:'bathroom', label:'Ukryl som obálku Kúpeľňa na suchej dostupnej poličke alebo medzi uterákmi.'},
    {id:'envelope-2', revision:'party-chair-v1', label:'Pripravil som druhú obálku s celým Iskriným dekódovacím strojom P2.'},
    {id:'window', label:'Obálka 2 je pri okne na bezpečnom mieste na dosah detí.'},
    {id:'symbols', revision:'party-chair-v1', label:'Obálka Úloha 3 s P3 je prilepená zo spodnej strany sedadla stoličky.'},
    {id:'shoes', revision:'shoe-clue-v1', label:'Obálka (indícia) 3 s pripraveným P4 je ukrytá v čistej suchej topánke na dosah detí.'},
    {id:'table', revision:'shoe-clue-v1', label:'Na stole je samostatne uzavretý P5 označený „Úloha 5 – otvoriť po zložení odkazu“.'},
    {id:'chair', revision:'party-chair-v1', label:'Obálka 4 s P6 je pod inou stoličkou než P3, označená „Úloha 7 – otvoriť až po Ryškovom pozdrave“.'},
    {id:'media', label:'Overil som čitateľnosť správ v telefóne; video a zvuk sú voliteľným doplnkom.'},
    {id:'phone', label:'Telefón je nabitý, pripravený a tím môže začať.'}
  ].map(step => ({...step, required:true}));
  // Old paper preparation cannot attest the swapped worksheets; game progress is unchanged.
  const storageKey = id => {const revision=steps.find(step=>step.id===id)?.revision;return 'zahada-prep-v5-'+id+(revision?'-'+revision:'');};
  const memory = {};
  const adapter = {
    scope:'browser-local',
    read(id) {
      try {
        const saved = localStorage.getItem(storageKey(id));
        if (saved !== null) return saved === '1';
        // Only equivalent old checks migrate. Old global placement does not attest each hiding place.
        const legacy = steps.find(step => step.id === id)?.legacy;
        return legacy !== undefined && localStorage.getItem('zahada-prep-' + legacy) === '1';
      } catch (_) { return memory[id] === true; }
    },
    write(id, checked) {memory[id] = checked;try { localStorage.setItem(storageKey(id), checked ? '1' : '0'); } catch (_) {}}
  };
  let current = adapter;
  window.PREP_STORE = {
    steps,
    get scope() {return current.scope;},
    read: id => current.read(id),
    write: (id, checked) => current.write(id, checked),
    snapshot: () => Object.fromEntries(steps.map(step => [step.id, current.read(step.id)])),
    ready: () => steps.filter(step => step.required).every(step => current.read(step.id)) && current.read('device-understood'),
    // A future adapter provides the same synchronous local cache, with remote sync outside UI rendering.
    useAdapter(adapter) {current = adapter;}
  };
})();
