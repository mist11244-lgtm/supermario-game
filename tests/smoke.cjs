const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
function harness(){
 const handlers={}, elements=new Map(); let raf,time=0;
 const context=new Proxy({}, {get:(target,key)=>target[key]||(()=>{}),set:(t,k,v)=>(t[k]=v,true)});
 function element(id){if(!elements.has(id))elements.set(id,{id,hidden:false,checked:true,open:false,dataset:{},style:{},classList:{add(){},remove(){}},listeners:{},addEventListener(type,fn){(this.listeners[type] ||= []).push(fn);},setAttribute(){},getContext(){return context;},focus(){},showModal(){this.open=true;},close(){this.open=false;},querySelectorAll(){return [...(this.innerHTML||'').matchAll(/data-character="(\d+)"/g)].map(m=>{const b=element('char'+m[1]);b.dataset.character=m[1];return b;});}});return elements.get(id);}
 const document={getElementById:element,createElement:()=>({width:0,height:0,getContext:()=>context}),querySelectorAll:()=>[],addEventListener:(k,f)=>handlers['doc:'+k]=f};
 const window={addEventListener:(k,f)=>handlers[k]=f};
 const sandbox={document,window,Path2D:class {moveTo(){}lineTo(){}closePath(){}},requestAnimationFrame:f=>raf=f,setInterval:()=>0,localStorage:{getItem:()=>null,setItem(){}},console};
 vm.runInNewContext(fs.readFileSync('dist/game.js','utf8'),sandbox);
 function tick(seconds){for(let n=0;n<Math.ceil(seconds*60);n++){time+=1000/60;raf(time);}}
 function key(code,down=true){handlers[down?'keydown':'keyup']({code,target:{matches:()=>false},preventDefault(){},repeat:false});}
 return {element,tick,key,state:()=>window.snowbell.getState(),click:id=>element(id).listeners.click.forEach(fn=>fn({}))};
}
const h=harness();
assert.equal(h.state().state,'select');
h.click('char3');assert.equal(h.state().selected,3,'character selection');
h.click('start');assert.equal(h.state().state,'countdown');h.tick(4);assert.equal(h.state().state,'racing');h.tick(3);assert(h.state().player.speed>70,'automatic acceleration');
h.key('ShiftLeft');h.key('ArrowRight');h.tick(1.5);assert(h.state().drift>.5,'drift charges while steering');h.key('ArrowRight',false);h.key('ShiftLeft',false);assert(h.state().player.boost>1,'releasing drift grants turbo');
h.click('pause');const paused=h.state();h.tick(2);assert.equal(h.state().elapsed,paused.elapsed,'pause freezes time');assert.equal(h.state().player.progress,paused.player.progress,'pause freezes movement');h.click('resume');h.tick(1);assert(h.state().elapsed>paused.elapsed);
h.click('pause');h.click('restart');assert.equal(h.state().state,'select');h.click('char0');h.click('start');h.tick(4);
let collected=false;for(let i=0;i<180;i++){h.tick(.5);if(h.state().item){collected=true;h.click('item');assert.equal(h.state().item,undefined,'item consumed');break;}}assert(collected,'a gift can be collected by driving');
h.tick(100);assert.equal(h.state().state,'finished','three lap race finishes');assert(h.state().player.progress>=3);assert(h.state().player.finishTime>0);assert.equal(h.state().racers.length,6);assert(h.element('results').innerHTML.includes('YOU'),'result highlights player');h.click('again');assert.equal(h.state().state,'select');
for(let i=0;i<6;i++){const race=harness();race.click('char'+i);race.click('start');race.tick(105);assert.equal(race.state().state,'finished','character '+i+' can finish all laps');assert.equal(race.state().selected,i);}
console.log('PASS: six characters, countdown, acceleration, steering/drift turbo, pause/resume, gift collection/use, 3-lap finish, results, restart.');


