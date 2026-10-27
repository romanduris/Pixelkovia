/* Browser-local preparation adapter. Replace the adapter for future server sync. */
(() => {
  'use strict';
  const steps = [
    {id:'printed', label:'Materiály som stiahol a vytlačil.', required:true},
    {id:'placed', label:'Materiály som rozmiestnil po byte podľa rodičovského návodu.', required:true},
    {id:'device-understood', label:'Hru budeme hrať na tomto telefóne.', required:true}
  ];
  const storageKey=id=>'pixelkovia-preparation-'+id;
  const memory = {};
  const adapter = {
    scope:'browser-local',
    read(id) {
      try {
        const saved = localStorage.getItem(storageKey(id));
        if (saved !== null) return saved === '1';
        return false;
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
