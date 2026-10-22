/* Browser-local preparation adapter. Replace the adapter for future server sync. */
(() => {
  'use strict';
  const steps = [
    {id:'printed', revision:'iskra-decoder', label:'Vytlačil som P1–P6 jednostranne na A4; P2 obsahuje oba kruhy.'},
    {id:'supplies', legacy:1, label:'Pripravil som štyri obálky, dva samostatné obaly, ceruzku, pásku a detské nožnice.'},
    {id:'cut-p4', label:'Rozstrihal som iba P4 na štyri pásiky. P1 a kruhy P2 vystrihujú až deti.'},
    {id:'envelope-1', label:'Pripravil som obálku Kúpeľňa: obsahuje iba celý P1.'},
    {id:'bathroom', label:'Ukryl som obálku Kúpeľňa na suchej dostupnej poličke alebo medzi uterákmi.'},
    {id:'envelope-2', revision:'iskra-decoder', label:'Pripravil som druhú obálku s celým Iskriným dekódovacím strojom P2.'},
    {id:'window', label:'Obálka 2 je pri okne na bezpečnom mieste na dosah detí.'},
    {id:'symbols', revision:'iskra-decoder', label:'P3 je nízko pod oknom v samostatnom obale označenom „Úloha 3 – otvoriť po dekódovaní odkazu“.'},
    {id:'table', revision:'iskra-decoder', label:'Obálka 3 je na stole: štyri premiešané pásiky P4 a osobitne uzavretý P5 označený „Úloha 5 – otvoriť po zložení odkazu“.'},
    {id:'chair', label:'Obálka 4 s P6 je pod sedadlom dostupnej stoličky pri stole.'},
    {id:'media', label:'Overil som Pikovo video, Kvakovu hlasovú správu a hlasitosť telefónu.'},
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
