(() => {
  'use strict';
  const sources={hanbbit:'assets/jump-hanbbit-original.png',jjok:'assets/jump-jjok-original.png'},sprites={};
  let pending=null;
  function load(){
    if(pending)return pending;
    pending=Promise.all(Object.entries(sources).map(([id,src])=>new Promise((resolve,reject)=>{
      if(sprites[id])return resolve();
      const img=new Image();img.onload=()=>{sprites[id]=img;resolve()};img.onerror=()=>reject(new Error('角色图片未能加载'));img.src=src;
    }))).catch(error=>{pending=null;throw error});
    return pending;
  }
  window.JumpDolls={sources,load,draw(ctx,kind){const img=sprites[kind];if(!img)return;const height=72,width=height*img.naturalWidth/img.naturalHeight;ctx.drawImage(img,-width/2,-height,width,height)}};
})();
