import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const source=fileURLToPath(new URL('../rodulab/',import.meta.url));
export async function prepareRodulab(output){
  await mkdir(path.join(output,'assets'),{recursive:true});
  for(const file of ['index.html','style.css','studio.js','404.html','robots.txt','sitemap.xml','assets/mark.svg','assets/manrope.ttf','assets/OFL-Manrope.txt','assets/pixelkovia.jpg','assets/living-stones.jpg','assets/bts-flight-scaner.jpg','assets/social.jpg'])await copyFile(path.join(source,file),path.join(output,file));
  await copyFile(path.join(source,'gateway.mjs'),path.join(output,'_worker.js'));
  await writeFile(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:[]},null,2)+'\n');
}
