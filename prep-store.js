/* Browser-local preparation adapter. Replace the adapter for future server sync. */
(() => {
  'use strict';
  const steps = [
    {id:'printed', legacy:0, label:'Vytlačil som P1–P6 jednostranne na A4; P4 obsahuje oba kruhy.'},
    {id:'supplies', legacy:1, label:'Pripravil som štyri obálky, dva samostatné obaly, ceruzku, pásku a detské nožnice.'},
    {id:'cut-p2', legacy:2, label:'Rozstrihal som iba P2 na štyri pásiky. P1 a kruhy P4 vystrihujú až deti.'},
    {id:'envelope-1', label:'Pripravil som obálku Kúpeľňa: obsahuje iba celý P1.'},
    {id:'bathroom', label:'Ukryl som obálku Kúpeľňa na suchej dostupnej poličke alebo medzi uterákmi.'},
    {id:'envelope-2', label:'Pripravil som druhú obálku so štyrmi premiešanými pásikmi P2.'},
    {id:'window', label:'Obálka 2 je pri okne na bezpečnom mieste na dosah detí.'},
    {id:'symbols', label:'P3 je nízko pod oknom v samostatnom obale označenom „Úloha 3 – otvoriť po zložení odkazu“.'},
    {id:'table', label:'Obálka 3 je na stole: P4 a osobitne uzavretý P5 označený „Úloha 5 – otvoriť po prekladači“.'},
    {id:'chair', label:'Obálka 4 s P6 je pod sedadlom dostupnej stoličky pri stole.'},
    {id:'media', label:'Overil som Pikovo video, Kvakovu hlasovú správu a hlasitosť telefónu.'},
    {id:'phone', label:'Telefón je nabitý, pripravený a tím môže začať.'}
  ].map(step => ({...step, required:true}));
  const memory = {};
  const adapter = {
    scope:'browser-local',
    read(id) {
      try {
        const saved = localStorage.getItem('zahada-prep-v5-' + id);
        if (saved !== null) return saved === '1';
        // Only equivalent old checks migrate. Old global placement does not attest each hiding place.
        const legacy = steps.find(step => step.id === id)?.legacy;
        return legacy !== undefined && localStorage.getItem('zahada-prep-' + legacy) === '1';
      } catch (_) { return memory[id] === true; }
    },
    write(id, checked) {memory[id] = checked;try { localStorage.setItem('zahada-prep-v5-' + id, checked ? '1' : '0'); } catch (_) {}}
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
