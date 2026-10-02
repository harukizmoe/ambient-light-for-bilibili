'use strict';
for(const id of ['light','picture','more']){
  const root=document.getElementById(id).attachShadow({mode:'open'});
  const panel=BiliGlow.mountPanel(root);
  root.querySelector(`[data-tab="${id}"]`).click();
  panel.setStatus('本地预览 · 设置即时同步');
  panel.setBarStatus('进入宽屏并开启去边后自动检测');
}
BiliGlow.storage.set(BiliGlow.presets.vivid);
const launcher=document.querySelector('#launcher').attachShadow({mode:'open'});
launcher.innerHTML=`<style>${BiliGlow.css}</style><button class="launcher" aria-label="打开视频演示">${BiliGlow.mark}</button>`;
launcher.querySelector('button').addEventListener('click',()=>location.href='./');
