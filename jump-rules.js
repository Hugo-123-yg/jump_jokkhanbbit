(function(scope){
  'use strict';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const milestones=[14,41,141,414];
  const rules={
    milestones,
    charge(elapsed,pressure=0){return clamp(elapsed/1100+Math.max(0,pressure-0.5)*0.18,0,1)},
    distance(charge){return 40+clamp(charge,0,1)*230},
    contains(point,platform){return Math.abs(point.x-platform.x)/platform.rx+Math.abs(point.y-platform.y)/platform.ry<=0.98},
    next(platform,index,random=Math.random){
      const direction=random()<0.5?-1:1,distance=125+random()*80;
      const progress=1-Math.exp(-Math.max(0,index-1)/90),rx=62-24*progress;
      return {x:platform.x+direction*distance*0.866,y:platform.y-distance*0.5,rx,ry:rx*36/62,index,color:index%5};
    },
    result(score,point,target){const landed=rules.contains(point,target);return {landed,score:score+Number(landed),celebrate:landed&&milestones.includes(score+1)}}
  };
  if(typeof module!=='undefined'&&module.exports)module.exports=rules;
  else scope.JumpRules=rules;
})(typeof window!=='undefined'?window:globalThis);
