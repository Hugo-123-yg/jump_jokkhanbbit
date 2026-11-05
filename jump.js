(() => {
  'use strict';
  let dispose=null;
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
  window.JumpGame={destroy(){if(dispose){const cleanup=dispose;dispose=null;cleanup()}},mount(root){
    window.JumpGame.destroy();
    const R=window.JumpRules,app=root,shell=node('section','jg'),canvas=node('canvas','jg-canvas');
    app.classList.add('jump-mode');document.body.dataset.miniGame='jump';
    shell.setAttribute('aria-label','跳一跳小游戏');canvas.tabIndex=0;canvas.setAttribute('role','button');canvas.setAttribute('aria-label','跳一跳游戏区域，按住蓄力，松手起跳');
    const top=node('header','jg-top'),back=node('button','jg-back','‹'),best=node('span','jg-best');back.type='button';back.setAttribute('aria-label','选择角色');back.onclick=()=>showChooser();top.append(back,node('b','','跳一跳'),best);
    const scoreBoard=node('div','jg-score'),scoreText=node('strong','','0'),scoreLabel=node('span','','本次得分');scoreBoard.append(scoreText,scoreLabel);
    const hint=node('p','jg-hint','按住任意空白处蓄力，松手起跳'),celebration=node('div','jg-celebration');celebration.hidden=true;celebration.setAttribute('aria-live','polite');
    const over=node('div','jg-over');over.hidden=true;const card=node('section','jg-over-card'),final=node('strong'),restart=node('button','','再跳一次');restart.type='button';card.append(node('span','','本次得分'),final,restart);over.append(card);
    const live=node('span','jg-live');live.setAttribute('role','status');live.setAttribute('aria-live','polite');shell.append(canvas,top,scoreBoard,hint,celebration,over,live);root.replaceChildren(shell);
    const ctx=canvas.getContext('2d');if(!ctx){app.classList.remove('jump-mode');delete document.body.dataset.miniGame;root.replaceChildren(node('p','','当前浏览器暂不支持游戏画面'));return}
    let width=390,height=780,viewScale=1,worldHeight=780,score=0,record=0,platforms=[],current,target,player,camera;
    let selected='hanbbit';
    let phase='ready',holdStart=0,pressure=0,activePointer=null,keyHeld=false,flight=null,chargeValue=0,raf=0,alive=true,last=0,pausedAt=null,vibrationStep=0;
    let particles=[],celebrationEnd=0,landingPulse=0,failStart=0;
    const pointers=new Set(),listeners=[];
    try{record=Number(localStorage.getItem('phone-jump-best')||0)||0}catch{}
    const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options))};
    function vibrate(ms){try{if(navigator.vibrate)navigator.vibrate(ms)}catch{}}
    function readPressure(e){return e.pointerType==='pen'||e.pointerType==='touch'?Math.max(0,Number(e.pressure)||0):0}
    function resize(){const rect=shell.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;viewScale=width/390;worldHeight=height/viewScale;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr*viewScale,0,0,dpr*viewScale,0,0);}
    function reset(){score=0;scoreText.textContent='0';best.textContent='最佳 '+record;platforms=[{x:0,y:0,rx:64,ry:37,index:0,color:0}];current=platforms[0];target=R.next(current,1);platforms.push(target);player={x:current.x,y:current.y,air:0};camera={x:(current.x+target.x)*0.5,y:current.y};phase='ready';activePointer=null;keyHeld=false;pointers.clear();flight=null;chargeValue=0;pressure=0;particles=[];over.hidden=true;celebration.hidden=true;celebrationEnd=0;landingPulse=0;hint.textContent='按住任意空白处蓄力，松手起跳';live.textContent='游戏开始，按住蓄力，松手起跳';}
    function startHold(force){if(!chooser.hidden||phase!=='ready'||pausedAt!==null)return false;phase='charging';holdStart=performance.now();pressure=force;vibrationStep=0;hint.textContent='按得越久，跳得越远';return true}
    function cancelHold(){if(phase==='charging'){phase='ready';chargeValue=0;hint.textContent='蓄力已取消，重新按住即可'}activePointer=null;keyHeld=false;pressure=0;}
    function release(){if(phase!=='charging')return;const power=R.charge(performance.now()-holdStart,pressure),distance=R.distance(power),gap=Math.hypot(target.x-player.x,target.y-player.y);flight={from:{x:player.x,y:player.y},to:{x:player.x+(target.x-player.x)/gap*distance,y:player.y+(target.y-player.y)/gap*distance},start:performance.now(),duration:480+power*180};phase='jumping';activePointer=null;keyHeld=false;chargeValue=0;vibrate(8);}
    function celebrate(now){celebration.replaceChildren(node('span','','✦'),node('strong','','锐因99'),node('small','',score+' 分 · 特别时刻'));celebration.hidden=false;celebrationEnd=now+3000;live.textContent=score+'分！锐因99';vibrate([20,55,20]);particles=[];for(let burst=0;burst<5;burst++){const x=40+Math.random()*310,y=170+Math.random()*140;for(let i=0;i<34;i++){const a=i/34*Math.PI*2,speed=35+Math.random()*140;particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,age:-burst*.15,life:1.8+Math.random()*.8,color:['#f5bd58','#ef7892','#84b5a2','#ffffff','#b7a1e3'][i%5]})}}}
    function finishJump(now){const result=R.result(score,flight.to,target);player={...flight.to,air:0};flight=null;
      if(!result.landed){phase='falling';failStart=now;hint.textContent='再试一次，找到自己的节奏';vibrate(25);return}
      score=result.score;scoreText.textContent=String(score);if(score>record){record=score;best.textContent='最佳 '+record;try{localStorage.setItem('phone-jump-best',String(record))}catch{}}
      current=target;target=R.next(current,score+1);platforms.push(target);if(platforms.length>8)platforms.shift();phase='ready';landingPulse=1;hint.textContent='稳稳落下，再向前一步';if(result.celebrate)celebrate(now);else live.textContent=score+'分';
    }
    function xy(p){return {x:195+p.x-camera.x,y:worldHeight*.64+p.y-camera.y}}
    function diamond(x,y,rx,ry){ctx.beginPath();ctx.moveTo(x,y-ry);ctx.lineTo(x+rx,y);ctx.lineTo(x,y+ry);ctx.lineTo(x-rx,y);ctx.closePath()}
    function platform(p){const q=xy(p),s=p===current&&phase==='charging'?chargeValue:0,y=q.y+s*7,depth=23-s*5;const palette=[['#8cb5a1','#618776','#739d88'],['#e6bf83','#b69160','#cfaa71'],['#b6b4d4','#8485a8','#9d9dbe'],['#a6c2d1','#7394a7','#89abbe'],['#d5ada6','#aa8179','#bf9690']][p.color];
      ctx.fillStyle='#274d3a10';ctx.beginPath();ctx.ellipse(q.x+3,q.y+depth+15,p.rx*.9,p.ry*.6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=palette[1];ctx.beginPath();ctx.moveTo(q.x-p.rx,y);ctx.lineTo(q.x,y+p.ry);ctx.lineTo(q.x,y+p.ry+depth);ctx.lineTo(q.x-p.rx,y+depth);ctx.closePath();ctx.fill();
      ctx.fillStyle=palette[2];ctx.beginPath();ctx.moveTo(q.x+p.rx,y);ctx.lineTo(q.x,y+p.ry);ctx.lineTo(q.x,y+p.ry+depth);ctx.lineTo(q.x+p.rx,y+depth);ctx.closePath();ctx.fill();ctx.fillStyle=palette[0];diamond(q.x,y,p.rx,p.ry);ctx.fill();
      if(p===current&&landingPulse>0){ctx.strokeStyle='rgba(68,122,93,'+landingPulse*.45+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,y,22+(1-landingPulse)*30,12+(1-landingPulse)*16,0,0,Math.PI*2);ctx.stroke()}
    }
    function character(now){
      const foot=xy(player),s=phase==='charging'?chargeValue:0,fall=phase==='falling'?Math.min(1,(now-failStart)/450):0;
      const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()};
      ctx.save();ctx.globalAlpha=1-fall*.8;oval(foot.x,foot.y+3,12+player.air*.02,4+player.air*.006,'#385d3824');ctx.translate(foot.x,foot.y-player.air+s*7+fall*70);if(fall)ctx.rotate(fall*.8);ctx.scale(1+s*.17,1-s*.23);
      window.JumpDolls.draw(ctx,selected,{air:player.air,time:now});ctx.restore();
    }
    function paint(now,dt){ctx.clearRect(0,0,390,worldHeight);const bg=ctx.createLinearGradient(0,0,390,worldHeight);bg.addColorStop(0,'#f4f2e9');bg.addColorStop(1,'#e8eee3');ctx.fillStyle=bg;ctx.fillRect(0,0,390,worldHeight);ctx.fillStyle='#607e6720';for(let x=15;x<390;x+=30)for(let y=155;y<worldHeight-70;y+=30){ctx.beginPath();ctx.arc(x,y,0.7,0,Math.PI*2);ctx.fill()}
      const goalX=(current.x+target.x)*.5,goalY=current.y;camera.x+=(goalX-camera.x)*Math.min(1,dt*7);camera.y+=(goalY-camera.y)*Math.min(1,dt*7);
      for(const p of [...platforms].sort((a,b)=>a.y-b.y))platform(p);character(now);for(const p of particles){p.age+=dt;if(p.age<0||p.age>p.life)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=85*dt;p.vx*=Math.exp(-dt*.45);ctx.globalAlpha=Math.min(1,(p.life-p.age)*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    }
    function frame(now){if(!alive)return;raf=requestAnimationFrame(frame);if(pausedAt!==null)return;const dt=Math.min((now-(last||now))/1000,.04);last=now;
      if(phase==='charging'){chargeValue=R.charge(now-holdStart,pressure);const step=Math.floor(chargeValue*3);if(step>vibrationStep){vibrationStep=step;vibrate(7)}}
      if(phase==='jumping'){const t=Math.min(1,(now-flight.start)/flight.duration);player.x=flight.from.x+(flight.to.x-flight.from.x)*t;player.y=flight.from.y+(flight.to.y-flight.from.y)*t;player.air=Math.sin(t*Math.PI)*100;if(t>=1)finishJump(now)}
      if(phase==='falling'&&now-failStart>500){phase='over';final.textContent=String(score);over.hidden=false;live.textContent='游戏结束，得分'+score}
      landingPulse=Math.max(0,landingPulse-dt*2.8);if(!celebration.hidden&&now>celebrationEnd)celebration.hidden=true;paint(now,dt);
    }
    function prevent(e){if(e.cancelable)e.preventDefault()}
    function pointerDown(e){if(e.pointerType==='mouse'&&e.button!==0)return;prevent(e);pointers.add(e.pointerId);if(pointers.size>1){cancelHold();return}if(startHold(readPressure(e))){activePointer=e.pointerId;try{canvas.setPointerCapture(e.pointerId)}catch{}}}
    function pointerUp(e){pointers.delete(e.pointerId);if(e.pointerId!==activePointer)return;prevent(e);pressure=Math.max(pressure,readPressure(e));release()}
    function pointerCancel(e){pointers.delete(e.pointerId);if(e.pointerId===activePointer)cancelHold()}
    if(window.PointerEvent){listen(canvas,'pointerdown',pointerDown,{passive:false});listen(window,'pointerup',pointerUp,{passive:false});listen(window,'pointercancel',pointerCancel);listen(canvas,'lostpointercapture',e=>{if(e.pointerId===activePointer)cancelHold()});listen(canvas,'pointermove',e=>{if(e.pointerId===activePointer){prevent(e);pressure=Math.max(pressure,readPressure(e))}},{passive:false})}
    else{listen(canvas,'touchstart',e=>{prevent(e);if(e.touches.length!==1){cancelHold();return}startHold(Number(e.touches[0].force)||0)},{passive:false});listen(canvas,'touchend',e=>{prevent(e);if(e.touches.length===0)release()},{passive:false});listen(canvas,'touchcancel',cancelHold);listen(canvas,'mousedown',e=>{if(e.button===0){prevent(e);startHold(0)}});listen(window,'mouseup',release)}
    for(const type of ['contextmenu','selectstart','dragstart'])listen(shell,type,prevent,{passive:false});
    for(const type of ['touchstart','touchmove'])listen(canvas,type,prevent,{passive:false});
    listen(canvas,'keydown',e=>{if(e.code==='Space'){prevent(e);if(!e.repeat&&!keyHeld&&startHold(0))keyHeld=true}});listen(window,'keyup',e=>{if(e.code==='Space'&&keyHeld){prevent(e);release()}});
    listen(window,'blur',()=>{pointers.clear();cancelHold()});
    listen(document,'visibilitychange',()=>{if(document.hidden){pausedAt=performance.now();pointers.clear();cancelHold()}else if(pausedAt!==null){const elapsed=performance.now()-pausedAt;if(flight)flight.start+=elapsed;if(phase==='falling')failStart+=elapsed;celebrationEnd+=elapsed;pausedAt=null;last=0}});
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;if(observer)observer.observe(shell);listen(window,'resize',()=>{pointers.clear();cancelHold();resize()});
    const chooser=node('section','jg-chooser');chooser.setAttribute('aria-label','选择游戏角色');
    const choices=node('div','jg-choices'),play=node('button','jg-play','角色载入中…');play.type='button';play.disabled=true;let spritesReady=false;
    const choiceButtons=[];
    for(const [id,name] of [['hanbbit','HANBBIT'],['jjok','JJOK']]){
      const button=node('button','jg-choice'),preview=node('img','jg-doll-preview');button.type='button';button.setAttribute('aria-label','选择 '+name);preview.src=window.JumpDolls.sources[id];preview.alt=name;preview.draggable=false;
      button.append(preview,node('b','',name),node('span','jg-choice-mark','✓'));button.onclick=()=>{selected=id;updateChoice()};choiceButtons.push([id,button]);choices.append(button);
    }
    function updateChoice(){for(const [id,button] of choiceButtons)button.setAttribute('aria-pressed',String(id===selected));if(spritesReady)play.textContent='开始游戏'}
    function showChooser(){cancelHold();phase='choosing';over.hidden=true;celebration.hidden=true;chooser.hidden=false;scoreBoard.hidden=true;hint.hidden=true;canvas.tabIndex=-1;updateChoice()}
    play.onclick=()=>{if(!spritesReady)return;chooser.hidden=true;scoreBoard.hidden=false;hint.hidden=false;canvas.tabIndex=0;reset()};
    chooser.append(choices,play);shell.append(chooser);
    function loadSprites(){play.disabled=true;play.textContent='角色载入中…';window.JumpDolls.load().then(()=>{if(!alive)return;spritesReady=true;play.disabled=false;play.onclick=beginGame;updateChoice()}).catch(()=>{if(!alive)return;play.disabled=false;play.textContent='重新加载角色';play.onclick=()=>{loadSprites()}})}
    const beginGame=play.onclick;loadSprites();
    const change=node('button','jg-change','换个小伙伴');change.type='button';change.onclick=showChooser;card.append(change);
    restart.onclick=reset;resize();reset();showChooser();raf=requestAnimationFrame(frame);
    dispose=()=>{alive=false;cancelAnimationFrame(raf);for(const off of listeners)off();if(observer)observer.disconnect();pointers.clear();app.classList.remove('jump-mode');delete document.body.dataset.miniGame;};
  }};
})();
