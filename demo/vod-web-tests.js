/* Browser regression using the production renderer with a real portrait stream.
   Run index.html?portrait=1 or watchlater.html?portrait=1, then inspect fullscreen. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s),B=window.BiliGlow,player=$('#player');
  // Match the observed site's fixed header z-index, including account UI.
  if(new URLSearchParams(location.search).has('portrait')){
    $('.bili-header__bar').style.cssText='position:fixed;top:0;left:0;width:100%;margin:0;padding:0 24px;z-index:1002';
    $('.badge').innerHTML='<img src="thumb-mountain.svg" alt="演示用户头像" style="width:28px;height:28px;border-radius:50%;vertical-align:middle"> 演示用户　消息　动态　稍后再看　收藏　历史';
  }
  const button=document.createElement('button');button.id='vod-web-tests';button.textContent='竖屏全屏专项自检';
  const output=document.createElement('output');output.id='vod-web-results';output.setAttribute('aria-live','polite');
  $('.checks').append(button,output);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function until(test){for(let i=0;i<50;i++){if(test())return;await wait(80);}throw new Error('状态未在 4 秒内就绪');}
  const root=()=> $('[data-biliglow-root]'),backdrop=()=> $('[data-biliglow-backdrop]');
  const visible=e=>e&&getComputedStyle(e).display!=='none';
  const frames=()=>Number(root()?.dataset.frames||0);
  function covered(){
    const e=backdrop();if(!visible(e))return false;
    const r=e.getBoundingClientRect(),s=getComputedStyle(e);
    // Fixed inset covers the drawable viewport, excluding a classic scrollbar.
    return r.left<=0&&r.top<=0&&r.right>=document.documentElement.clientWidth&&r.bottom>=innerHeight&&s.backgroundColor==='rgb(16, 20, 29)'&&s.opacity==='1';
  }
  function leave(){document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));}
  button.addEventListener('click',async()=>{
    const original=await B.storage.get();
    if(!B.isActive(original)){output.textContent='请先在设置中同意并开启氛围光';return;}
    button.disabled=true;output.dataset.state='running';const results=[];
    const check=(passed,label)=>{results.push({passed:Boolean(passed),label});output.textContent=results.map(r=>`${r.passed?'✓':'✗'} ${r.label}`).join('\n');};
    try{
      leave();window.scrollTo({top:0,behavior:'instant'});
      await B.storage.set({...B.defaults,privacyAccepted:original.privacyAccepted});
      await until(()=> $('video').videoHeight>0&&visible(root()));
      check($('video').videoWidth===540&&$('video').videoHeight===960,'媒体源为真实 9:16 竖屏比例');
      check(!backdrop(),'普通播放保持页面透光');
      $('#web-fullscreen').click();await until(()=>covered()&&root()?.dataset.mode==='fullscreen');
      check(root().parentElement===player&&backdrop().parentElement===player,'网页全屏光效与底板都挂在播放器内');
      check(covered(),'不透明底板覆盖视口两侧与上下留白');
      const header=$('.bili-header__bar'),hr=$('.badge').getBoundingClientRect();
      check(!header.contains(document.elementFromPoint(hr.right-30,hr.top+hr.height/2))&&Number(getComputedStyle(player).zIndex)>Number(getComputedStyle(header).zIndex),'固定顶部头像、用户名和导航位于全屏播放器后方');
      check(getComputedStyle(player).isolation==='isolate'&&Number(getComputedStyle(backdrop()).zIndex)<Number(getComputedStyle(root()).zIndex),'底板在光效之下，播放器之上仍保留内容层');
      check(getComputedStyle(backdrop()).pointerEvents==='none'&&backdrop().getAttribute('aria-hidden')==='true','底板不拦截点击且不进入无障碍内容');
      const input=$('.bpx-player-dm-input'),r=input.getBoundingClientRect();
      check(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===input,'弹幕输入区仍可命中');
      check(getComputedStyle($('video')).objectFit==='contain'&&getComputedStyle($('video')).transform==='none','画面保持完整比例且未增加缩放或裁切');
      const start=frames();await until(()=>frames()>start+2);check(true,'竖屏网页全屏继续绘制动态光色');
      $('video').pause();await wait(200);const paused=frames();await wait(300);
      check(frames()===paused&&covered()&&visible(root()),'暂停保留光色与遮挡并停止采样');await $('video').play();
      await B.storage.set({dark:false,strength:0});await wait(200);
      check(covered()&&getComputedStyle(root().shadowRoot.querySelector('canvas')).opacity==='0','浅色页面和零光强仍遮挡底层 UI');
      await B.storage.set({dark:true,strength:80});$('#replace').click();await until(()=>covered()&&visible(root())&&$('video').readyState>=2);
      check(document.querySelectorAll('[data-biliglow-backdrop]').length===1,'换片/替换播放器不会叠加底板');
      await B.storage.set({enabled:false});await until(()=>!backdrop());
      check(!player.hasAttribute('data-biliglow-stage'),'关闭氛围光立即释放全屏底板');
      await B.storage.set({enabled:true});await until(()=>covered()&&visible(root()));check(true,'重新开启恢复遮挡和光效');
      leave();await until(()=>!backdrop()&&root().parentElement===document.body);
      check(getComputedStyle($('.bpx-player-video-area')).backgroundColor==='rgba(0, 0, 0, 0)','退出全屏恢复普通页面透光');
      $('#theater').click();await until(()=>root()?.dataset.mode==='theater');check(!backdrop(),'宽屏模式不添加全屏底板');
      $('#theater').click();
    }catch(error){check(false,error.message);}
    finally{
      leave();await B.storage.set(original);button.disabled=false;
      output.dataset.state='complete';output.dataset.passed=String(results.every(r=>r.passed));
      output.dataset.total=String(results.length);output.dataset.failed=String(results.filter(r=>!r.passed).length);
    }
  });
})();
