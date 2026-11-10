export const preferenceKey='pixelkovia-admin-marketing-layout-v1';
const day=86400000;
const today=at=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);
const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const detailIds=['charts','filters','funnel-details','attribution','checks','source-facebook','source-instagram',...['visits','checkout','attempts','purchases','conversion'].map(id=>'kpi-'+id),...['revenue','costs','cac','addons','technical','access','refunds'].map(id=>'metric-'+id)];
export function normalizePreferences(saved,at=Date.now()){
  const result={selected:{period:'14'},open:['charts'],unique:false,sort:'visits',direction:'desc',periodPurchases:false};
  if(!saved||typeof saved!=='object'||Array.isArray(saved))return result;
  const f=saved.selected||{},current=today(at);
  if(['today','7','14','30','90'].includes(f.period))result.selected.period=f.period;
  if(['since','custom'].includes(f.period)&&validDate(f.from)&&f.from<=current){
    const last=f.period==='since'?current:f.to;
    if(validDate(last)&&last>=f.from&&Date.parse(last)-Date.parse(f.from)<=365*day)result.selected={period:f.period,from:f.from,...f.period==='custom'?{to:last}:{}};
  }
  const choices={source:['facebook_ads','instagram_ads','meta','facebook','instagram','influencer','direct','organic','unknown'],device:['mobile','desktop','tablet','unknown'],product:['game','books','combination']};
  for(const [key,values]of Object.entries(choices))if(values.includes(f[key]))result.selected[key]=f[key];
  if(typeof f.campaign==='string'&&/^[a-zA-Z0-9_. -]{1,80}$/.test(f.campaign))result.selected.campaign=f.campaign;
  if(Array.isArray(saved.open))result.open=[...new Set(saved.open.filter(id=>detailIds.includes(id)))];
  for(const key of ['unique','periodPurchases'])if(typeof saved[key]==='boolean')result[key]=saved[key];
  if(['label','visits','purchases','conversion','periodPurchases'].includes(saved.sort))result.sort=saved.sort;
  if(saved.direction==='asc')result.direction='asc';
  return result;
}
export function readPreferences(){
  try{
    const cookie=document.cookie.split(';').map(value=>value.trim()).find(value=>value.startsWith(preferenceKey+'='));
    if(cookie)return normalizePreferences(JSON.parse(decodeURIComponent(cookie.slice(preferenceKey.length+1))));
  }catch{}
  const defaults=normalizePreferences();
  // Preserve the existing graph customization when upgrading to cookie preferences.
  try{const graph=JSON.parse(localStorage.getItem('pixelkovia-admin-marketing-charts-v1'));if(typeof graph?.open==='boolean'&&typeof graph?.unique==='boolean'){defaults.open=graph.open?['charts']:[];defaults.unique=graph.unique;}}catch{}
  return defaults;
}
export function savePreferences(selected,ui){
  // Only filters and display settings; never report data or customer information.
  const value=normalizePreferences({...ui,selected,open:[...ui.open]});
  try{document.cookie=preferenceKey+'='+encodeURIComponent(JSON.stringify(value))+'; Path=/admin; Max-Age=31536000; Secure; SameSite=Strict';}catch{}
}
