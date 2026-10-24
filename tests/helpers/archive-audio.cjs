// Test the retained mobile player with unchanged archival recordings.
// Production keeps audio disabled until the new, name-free dubbing is supplied.
const configured=new WeakSet();
async function useArchivedAudio(context){
 if(configured.has(context))return;
 configured.add(context);
 await context.route('**/game-data.js',async route=>{
  const response=await route.fetch();
  await route.fulfill({response,body:await response.text()+
   '\nGAME.audio=GAME.archivedAudio.miky; GAME.plugyAudio=GAME.archivedAudio.plugy;'});
 });
}
module.exports={useArchivedAudio};
