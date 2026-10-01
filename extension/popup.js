'use strict';
const panel=BiliGlow.mountPanel(document.querySelector('#settings').attachShadow({mode:'open'}));
async function refreshStatus(){
  try{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const response=await chrome.tabs.sendMessage(tab.id,{type:'BILIGLOW_STATUS'});
    panel.setStatus(response.text,response.error);
    panel.setBarStatus(response.barStatus||'');
  }catch{panel.setStatus('打开 B 站视频；已打开的页面请刷新一次');}
}
refreshStatus();setInterval(refreshStatus,1200);
window.addEventListener('pagehide',()=>panel.flush());
