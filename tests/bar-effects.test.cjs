const test=require('node:test');
const assert=require('node:assert/strict');
const {geometry}=require('../extension/bar-effects.js');
const box={left:100,top:50,width:1200,height:675};
test('sidebars become transparent without changing the remaining picture size',()=>{
  const g=geometry(box,1920,1080,{top:0,bottom:0,left:.125,right:.125},false);
  assert.deepEqual(g.rect,{left:250,top:50,width:900,height:675});
  assert.equal(g.scale,1);
});
test('fill contains a cinematic picture and aligns the light mask to the transformed video',()=>{
  const g=geometry(box,1920,1080,{top:.125,bottom:.125,left:0,right:0},true);
  assert.deepEqual(g.rect,{left:100,top:134.375,width:1200,height:506.25});
  assert.equal(g.rect.width/g.rect.height,1920/810);
});
test('fill enlarges a windowboxed picture with no distortion or extra crop',()=>{
  const g=geometry(box,1920,1080,{top:.1,bottom:.1,left:.1,right:.1},true);
  assert.equal(g.scale,1.25);
  assert.deepEqual(g.rect,box);
  assert.equal(g.inset.left,120);
  assert.equal(g.inset.top,67.5);
});
test('asymmetric bars and a portrait source retain the complete remaining image',()=>{
  const g=geometry(box,1080,1920,{top:.1,bottom:.05,left:.05,right:.1},true);
  assert.ok(g.rect.left>=box.left&&g.rect.top>=box.top);
  assert.ok(g.rect.left+g.rect.width<=box.left+box.width+.001);
  assert.ok(Math.abs(g.rect.width/g.rect.height-1080/1920)<1e-8);
});
