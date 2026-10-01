'use strict';
// Exercises the actual production controls and rendered preview, including time.
document.querySelector('#run-ui-tests').addEventListener('click',async event=>{
 const button=event.currentTarget,out=document.querySelector('#ui-results'),original=await BiliGlow.storage.get();
 const root=document.querySelector('#light').shadowRoot,preview=root.querySelector('.effect-preview');
 const video=root.querySelector('.preview-video'),glow=root.querySelector('.preview-glow');
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),results=[];
 const check=(condition,label)=>{results.push(`${condition?'✓':'✗'} ${label}`);out.textContent=results.join('\n');};
 const snapshot=canvas=>canvas.toDataURL();
 button.disabled=true;
 try{
  root.querySelector('[data-tab="light"]').click();preview.scrollIntoView({block:'center'});
  root.querySelector('[data-preset="vivid"]').click();await wait(200);
  check(root.querySelector('#strength').value==='100'&&root.querySelector('#spread').value==='310'&&root.querySelector('[data-preset="vivid"]').getAttribute('aria-pressed')==='true','绚彩预设为光强 100%、扩散 310%');
  await BiliGlow.storage.set({enabled:true,smoothing:0,spread:30});await wait(350);
  const narrow=glow.getBoundingClientRect().width;
  await BiliGlow.storage.set({spread:400});await wait(150);
  check(glow.getBoundingClientRect().width>narrow*1.8,'扩散增大时，预览光晕实际铺得更远');
  await BiliGlow.storage.set({enabled:false});await wait(150);
  const paused=snapshot(video),context=video.getContext('2d');
  check(Number(getComputedStyle(glow).opacity)===0&&context.getImageData(128,72,1,1).data[3]===255,'关闭光效仅隐藏外围光晕，中央画面保留');
  await wait(220);check(snapshot(video)===paused,'关闭光效后停止持续刷新预览');
  await BiliGlow.storage.set({enabled:true,strength:0});await wait(100);
  check(Number(getComputedStyle(glow).opacity)===0&&getComputedStyle(video).opacity==='1','零强度不影响中央画面的可见性');
  await BiliGlow.storage.set({strength:100});await wait(150);
  const moving=snapshot(video);let changed=false;
  for(let i=0;i<4;i++){await wait(300);changed ||= snapshot(video)!==moving;}
  check(changed,'开启时天空与山峦随时间缓慢变化');
  const filterBefore=getComputedStyle(glow).filter;
  await BiliGlow.storage.set({blur:140,saturation:50});await wait(150);
  check(getComputedStyle(glow).filter!==filterBefore&&getComputedStyle(video).filter==='none','柔化与饱和度只作用于外围光效');
  await BiliGlow.storage.set({smoothing:95});
  check(parseFloat(getComputedStyle(glow).transitionDuration)>0,'过渡平滑控制预览的过渡时长');
  root.querySelector('[data-tab="picture"]').click();await wait(100);
  const hidden=snapshot(video);await wait(220);
  check(snapshot(video)===hidden,'离开光效页后暂停隐藏预览');
  root.querySelector('[data-tab="light"]').click();await wait(220);
  check(snapshot(video)!==hidden,'回到光效页后恢复预览');
  root.querySelector('#enabled').click();await wait(50);
  check(!root.querySelector('#enabled').checked&&root.querySelector('[data-enabled-state]').textContent==='已关闭','总开关与状态文字同步');
  root.querySelector('.reset').click();await wait(80);
  const restored=await BiliGlow.storage.get();
  check(Object.keys(BiliGlow.defaults).every(key=>restored[key]===BiliGlow.defaults[key]),'恢复默认同时还原所有设置与开关');
 }catch(error){check(false,error.message);}finally{
  await BiliGlow.storage.set(original);button.disabled=false;
  out.dataset.passed=String(results.every(s=>s.startsWith('✓')));
  out.dataset.count=String(results.length);
 }
});
