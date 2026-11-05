(() => {
  'use strict';
  window.JumpGame.mount(document.getElementById('game'));
  window.addEventListener('pagehide',()=>window.JumpGame.destroy());
  window.addEventListener('pageshow',event=>{if(event.persisted)window.JumpGame.mount(document.getElementById('game'))});
})();
