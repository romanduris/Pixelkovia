import {cp,mkdir,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../admin/node_modules/esbuild/lib/main.js';
const root=fileURLToPath(new URL('../',import.meta.url));
async function files(directory,prefix=''){const list=[];for(const item of await readdir(directory,{withFileTypes:true})){const relative=prefix+item.name;if(item.isDirectory())list.push(...await files(path.join(directory,item.name),relative+'/'));else list.push(relative);}return list;}
export async function prepareProtected(output){
  const publicFiles=(await files(output)).filter(f=>!f.startsWith('_')).map(f=>'/'+f),inventory={};
  const code=['site-config.js','game-data.js','story-text.js','prep-store.js','print-materials.js','site-content.js','cipko-game.js','app.js','game-bridge.js'];
  const documents=[['/hra','game.html','run'],['/admin/storyboard','storyboard.html','admin'],['/materialy','printables.html','game'],['/kniznica/citat','library-read.html','customer']];
  const add=async(route,file,role,document=false)=>{const target=path.join(output,'_protected',file);await mkdir(path.dirname(target),{recursive:true});await cp(path.join(root,file),target);inventory[route]={file,role,document};};
  for(const file of code)await add('/'+file,file,'game');
  await add('/signal-print.css','signal-print.css','game');
  for(const [route,file,role]of documents)await add(route,file,role,true);
  for(const file of await files(path.join(root,'assets'))){
    if(!/\.(?:webp|png|svg|mp3|mp4|pdf|ttf|ico)$/.test(file))continue;
    const relative='assets/'+file;if(publicFiles.includes('/'+relative))continue;
    const role=/^books\/(before|after)-[123]\.webp$/.test(file)?'book-'+file.split('/')[1].split('-')[0]:file.startsWith('finale-production/')&&!file.endsWith('start-a.png')?'admin':'game';
    await add('/'+relative,relative,role);
  }
  await writeFile(path.join(output,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:[]}));
  await build({entryPoints:[path.join(root,'funnel/gateway.mjs')],outfile:path.join(output,'_worker.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',define:{PUBLIC_FILES:JSON.stringify(publicFiles),PRIVATE_FILES:JSON.stringify(inventory)}});
  await writeFile(path.join(root,'dist/deployment-inventory.json'),JSON.stringify({public:publicFiles,protected:inventory},null,2));
  console.log(`Protected deployment prepared: ${publicFiles.length} public files; ${Object.keys(inventory).length} authenticated routes.`);
}
