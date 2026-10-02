/* Local synthetic stream and browser checks. The extension alone owns the light,
   page treatment, consent gate, player selection and rendering lifecycle. */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const stage=$('#fullscreen-container'),host=$('#live-player'),player=$('#live-player-ctnr');
  const source=document.createElement('canvas'),paint=source.getContext('2d');
  source.width=960;source.height=540;
  let scene='pink',portrait=false,stopped=false,web=false,stream=null,animationId=null,testRunning=false;
  const began=performance.now();
  const colors={
    pink:{base:'#302050',left:'#f4a6ce',right:'#8976e6',light:'#ffd6dc',water:'#5f427d',ink:'#35244e'},
    blue:{base:'#092944',left:'#51c8e0',right:'#4c6fdb',light:'#adeaf2',water:'#143e75',ink:'#153652'},
    dark:{base:'#040711',left:'#172138',right:'#231934',light:'#536078',water:'#070f20',ink:'#070b16'}
  };
  const currentVideo=()=>$('#synthetic-video');
  const frames=()=>Number($('[data-biliglow-root]')?.dataset.frames||0);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function until(predicate,message,timeout=5000){
    const start=performance.now();
    while(performance.now()-start<timeout){if(predicate())return;await wait(80);}
    throw new Error(message);
  }
  function draw(ms){
    const t=(ms-began)/1000,c=colors[scene],w=source.width,h=source.height;
    paint.setTransform(w/960,0,0,h/540,0,0);
    const sky=paint.createLinearGradient(0,0,960,540);sky.addColorStop(0,c.left);sky.addColorStop(.43,c.base);sky.addColorStop(1,c.right);
    paint.fillStyle=sky;paint.fillRect(0,0,960,540);
    for(let i=0;i<4;i++){
      const x=90+i*260+Math.sin(t*.16+i)*90,y=80+Math.cos(t*.2+i)*100;
      const glow=paint.createRadialGradient(x,y,0,x,y,330);glow.addColorStop(0,(i%2?c.right:c.left)+'b0');glow.addColorStop(1,c.base+'00');paint.fillStyle=glow;paint.fillRect(0,0,960,540);
    }
    // A bright arched window, rolling hills and gently moving water make changes
    // visible in both the video and the projected edge colors.
    paint.save();paint.translate(470+Math.sin(t*.16)*13,223);paint.fillStyle=c.light+'bb';paint.beginPath();paint.roundRect(-105,-155,210,265,[105,105,4,4]);paint.fill();
    paint.strokeStyle=c.light+'66';paint.lineWidth=2;paint.beginPath();paint.roundRect(-118,-168,236,290,[118,118,4,4]);paint.stroke();
    paint.fillStyle=c.base+'5c';paint.beginPath();paint.ellipse(28,-54,62,62,0,0,Math.PI*2);paint.fill();paint.restore();
    for(let i=0;i<5;i++){
      paint.beginPath();paint.moveTo(-20,350+i*37);
      for(let x=-20;x<=980;x+=15)paint.lineTo(x,338+i*36+Math.sin(x/160+t*.13+i*.8)*(30-i*3)+Math.cos(x/260+i)*28);
      paint.lineTo(980,540);paint.lineTo(-20,540);paint.closePath();paint.fillStyle=[c.right+'77',c.water+'66',c.water+'99',c.water+'cc',c.ink][i];paint.fill();
    }
    for(let i=0;i<20;i++){
      const x=300+Math.sin(i*7.3+t*.09)*135,y=360+i*7;
      paint.fillStyle=c.light+(scene==='dark'?'12':'28');paint.fillRect(x,y,60+Math.sin(i*2.6+t*.23)*35,1);
    }
    for(let side=0;side<2;side++){
      paint.save();paint.translate(side?970:-10,540);paint.scale(side?-1:1,1);
      for(let i=0;i<7;i++){
        const bend=40+Math.sin(t*.4+i)*5,height=130+i*28;
        paint.strokeStyle=c.ink+'b0';paint.lineWidth=3;paint.beginPath();paint.moveTo(i*17,0);paint.quadraticCurveTo(i*15+bend,-height*.45,i*18+bend,-height);paint.stroke();
        for(let j=1;j<4;j++){paint.save();paint.translate(i*17+bend*j/4,-height*j/4);paint.rotate((j%2?-1:1)*.75);paint.fillStyle=(i%2?c.left:c.right)+'88';paint.beginPath();paint.ellipse(j%2?-15:15,-9,27,10,0,0,Math.PI*2);paint.fill();paint.restore();}
      }
      paint.restore();
    }
    for(let i=0;i<38;i++){
      const x=(Math.sin(i*113)*.5+.5)*960,y=40+(Math.cos(i*31)*.5+.5)*260;
      paint.fillStyle=c.light;paint.globalAlpha=.15+(Math.sin(t*.6+i)*.5+.5)*.36;paint.beginPath();paint.arc(x,y,1+i%2*.5,0,Math.PI*2);paint.fill();
    }
    paint.globalAlpha=1;paint.textAlign='center';paint.fillStyle=scene==='dark'?'#9da3bd':'#fff4fb';paint.font='500 43px Georgia, serif';paint.fillText('Night Bloom',480,462);paint.font='10px sans-serif';paint.letterSpacing='3px';paint.fillText('S Y N T H E T I C   L I V E   S T U D I O',480,485);paint.letterSpacing='0px';
    if(!stopped&&!currentVideo()?.paused)$('#scene-clock').textContent=`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
    animationId=requestAnimationFrame(draw);
  }
  function setScene(next){scene=next;document.querySelectorAll('[data-scene]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scene===scene)));$('#scene-name').textContent=({pink:'01 / 粉紫花园',blue:'02 / 深海蓝',dark:'03 / 暗场'})[scene];}
  async function connect(video){video.srcObject=stream;video.muted=true;await video.play();}
  function makeVideo(){const video=document.createElement('video');video.id='synthetic-video';video.muted=true;video.autoplay=true;video.playsInline=true;video.setAttribute('aria-label','本地合成直播画面');return video;}
  function updatePlaybackUI(){const paused=currentVideo()?.paused;$('#pause-stream').textContent=paused?'继续画面':'暂停画面';$('#pause-stream').disabled=stopped;$('#room-status').innerHTML=`<i></i>${stopped?'已停播':paused?'已暂停':'本地播出'}`;$('.offline-overlay').hidden=!stopped;}
  async function reconnect(){let video=currentVideo();if(!video){video=makeVideo();host.prepend(video);}stopped=false;await connect(video);updatePlaybackUI();return video;}
  function stop(){const video=currentVideo();if(video){video.pause();video.srcObject=null;video.remove();}stopped=true;updatePlaybackUI();}
  async function replace(){const old=currentVideo();if(!old)return reconnect();const next=makeVideo();old.pause();old.srcObject=null;old.replaceWith(next);stopped=false;await connect(next);updatePlaybackUI();return next;}
  function setPortrait(on){portrait=on;source.width=on?540:960;source.height=on?960:540;stage.classList.toggle('fixture-portrait',on);$('#portrait-stream').setAttribute('aria-pressed',String(on));$('#portrait-stream').textContent=on?'返回横屏流':'切换竖屏流';$('#resolution-label').textContent=`${source.width} × ${source.height} · 30 fps`;window.dispatchEvent(new Event('resize'));}
  function setWeb(on){web=on;stage.classList.toggle('fixture-web-fullscreen',on);player.classList.toggle('webfullscreen',on);player.classList.toggle('normal',!on);player.dataset.screen=on?'web':'normal';$('#web-fullscreen').setAttribute('aria-pressed',String(on));$('#exit-web').hidden=!on;document.body.style.overflow=on?'hidden':'';window.dispatchEvent(new Event('resize'));}
  async function setHiddenPreview(on){const preview=$('#hidden-preview-video');preview.hidden=!on;$('#hidden-preview').setAttribute('aria-pressed',String(on));$('#hidden-preview').textContent=`隐藏超大预览：${on?'已开启':'已关闭'}`;if(on)await connect(preview);else{preview.pause();preview.srcObject=null;}}
  function error(message){$('#live-test-summary').textContent=message;}
  if(!source.captureStream){error('此浏览器不支持 Canvas captureStream，无法生成合成直播。');return;}
  draw(performance.now());stream=source.captureStream(30);reconnect().catch(e=>error(e.message));setHiddenPreview(true).catch(e=>error(e.message));
  document.querySelectorAll('[data-scene]').forEach(button=>button.addEventListener('click',()=>setScene(button.dataset.scene)));
  $('#pause-stream').addEventListener('click',async()=>{const video=currentVideo();if(!video)return;if(video.paused)await video.play();else video.pause();updatePlaybackUI();});
  $('#stop-stream').addEventListener('click',stop);$('#reconnect-stream').addEventListener('click',()=>reconnect().catch(e=>error(e.message)));
  $('#replace-video').addEventListener('click',()=>replace().catch(e=>error(e.message)));
  $('#portrait-stream').addEventListener('click',()=>setPortrait(!portrait));$('#web-fullscreen').addEventListener('click',()=>setWeb(!web));$('#exit-web').addEventListener('click',()=>setWeb(false));
  $('#hidden-preview').addEventListener('click',()=>setHiddenPreview($('#hidden-preview-video').hidden).catch(e=>error(e.message)));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&web)setWeb(false);});
  const alpha=element=>{const color=getComputedStyle(element).backgroundColor;const match=color.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/);return color==='transparent'?0:match?Number(match[1]):1;};
  const visible=element=>Boolean(element&&getComputedStyle(element).display!=='none'&&getComputedStyle(element).visibility!=='hidden');
  async function runChecks(){
    if(testRunning)return;
    const original=await BiliGlow.storage.get(),report=$('#live-test-report'),list=$('#live-test-results'),summary=$('#live-test-summary'),button=$('#run-live-tests');
    if(!original.privacyAccepted){report.dataset.state='needs-consent';delete report.dataset.passed;summary.textContent='请先在右下角氛围光设置中阅读说明，并亲自点击同意开启。';return;}
    testRunning=true;button.disabled=true;document.body.classList.add('fixture-testing');report.dataset.state='running';delete report.dataset.passed;list.replaceChildren();summary.textContent='正在测试；请保持此页面在前台。';
    const before={scene,portrait,web,stopped,paused:currentVideo()?.paused,hiddenPreview:!$('#hidden-preview-video').hidden,menuOpen:$('.sample-menu').open};
    const results=[];
    const check=(passed,label,detail='')=>{const item=document.createElement('li');item.dataset.passed=String(passed);item.dataset.check=label;item.textContent=`${passed?'✓':'✗'} ${label}${detail?' · '+detail:''}`;list.append(item);results.push({passed,label,detail});summary.textContent=`已检查 ${results.length} 项；${results.filter(result=>!result.passed).length} 项未通过`;};
    try{
      setWeb(false);setPortrait(false);setScene('pink');window.scrollTo({top:0,behavior:'instant'});await reconnect();await setHiddenPreview(true);
      await BiliGlow.storage.set({...BiliGlow.defaults,privacyAccepted:true,enabled:true,spread:400});
      await until(()=>currentVideo().readyState>=2&&visible($('[data-biliglow-root]')),'光层未在合成直播启动后出现');
      const root=$('[data-biliglow-root]'),glow=root.shadowRoot.querySelector('canvas');
      let start=frames();await wait(650);check(frames()>start+3,'播放时持续采样',`新增 ${frames()-start} 帧`);
      const surfaces=['#head-info-vm','#gift-control-vm','#aside-area-vm','#rank-list-ctnr-box','.chat-history-panel','#chat-history-list'];
      check(surfaces.every(selector=>alpha($(selector))===0),'标题、礼物区与聊天底板透光',surfaces.filter(selector=>alpha($(selector))!==0).join('，'));
      check(['#aside-area-vm','#chat-items','.chat-row','.chat-row p','.chat-avatar'].every(selector=>getComputedStyle($(selector)).opacity==='1'),'聊天文字与头像保持完整透明度 1');
      $('.sample-menu').open=true;check(alpha($('#protected-menu'))===1,'菜单保留不透明底色');$('.sample-menu').open=false;
      const covers=()=>{const r=glow.getBoundingClientRect(),blur=Number(glow.style.filter.match(/blur\(([\d.]+)px\)/)?.[1]||0);return blur>0&&r.left<=-blur*3+1&&r.top<=-blur*3+1&&r.right>=innerWidth+blur*3-1&&r.bottom>=innerHeight+blur*3-1;};
      check(covers(),'400% 扩散覆盖视口与模糊外沿');
      currentVideo().pause();await wait(250);start=frames();await wait(1250);check(frames()===start,'暂停停止采样，隐藏超大预览不抢占主播放器',`暂停期间新增 ${frames()-start} 帧`);
      await BiliGlow.storage.set({enabled:false});await wait(180);
      check(!document.documentElement.hasAttribute('data-biliglow-active')&&!document.documentElement.hasAttribute('data-biliglow-dark')&&!visible(root)&&surfaces.every(selector=>alpha($(selector))===1),'关闭光效恢复原生底色并隐藏光层');
      await BiliGlow.storage.set({enabled:true});await currentVideo().play();start=frames();await until(()=>frames()>start+2,'重新开启后没有恢复采样');check(true,'重新开启恢复采样');
      const previous=currentVideo();await replace();await wait(1300);start=frames();await wait(550);check(currentVideo()!==previous&&frames()>start&&document.querySelectorAll('[data-biliglow-root]').length===1,'替换 video 后重绑且仅有一个光层');
      stop();await wait(1300);check(!visible(root)&&!document.documentElement.hasAttribute('data-biliglow-active')&&!document.documentElement.hasAttribute('data-biliglow-dark'),'停播移除主播放器后停止光效，忽略隐藏预览');
      await reconnect();start=frames();await until(()=>frames()>start+2,'重连后未恢复采样');check(true,'重连直播后自动恢复采样');
      setPortrait(true);await until(()=>currentVideo().videoHeight>currentVideo().videoWidth,'流未切换到竖屏尺寸');await wait(200);start=frames();await wait(500);check(frames()>start&&getComputedStyle(currentVideo()).objectFit==='contain','竖屏流继续采样并保持画面比例');
      setWeb(true);const entered=performance.now();
      await until(()=>root.parentNode===stage&&root.dataset.mode==='fullscreen'&&visible(root)&&covers(),'竖屏网页全屏未完成布局/绘制',2000);
      const enterLatency=performance.now()-entered,r=stage.getBoundingClientRect();
      check(root.parentNode===stage&&stage.hasAttribute('data-biliglow-stage')&&root.dataset.mode==='fullscreen'&&Math.abs(r.left)<1&&Math.abs(r.top)<1&&Math.abs(r.width-innerWidth)<2&&Math.abs(r.height-innerHeight)<2,'网页全屏采用真实视口几何，光层挂载到 fullscreen-container');
      check(visible(root)&&covers()&&enterLatency<1000,'竖屏网页全屏在画面两侧保持氛围光',`布局就绪 ${Math.round(enterLatency)} ms`);
      const transitions=[];
      for(let i=0;i<5;i++){
        setWeb(false);await wait(200);const before=frames(),t=performance.now();setWeb(true);
        await until(()=>root.parentNode===stage&&visible(root)&&covers()&&frames()>before,'反复全屏切换未恢复新帧',2000);
        transitions.push(Math.round(performance.now()-t));
      }
      check(transitions.every(ms=>ms<1000),'反复全屏切换及时恢复新帧与覆盖',transitions.join(' / ')+' ms');
      await BiliGlow.storage.set({removeHorizontalBars:true,removeVerticalBars:true,detectColoredBars:true,fillRemovedBars:true});await wait(1000);
      check(!currentVideo().hasAttribute('data-biliglow-bar-crop')&&!currentVideo().style.getPropertyValue('--biliglow-video-transform')&&!currentVideo().style.getPropertyValue('--biliglow-video-clip'),'直播保持原画，不应用点播自动去边');
      await BiliGlow.storage.set({enabled:false});await wait(180);check(!stage.hasAttribute('data-biliglow-stage')&&!visible(root),'网页全屏关闭光效后清除 stage 与光层');
      setWeb(false);setPortrait(false);await BiliGlow.storage.set({enabled:true,fps:8,removeHorizontalBars:false,removeVerticalBars:false});await wait(300);start=frames();await wait(1000);const delta=frames()-start;check(delta>=4&&delta<=10,'直播采样遵守 8 fps 上限',`1 秒绘制 ${delta} 次`);
    }catch(e){check(false,'自检中断',e.message);}
    finally{
      try{
        setWeb(before.web);setPortrait(before.portrait);setScene(before.scene);await setHiddenPreview(before.hiddenPreview);$('.sample-menu').open=before.menuOpen;
        if(before.stopped)stop();else{await reconnect();if(before.paused)currentVideo().pause();updatePlaybackUI();}
        await BiliGlow.storage.set(original);
        const restored=await BiliGlow.storage.get();check(Object.keys(original).every(key=>restored[key]===original[key]),'自检后完整还原原有设置');
      }catch(e){check(false,'还原测试状态失败',e.message);}
      testRunning=false;button.disabled=false;document.body.classList.remove('fixture-testing');report.dataset.state='complete';report.dataset.passed=String(results.length>0&&results.every(result=>result.passed));report.dataset.total=String(results.length);report.dataset.failed=String(results.filter(result=>!result.passed).length);list.dataset.passed=report.dataset.passed;
      summary.textContent=`${results.filter(result=>result.passed).length} / ${results.length} 项通过${report.dataset.passed==='true'?' · 已恢复原有设置':' · 详细失败项见下方'}`;
      window.liveTestResults=results;
    }
  }
  $('#run-live-tests').addEventListener('click',runChecks);
  // Exposed operations are the same ones as the visible controls, for reproducible
  // local browser checks. runChecks itself always enforces existing consent.
  window.liveFixture={runChecks,setScene,setPortrait,setWeb,reconnect,stop,replace,get video(){return currentVideo();},get source(){return source;}};
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(animationId);stream?.getTracks().forEach(track=>track.stop());});
})();
