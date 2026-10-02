const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
require('../extension/shared.js');
const B=globalThis.BiliGlow;
test('invalid stored settings cannot escape supported ranges or add keys',()=>{
  const s=B.sanitize({enabled:'yes',strength:Infinity,spread:-5,blur:900,fps:NaN,saturation:155.9,dark:false,arbitrary:'ignored'});
  assert.equal(s.enabled,true);assert.equal(s.strength,80);assert.equal(s.spread,30);assert.equal(s.blur,140);assert.equal(s.fps,24);assert.equal(s.saturation,156);assert.equal(s.dark,false);assert.ok(!('arbitrary'in s));
});
test('contained video geometry preserves letterbox and portrait placement',()=>{
  const actual=B.contentRect({left:100,top:50,width:1000,height:600},1920,1080);
  for(const [key,value] of Object.entries({left:100,top:68.75,width:1000,height:562.5})) assert.ok(Math.abs(actual[key]-value)<1e-8,key);
  assert.deepEqual(B.contentRect({left:0,top:0,width:960,height:540},1080,1920),{left:328.125,top:0,width:303.75,height:540});
  assert.deepEqual(B.contentRect({left:0,top:0,width:0,height:0},0,0),{left:0,top:0,width:0,height:0});
});
test('temporal blending has equal response at different frame rates',()=>{
  const alpha15=B.blendAlpha(1000/15,65),alpha30=B.blendAlpha(1000/30,65);
  assert.ok(Math.abs((1-alpha15)**15-(1-alpha30)**30)<1e-12);
  assert.equal(B.blendAlpha(20,0),1);assert.ok(B.blendAlpha(20,95)<B.blendAlpha(20,30));
});
test('theater projects past both viewport edges without changing normal spread',()=>{
  const r={left:200,top:100,width:1200,height:675},viewport={width:1600,height:900};
  const normal=B.glowGeometry(r,viewport,B.defaults);
  const wide=B.glowGeometry(r,viewport,B.defaults,'theater');
  assert.equal(normal.left,100);assert.equal(normal.width,1400);
  assert.ok(wide.left<0);assert.ok(wide.left+wide.width>viewport.width);
  assert.ok(wide.height>normal.height);assert.ok(wide.blur>normal.blur);
});
test('400% covers every viewport edge plus blur bleed for off-centre and scrolled players',async()=>{
  await B.storage.set({spread:400});
  assert.equal((await B.storage.get()).spread,400);
  assert.equal(B.sanitize({spread:999}).spread,400);
  const fixtures=[
    {r:{left:160.5,top:103.5,width:951,height:534.9375},vp:{width:1728,height:853}},
    {r:{left:300,top:160,width:1400,height:787.5},vp:{width:3440,height:1440}},
    {r:{left:36,top:-400,width:900,height:506.25},vp:{width:1024,height:1366}},
    {r:{left:1500,top:70,width:1080,height:607.5},vp:{width:3840,height:2160}}
  ];
  for(const {r,vp} of fixtures) for(const mode of ['normal','theater','fullscreen']) for(const blur of [20,72,140]) {
    const glow=B.glowGeometry(r,vp,{...B.defaults,spread:400,blur},mode);
    const bleed=glow.blur*3;
    assert.ok(glow.left<=-bleed,'left edge');
    assert.ok(glow.top<=-bleed,'top edge');
    assert.ok(glow.left+glow.width>=vp.width+bleed,'right edge');
    assert.ok(glow.top+glow.height>=vp.height+bleed,'bottom edge');
    const base=B.glowGeometry(r,vp,{...B.defaults,spread:100,blur},mode);
    assert.ok(glow.width>=base.width&&glow.height>=base.height);
    assert.ok(glow.width<=vp.width+bleed*2+base.width,'bounded render surface');
  }
  await B.storage.set(B.defaults);
});
test('increasing spread never shrinks any edge or introduces a jump at 100%',()=>{
  const r={left:160,top:100,width:950,height:535},vp={width:1728,height:900};
  for(const mode of ['normal','theater','fullscreen']) {
    let previous=B.glowGeometry(r,vp,{...B.defaults,spread:30},mode);
    for(let spread=31;spread<=400;spread++) {
      const next=B.glowGeometry(r,vp,{...B.defaults,spread},mode);
      assert.ok(next.left<=previous.left&&next.top<=previous.top);
      assert.ok(next.left+next.width>=previous.left+previous.width-1e-6);
      assert.ok(next.top+next.height>=previous.top+previous.height-1e-6);
      previous=next;
    }
    const before=B.glowGeometry(r,vp,{...B.defaults,spread:99.9999},mode);
    const after=B.glowGeometry(r,vp,{...B.defaults,spread:100.0001},mode);
    assert.ok(Math.abs(after.width-before.width)<.01&&Math.abs(after.height-before.height)<.01);
  }
});
test('storage patches preserve unrelated values',async()=>{
  await B.storage.set({strength:50});await B.storage.set({dark:false});
  const stored=await B.storage.get();assert.equal(stored.strength,50);assert.equal(stored.dark,false);
  await B.storage.set(B.defaults);
});
test('bar removal is opt-in when upgrading existing settings and rejects truthy non-booleans',()=>{
  const existing=B.sanitize({strength:100,spread:310,dark:true});
  assert.equal(existing.removeHorizontalBars,false);assert.equal(existing.removeVerticalBars,false);
  assert.equal(existing.detectColoredBars,false);assert.equal(existing.fillRemovedBars,false);
  const invalid=B.sanitize({removeHorizontalBars:'true',removeVerticalBars:1,detectColoredBars:[],fillRemovedBars:{}});
  assert.equal(invalid.removeHorizontalBars,false);assert.equal(invalid.removeVerticalBars,false);
  assert.equal(invalid.detectColoredBars,false);assert.equal(invalid.fillRemovedBars,false);
});
test('bar removal choices persist independently and survive light preset changes',async()=>{
  await B.storage.set({removeHorizontalBars:true,removeVerticalBars:true,detectColoredBars:true,fillRemovedBars:true});
  await B.storage.set({removeHorizontalBars:false});
  await B.storage.set(B.presets.vivid);
  const stored=await B.storage.get();
  assert.equal(stored.removeHorizontalBars,false);assert.equal(stored.removeVerticalBars,true);
  assert.equal(stored.detectColoredBars,true);assert.equal(stored.fillRemovedBars,true);
  assert.equal(stored.strength,100);assert.equal(stored.spread,310);
  await B.storage.set(B.defaults);
});
test('MV3 package references real files and only requests storage',()=>{
  const base=__dirname+'/../extension/';const m=JSON.parse(fs.readFileSync(base+'manifest.json'));
  assert.equal(m.manifest_version,3);assert.deepEqual(m.permissions,['storage']);assert.deepEqual(m.content_scripts[0].matches,['https://www.bilibili.com/*','https://live.bilibili.com/*']);
  for(const path of [...Object.values(m.icons),...m.content_scripts[0].js,...m.content_scripts[0].css,m.action.default_popup,m.background.service_worker])assert.ok(fs.existsSync(base+path),path);
});
