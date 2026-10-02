/* Playback adapters. Live rooms share rendering/settings with 0.5.3. */
(() => {
  'use strict';
  function pageKind({hostname,pathname}) {
    if(hostname==='localhost'||hostname==='127.0.0.1')return pathname==='/demo/live.html'?'live':'video';
    if(hostname==='live.bilibili.com')return /^\/[1-9]\d*\/?$/.test(pathname)?'live':null;
    return hostname==='www.bilibili.com'&&/^\/(video\/|bangumi\/play\/)/.test(pathname)?'video':null;
  }
  function selectVideo(scope,kind) {
    // Live pages also contain gift/preview videos outside the main player.
    const candidates=scope.querySelectorAll(kind==='live'?'#live-player video':'video');
    let best=null,area=0;
    for(const candidate of candidates){
      const r=candidate.getBoundingClientRect(),a=r.width*r.height;
      if(a<=area||r.width<160||r.height<90)continue;
      let hidden=false;
      for(let el=candidate;el;el=el.parentElement){
        const s=getComputedStyle(el);
        if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||Number(s.opacity)===0){hidden=true;break;}
      }
      if(!hidden){best=candidate;area=a;}
    }
    return best;
  }
  function presentation(video,kind,fullscreen,width=innerWidth,height=innerHeight){
    const native=Boolean(fullscreen&&video&&fullscreen.contains(video)&&fullscreen.tagName!=='VIDEO');
    if(native)return {stage:fullscreen,mode:'fullscreen',native};
    if(kind==='live'){
      // Observe layout, not unstable minified player class names. Only a fixed
      // ancestor filling the viewport can host the web-fullscreen glow.
      for(let el=video?.parentElement;el&&el!==document.body;el=el.parentElement){
        const r=el.getBoundingClientRect();
        if(getComputedStyle(el).position==='fixed'&&Math.abs(r.left)<=2&&Math.abs(r.top)<=2&&r.width>=width-2&&r.height>=height-2)
          return {stage:el,mode:'fullscreen',native:false};
      }
      return {stage:null,mode:'normal',native:false};
    }
    const container=video?.closest('.bpx-player-container'),screen=container?.getAttribute('data-screen');
    return {stage:screen==='web'?container:null,mode:screen==='web'?'fullscreen':screen==='wide'?'theater':'normal',native:false};
  }
  globalThis.BiliGlowPlayer=Object.freeze({pageKind,selectVideo,presentation});
})();
