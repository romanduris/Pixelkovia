// Optional authoring helper; install qrcode outside the repository and set QRCODE_MODULE.
const fs=require('node:fs/promises');
const path=require('node:path');
const vm=require('node:vm');
const QRCode=require(process.env.QRCODE_MODULE||'qrcode');
(async()=>{
  const root=path.resolve(__dirname,'..'),context={window:{}};
  vm.runInNewContext(await fs.readFile(path.join(root,'game-data.js'),'utf8'),context);
  const svg=await QRCode.toString(context.window.GAME.kvakQr,{type:'svg',errorCorrectionLevel:'M',margin:4,color:{dark:'#000000',light:'#ffffff'}});
  await fs.writeFile(path.join(root,'assets/kvak-qr.svg'),svg);
  console.log('Generated the printed QR for Kvak’s signal.');
})().catch(error=>{console.error(error);process.exit(1);});
