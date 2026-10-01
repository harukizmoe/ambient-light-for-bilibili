'use strict';
const panel=BiliGlow.mountPanel(document.querySelector('#settings').attachShadow({mode:'open'}));
let statusRevision=0;
async function refreshStatus(settings){
  const revision=++statusRevision;
  try{
    const current=settings??await BiliGlow.storage.get();
    if(revision!==statusRevision)return;
    if(!current.privacyAccepted){panel.setStatus('尚未开启 · 请先确认本地处理说明');return;}
    if(!globalThis.chrome?.tabs?.query||!globalThis.chrome?.tabs?.sendMessage){
      panel.setStatus(current.enabled?'本地界面预览 · 请在 B 站播放页使用扩展':'本地界面预览 · 氛围光已关闭');
      return;
    }
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(revision!==statusRevision)return;
    const response=await chrome.tabs.sendMessage(tab.id,{type:'BILIGLOW_STATUS'});
    if(revision!==statusRevision)return;
    panel.setStatus(response.text,response.error);
    panel.setBarStatus(response.barStatus||'');
  }catch{if(revision===statusRevision)panel.setStatus('打开 B 站视频；已打开的页面请刷新一次');}
}
const unsubscribeStatus=BiliGlow.storage.subscribe(refreshStatus);
refreshStatus();setInterval(refreshStatus,1200);
window.addEventListener('pagehide',()=>{panel.flush();unsubscribeStatus();});
