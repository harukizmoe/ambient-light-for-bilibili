const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const body={};
const context=vm.createContext({document:{body},innerWidth:1280,innerHeight:800,getComputedStyle:e=>({display:'block',visibility:'visible',opacity:'1',position:'static',...e.style})});
vm.runInContext(fs.readFileSync(__dirname+'/../extension/player.js','utf8'),context);
const P=context.BiliGlowPlayer;
test('only desktop room URLs and existing playback routes are enabled',()=>{
  for(const url of ['https://live.bilibili.com/25034104','https://live.bilibili.com/1/?broadcast_type=0'])assert.equal(P.pageKind(new URL(url)),'live');
  for(const path of ['/','/p/eden/area-tags','/blackboard/activity','/25034104/extra','/0'])assert.equal(P.pageKind({hostname:'live.bilibili.com',pathname:path}),null);
  assert.equal(P.pageKind(new URL('https://www.bilibili.com/video/BV1test')),'video');
  assert.equal(P.pageKind(new URL('https://www.bilibili.com/bangumi/play/ep1')),'video');
  assert.equal(P.pageKind(new URL('https://example.com/video/a')),null);
});
test('watch-later playback is a video route with either trailing-slash form and playback parameters',()=>{
  for(const path of ['/list/watchlater','/list/watchlater/']){
    for(const suffix of ['', '?bvid=BV1example', '?oid=123456789&t=42', '?bvid=BV1example&oid=123456789&t=42#reply123', '#t=90']){
      const url=new URL(`https://www.bilibili.com${path}${suffix}`);
      assert.equal(P.pageKind(url),'video',url.href);
    }
  }
});
test('watch-later support excludes non-playback pages, similar paths and other domains',()=>{
  for(const path of ['/', '/list/', '/list/watchlater-extra', '/list/watchlater/extra', '/list/watchlater//', '/list/watchlater.html', '/list/watchlater2', '/list/Watchlater/', '/watchlater/', '/list/watchlater%2F']){
    const url=new URL(`https://www.bilibili.com${path}?bvid=BV1example&oid=123&t=42#watchlater`);
    assert.equal(P.pageKind(url),null,url.href);
  }
  for(const hostname of ['live.bilibili.com','m.bilibili.com','bilibili.com','example.com','www.bilibili.com.example.com']){
    const url=new URL(`https://${hostname}/list/watchlater/?bvid=BV1example`);
    assert.equal(P.pageKind(url),null,url.href);
  }
});
const element=(width=960,height=540,parentElement=body,style={})=>({parentElement,style,getBoundingClientRect:()=>({left:0,top:0,width,height}),closest:()=>null});
test('live selection excludes gift/preview videos and hidden ancestors',()=>{
  const main=element(),hidden=element(2400,1400,element(2400,1400,body,{opacity:'0'}));
  let selector;
  const chosen=P.selectVideo({querySelectorAll(s){selector=s;return [hidden,main];}},'live');
  assert.equal(selector,'#live-player video');assert.equal(chosen,main);
  assert.equal(P.selectVideo({querySelectorAll:()=>[hidden]},'live'),null);
});
test('live web fullscreen is based on a fixed viewport ancestor, not a large normal player',()=>{
  const web=element(1280,800,body,{position:'fixed'}),v=element(1280,800,web);
  assert.equal(P.presentation(v,'live',null).stage,web);
  assert.equal(P.presentation(v,'live',null).mode,'fullscreen');
  web.style.position='relative';assert.equal(P.presentation(v,'live',null).stage,null);
  const native={tagName:'DIV',contains:el=>el===v};
  assert.equal(P.presentation(v,'live',native).native,true);
  assert.equal(P.presentation(v,'live',{tagName:'VIDEO',contains:()=>true}).native,false);
});
test('video wide and web modes retain the 0.5.3 mapping',()=>{
  let screen='wide';const container={getAttribute:()=>screen};
  const v={closest:()=>container};assert.equal(P.presentation(v,'video',null).mode,'theater');
  screen='web';assert.equal(P.presentation(v,'video',null).stage,container);
  screen='normal';assert.equal(P.presentation(v,'video',null).mode,'normal');
});
