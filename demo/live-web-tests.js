/* Regression for the observed fixed player + separate 300px chat sidebar.
   Uses production rendering/CSS. Visual occlusion is also checked in screenshots. */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector),F=window.liveFixture,B=window.BiliGlow;
  const button=$('#run-web-tests'),report=$('#live-test-report'),list=$('#live-test-results'),summary=$('#live-test-summary');
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function until(test){for(let i=0;i<40;i++){if(test())return;await wait(80);}throw new Error('状态未在 3.2 秒内就绪');}
  const root=()=> $('[data-biliglow-root]'),backdrop=()=> $('[data-biliglow-backdrop]');
  const count=()=>Number(root()?.dataset.frames||0),stage=()=>$('#fullscreen-container');
  const visible=e=>e&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';
  const covered=()=>{
    const e=backdrop();if(!visible(e))return false;
    const r=e.getBoundingClientRect(),s=getComputedStyle(e);
    return r.left<=0&&r.top<=0&&r.right>=innerWidth&&r.bottom>=innerHeight&&s.backgroundColor==='rgb(16, 20, 29)'&&s.opacity==='1';
  };
  button.addEventListener('click',async()=>{
    const original=await B.storage.get();
    if(!B.isActive(original)){summary.textContent='请先在设置中同意并开启氛围光';return;}
    button.disabled=true;$('#run-live-tests').disabled=true;report.dataset.state='running';list.replaceChildren();
    const results=[];
    const check=(ok,label)=>{const li=document.createElement('li');li.dataset.passed=String(Boolean(ok));li.textContent=`${ok?'✓':'✗'} ${label}`;list.append(li);results.push({passed:Boolean(ok),label});};
    try{
      F.setWeb(false);F.setPortrait(false);await F.reconnect();window.scrollTo({top:0,behavior:'instant'});
      await B.storage.set({...original,enabled:true,dark:true,strength:80});
      F.setWeb(true,true);await until(()=>root()?.dataset.mode==='fullscreen'&&covered()&&visible(root()));
      check(stage().getBoundingClientRect().width===innerWidth-300&&root().parentElement===stage(),'保留 300px 聊天栏的网页模式正确识别');
      check(covered(),'不透明底板覆盖整个视口，填住视频外留白');
      check(Number(getComputedStyle(backdrop()).zIndex)<Number(getComputedStyle(root()).zIndex)&&getComputedStyle(stage()).isolation==='isolate','底板、氛围光、播放器按顺序绘制');
      check(getComputedStyle(backdrop()).pointerEvents==='none'&&backdrop().getAttribute('aria-hidden')==='true','底板不拦截点击或进入无障碍内容');
      const aside=$('#aside-area-vm'),ar=aside.getBoundingClientRect();
      check(aside.contains(document.elementFromPoint(ar.left+20,ar.top+30))&&getComputedStyle(aside).opacity==='1','右侧聊天仍是可交互的最上层');
      const old=count();await until(()=>count()>old+2);check(true,'网页模式仍持续绘制新帧');
      const video=F.video;video.pause();await wait(200);const paused=count();await wait(300);
      check(count()===paused&&covered()&&visible(root()),'暂停保留光色和底板且停止采样');await video.play();
      await B.storage.set({dark:false,strength:0});await wait(200);
      check(covered()&&getComputedStyle(root().shadowRoot.querySelector('canvas')).opacity==='0','浅色页面与零光强仍遮挡底层页面');
      await B.storage.set({dark:true,strength:80});await F.replace();await until(()=>covered()&&visible(root())&&root().parentElement===stage());
      check(document.querySelectorAll('[data-biliglow-backdrop]').length===1,'替换播放器后恢复且不累积底板');
      await B.storage.set({enabled:false});await wait(200);
      check(!backdrop()&&!stage().hasAttribute('data-biliglow-stage'),'关闭光效立即移除底板并还原原生样式');
      await B.storage.set({enabled:true});await until(()=>covered()&&visible(root()));
      check(true,'网页模式中重新开启恢复光效与遮挡');
      F.setWeb(false);await until(()=>!backdrop()&&root().parentElement===document.body);
      check(getComputedStyle($('#head-info-vm')).backgroundColor==='rgba(0, 0, 0, 0)','退出网页模式后恢复普通直播透光');
      F.setPortrait(true);F.setWeb(true);await until(()=>covered()&&visible(root())&&F.video.videoHeight>F.video.videoWidth);
      check(stage().getBoundingClientRect().width===innerWidth&&covered(),'全宽网页全屏和竖屏视频仍有底板与光效');
      F.stop();await until(()=>!backdrop()&&!document.documentElement.hasAttribute('data-biliglow-active'));
      check(true,'全屏停播/移除视频后移除底板');
      await F.reconnect();await until(()=>covered()&&visible(root()));
      check(true,'重连直播后重新建立全屏背景');
    }catch(error){check(false,error.message);}
    finally{
      F.setWeb(false);F.setPortrait(false);await F.reconnect();await B.storage.set(original);
      button.disabled=false;$('#run-live-tests').disabled=false;
      report.dataset.state='complete';report.dataset.passed=String(results.every(r=>r.passed));report.dataset.total=String(results.length);report.dataset.failed=String(results.filter(r=>!r.passed).length);
      summary.textContent=`${results.filter(r=>r.passed).length} / ${results.length} 项通过 · 网页模式专项`;
    }
  });
})();
