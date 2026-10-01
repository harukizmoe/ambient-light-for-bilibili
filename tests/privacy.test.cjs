const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=name=>fs.readFileSync(`${__dirname}/../extension/${name}`,'utf8');
require('../extension/shared.js');
const B=globalThis.BiliGlow;

test('first install and 0.5.0 storage require consent without discarding existing choices',async()=>{
  const old={enabled:true,strength:101,spread:310,dark:false,removeVerticalBars:true};
  const writes=[];
  const context=vm.createContext({chrome:{storage:{local:{
    async get(){return {...old};},async set(patch){writes.push(patch);Object.assign(old,patch);}
  }}}});
  vm.runInContext(source('shared.js'),context);
  const api=context.BiliGlow;
  assert.equal(B.isActive(B.sanitize({})),false);
  for(const value of ['true',1,{},null])assert.equal(B.isActive(B.sanitize({privacyAccepted:value})),false);
  const upgraded=await api.storage.get();
  assert.equal(upgraded.privacyAccepted,false);
  assert.equal(api.isActive(upgraded),false);
  for(const [key,value] of Object.entries(old))assert.equal(upgraded[key],value,key);
  assert.equal(writes.length,0,'reading old settings must not rewrite them');
  await api.storage.set({privacyAccepted:true,enabled:true});
  assert.equal(api.isActive(await api.storage.get()),true);
  await api.storage.set({privacyAccepted:false});
  const revoked=await api.storage.get();
  assert.equal(api.isActive(revoked),false);
  assert.equal(revoked.strength,101);assert.equal(revoked.spread,310);
  assert.equal(revoked.dark,false);assert.equal(revoked.removeVerticalBars,true);
});

test('keyboard shortcut cannot grant or bypass missing, revoked, or invalid consent',async()=>{
  let command,stored={enabled:true},writes=0;
  const context=vm.createContext({chrome:{commands:{onCommand:{addListener(fn){command=fn;}}},storage:{local:{
    async get(){return {...stored};},async set(patch){writes++;Object.assign(stored,patch);}
  }}}});
  vm.runInContext(source('background.js'),context);
  for(const privacyAccepted of [undefined,false,'true',1]){
    stored={enabled:true,privacyAccepted};await command('toggle-ambient');
    assert.equal(writes,0);assert.equal(stored.enabled,true);
  }
  stored={enabled:true,privacyAccepted:true};await command('toggle-ambient');
  assert.equal(stored.enabled,false);assert.equal(writes,1);
  await command('toggle-ambient');assert.equal(stored.enabled,true);assert.equal(writes,2);
  stored.privacyAccepted=false;await command('toggle-ambient');assert.equal(writes,2);
});

test('toolbar popup does not query the active tab or its player status before consent',async()=>{
  let privacyAccepted=false,refresh,queries=0,messages=0;
  const context=vm.createContext({BiliGlow:{
    mountPanel:()=>({setStatus(){},setBarStatus(){},flush(){}}),storage:{get:async()=>({privacyAccepted}),subscribe:()=>()=>{}}
  },document:{querySelector:()=>({attachShadow(){return {};}})},window:{addEventListener(){}},
  setInterval(fn){refresh=fn;},chrome:{tabs:{
    async query(){queries++;return [{id:1}];},async sendMessage(){messages++;return {text:'播放中'};}
  }}});
  vm.runInContext(source('popup.js'),context);await new Promise(setImmediate);
  assert.equal(queries,0);assert.equal(messages,0);
  privacyAccepted=true;await refresh();assert.equal(queries,1);assert.equal(messages,1);
  privacyAccepted=false;await refresh();assert.equal(queries,1);assert.equal(messages,1);
});

test('HTTP popup preview updates consent and disabled status immediately without extension APIs',async()=>{
  let status,changed;
  const context=vm.createContext({BiliGlow:{
    mountPanel:()=>({setStatus(text){status=text;},setBarStatus(){},flush(){}}),
    storage:{get:async()=>({privacyAccepted:false,enabled:true}),subscribe(fn){changed=fn;return ()=>{};}}
  },document:{querySelector:()=>({attachShadow(){return {};}})},window:{addEventListener(){}},setInterval(){}});
  vm.runInContext(source('popup.js'),context);await new Promise(setImmediate);
  assert.match(status,/请先确认/);
  changed({privacyAccepted:true,enabled:true});
  assert.equal(status,'本地界面预览 · 请在 B 站播放页使用扩展');
  changed({privacyAccepted:true,enabled:false});
  assert.equal(status,'本地界面预览 · 氛围光已关闭');
  changed({privacyAccepted:false,enabled:false});
  assert.match(status,/请先确认/);
});

test('local and cross-tab revocation notify immediately and discard stale asynchronous settings reads',async()=>{
  let onChanged,revokes=0;const reads=[],received=[];
  const context=vm.createContext({chrome:{storage:{local:{
    get(){return new Promise(resolve=>reads.push(resolve));},async set(){}
  },onChanged:{addListener(fn){onChanged=fn;},removeListener(){}}}}});
  vm.runInContext(source('shared.js'),context);
  const api=context.BiliGlow;
  api.storage.subscribe(settings=>received.push(settings),{onRevoke(){revokes++;}});
  onChanged({enabled:{newValue:true}},'local');
  const write=api.storage.set({privacyAccepted:false});
  assert.equal(revokes,1,'local revoke does not await storage persistence');
  reads.shift()({privacyAccepted:true,enabled:true});await write;await Promise.resolve();
  assert.equal(received.length,0,'a pre-revoke read cannot re-enable processing');
  onChanged({privacyAccepted:{newValue:false}},'local');
  assert.equal(revokes,2,'other tabs stop before the follow-up settings read resolves');
  reads.shift()({privacyAccepted:false,enabled:true,spread:310});await new Promise(setImmediate);
  assert.equal(received.length,1);assert.equal(received[0].privacyAccepted,false);assert.equal(received[0].spread,310);
});

function contentHarness(initial,delayed=false){
  const counts={videoQueries:0,videoReads:0,draws:0,barSamples:0,barDisposals:0,cancelled:0};
  const rafs=new Map(),frames=new Map(),intervals=[];let nextId=0,onSettings,resolveInitial;
  class Element{
    constructor(tag){this.tagName=tag.toUpperCase();this.dataset={};this.style={setProperty(){},removeProperty(){}};this.attrs=new Map();this.children=[];this.events=new Map();this.isConnected=true;}
    append(child){child.parentNode=this;this.children.push(child);}
    setAttribute(key,value){this.attrs.set(key,value);}
    removeAttribute(key){this.attrs.delete(key);}
    hasAttribute(key){return this.attrs.has(key);}
    getAttribute(key){return this.attrs.get(key)||null;}
    toggleAttribute(key,on){if(on)this.attrs.set(key,'');else this.attrs.delete(key);}
    addEventListener(type,fn){this.events.set(type,fn);}
    removeEventListener(type){this.events.delete(type);}
    getBoundingClientRect(){return {left:0,top:0,right:1280,bottom:900,width:1280,height:900};}
    attachShadow(){this.shadowRoot=new Element('shadow');return this.shadowRoot;}
    set innerHTML(_html){this.holder=new Element('div');this.holder.hidden=true;this.launcher=new Element('button');}
    querySelector(selector){return selector==='.holder'?this.holder:selector==='.launcher'?this.launcher:null;}
    getContext(){return {drawImage(){counts.draws++;},globalAlpha:1};}
  }
  const video=new Element('video');
  const videoValues={paused:false,ended:false,readyState:4,videoWidth:1920,videoHeight:1080};
  for(const [key,value] of Object.entries(videoValues))Object.defineProperty(video,key,{get(){counts.videoReads++;return value;}});
  video.getBoundingClientRect=()=>{counts.videoReads++;return {left:100,top:100,right:1060,bottom:640,width:960,height:540};};
  video.closest=()=>null;
  video.requestVideoFrameCallback=fn=>{const id=++nextId;frames.set(id,fn);return id;};
  video.cancelVideoFrameCallback=id=>{counts.cancelled++;frames.delete(id);};
  const html=new Element('html'),body=new Element('body');
  const document={documentElement:html,body,hidden:false,fullscreenElement:null,
    createElement:tag=>new Element(tag),querySelector(){return null;},addEventListener(){},
    querySelectorAll(selector){if(selector==='video'){counts.videoQueries++;return [video];}return [];}
  };
  const initialPromise=delayed?new Promise(resolve=>{resolveInitial=resolve;}):Promise.resolve(B.sanitize(initial));
  const api={...B,storage:{get:()=>initialPromise,subscribe(fn){onSettings=fn;}}};
  const context=vm.createContext({BiliGlow:api,document,location:{hostname:'www.bilibili.com',pathname:'/video/example'},
    window:{addEventListener(){}},innerWidth:1280,innerHeight:900,
    getComputedStyle:()=>({objectFit:'contain',visibility:'visible'}),performance:{now:()=>100},console,
    requestAnimationFrame(fn){const id=++nextId;rafs.set(id,fn);return id;},
    setTimeout(fn){const id=++nextId;rafs.set(id,fn);return id;},clearTimeout(id){rafs.delete(id);},
    setInterval(fn){intervals.push(fn);},
    ResizeObserver:class{observe(){}disconnect(){}},MutationObserver:class{observe(){}disconnect(){}},
    BiliGlowVideoBars:{create(){return {crop:{top:0,bottom:0,left:0,right:0},configure(){},layout(){return null;},
      sample(){counts.barSamples++;},reset(){},dispose(){counts.barDisposals++;}};}}
  });
  vm.runInContext(source('content.js'),context);
  return {counts,html,body,frames,video,context,
    async ready(){await initialPromise;await Promise.resolve();},
    change(values){onSettings(B.sanitize(values));},
    resolveInitial(values){resolveInitial(B.sanitize(values));},
    flush(){const pending=[...rafs.values()];rafs.clear();for(const fn of pending)fn(120);},
    reconcile(){for(const fn of intervals)fn();}
  };
}

test('content script never queries a player until consent, and revocation stops queued work immediately',async()=>{
  const h=contentHarness({enabled:true,spread:310});
  await h.ready();h.flush();h.reconcile();
  assert.equal(h.counts.videoQueries,0);assert.equal(h.counts.videoReads,0);assert.equal(h.counts.draws,0);
  assert.equal(h.html.hasAttribute('data-biliglow-active'),false);
  assert.equal(h.html.hasAttribute('data-biliglow-dark'),false);
  h.change({privacyAccepted:true,enabled:true,spread:310});h.flush();
  assert.ok(h.counts.videoQueries>0);assert.ok(h.counts.draws>0);assert.ok(h.counts.barSamples>0);
  assert.equal(h.html.hasAttribute('data-biliglow-active'),true);
  assert.equal(h.html.hasAttribute('data-biliglow-dark'),true);
  assert.equal(h.frames.size,1);
  const lateFrame=[...h.frames.values()][0];
  h.change({privacyAccepted:false,enabled:true,spread:310});
  assert.equal(h.frames.size,0,'revoke cancels without waiting for the 1-second reconcile timer');
  assert.equal(h.video.events.size,0,'old player listeners are detached');
  assert.equal(h.counts.barDisposals,1);assert.ok(h.counts.cancelled>0);
  assert.equal(h.html.hasAttribute('data-biliglow-active'),false);
  assert.equal(h.html.hasAttribute('data-biliglow-dark'),false);
  const stopped={...h.counts};
  lateFrame(1000);h.flush();h.reconcile();
  assert.equal(h.counts.draws,stopped.draws);assert.equal(h.counts.barSamples,stopped.barSamples);
  assert.equal(h.counts.videoQueries,stopped.videoQueries);assert.equal(h.counts.videoReads,stopped.videoReads);
});

test('a stale startup storage result cannot restore consent after a newer revocation',async()=>{
  const h=contentHarness({},true);
  h.change({privacyAccepted:false,enabled:true});
  h.resolveInitial({privacyAccepted:true,enabled:true});await h.ready();h.flush();h.reconcile();
  assert.equal(h.counts.videoQueries,0);assert.equal(h.counts.draws,0);
  assert.equal(h.html.hasAttribute('data-biliglow-active'),false);
});
