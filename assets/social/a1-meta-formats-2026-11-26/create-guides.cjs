/* Composition references only; these are never final advertisements. */
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('../../../admin/node_modules/sharp');
const frames=[
 {id:'4x5',W:1080,H:1350,rect:[133,99,814,1073],copy:[76,95,928,320],game:[375,778,390,165],cta:1053},
 {id:'1x1',W:1080,H:1080,rect:[195,221,690,690],copy:[76,76,928,290],game:[421,657,280,103],cta:842},
 {id:'9x16',W:1080,H:1920,rect:[55,65,969,1722],copy:[76,288,928,385],game:[364,1120,400,227],cta:1498},
 {id:'191x1',W:1200,H:628,rect:[120,20,1040,544],copy:[84,44,500,445],game:[744,380,240,99],cta:490}
];
(async()=>{for(const f of frames){const[rX,rY,rW,rH]=f.rect,[x,y,w,h]=f.copy,[gX,gY,gW,gH]=f.game;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${f.W}" height="${f.H}"><rect width="100%" height="100%" fill="#101c2c"/><rect x="${rX}" y="${rY}" width="${rW}" height="${rH}" fill="#344756" stroke="#6cd4b0" stroke-width="4"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#142942" opacity=".8" stroke="#87b7e3" stroke-dasharray="12 8"/><rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="#d3c29c" stroke="#fff1bd" stroke-width="3"/><rect y="${f.cta}" width="100%" height="${f.H-f.cta}" fill="#633539" opacity=".75"/><g fill="#f4f5f5" font-family="sans-serif" font-size="${f.W===1200?23:25}"><text x="${x+14}" y="${y+35}">QUIET ROOM FOR LATER COPY</text><text x="${gX+8}" y="${gY+30}">PAPER + PHONE</text><text x="40" y="${f.cta+46}">ONLY CONTINUOUS TABLETOP - NO IMPORTANT CONTENT</text></g></svg>`;
 await fs.writeFile(path.join(__dirname,'sources','layout-guide_'+f.id+'.svg'),svg);
 await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname,'sources','layout-guide_'+f.id+'.png'));
}})().catch(e=>{console.error(e);process.exitCode=1});
