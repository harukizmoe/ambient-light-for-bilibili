'use strict';
// Reproduce the actual Bilibili nesting and shadow boundaries, not just their appearance.
const sampleRegion=document.createElement('section');sampleRegion.className='surface-fixtures';
sampleRegion.innerHTML=`<div class="video-tag-container"><div class="tag-panel"><span class="bgm-tag"><button class="tag-link bgm-link"><svg class="tag-icon" width="14" height="14" viewBox="0 0 14 14"><path fill="currentColor" d="M4 2v7a2 2 0 1 0 1 2V4l6-1v5a2 2 0 1 0 1 2V1z"/></svg>发现《光随影动》</button></span><a class="tag-link" href="#surface-tests">氛围光</a><a class="tag-link" href="#surface-tests">风景</a><button class="show-more-btn" aria-label="展开标签">⌄</button></div></div><bili-comments></bili-comments><div class="fixture-actions"><button id="rebuild-comments">重建评论组件</button><button id="pin-comments">切换吸底评论栏</button><button id="surface-tests">透明组件自检</button><label>视频内边框 <select id="bar-fixture"><option value="none">无边框</option><option value="horizontal">上下黑边</option><option value="vertical">左右黑边</option><option value="colored">两侧彩色边框</option><option value="window">四周黑边</option><option value="black">全黑画面（不应裁切）</option></select></label><output id="surface-results"></output></div>`;
document.querySelector('.swatches').after(sampleRegion);
class DemoCommentBox extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'}).innerHTML=`<style>:host{display:block}#editor{background:#252d3b;border:1px solid #667080;border-radius:6px;padding:12px;min-height:48px;color:#e0e7f1}#editor:hover,#editor.active{background:#10141d}#editor:focus{outline:none}#emoji-popover{background:#191f2b;padding:8px;border-radius:4px;position:absolute;z-index:10}#emoji-popover[hidden]{display:none}.tool-btn{background:#10141d;color:inherit;border:1px solid #ffffff30;border-radius:4px;margin-top:8px}#footer{background:#10141d}</style><div id="comment-area"><div id="body"><div id="editor" contenteditable="true" role="textbox" aria-label="本地评论输入框">写下此刻的感受…</div></div><div id="footer"><button class="tool-btn">☺ 表情</button><div id="emoji-popover" hidden>🌟 🌙 🌈（菜单保留底色）</div></div></div>`;
    this.shadowRoot.querySelector('.tool-btn').addEventListener('click',()=>{const e=this.shadowRoot.querySelector('#emoji-popover');e.hidden=!e.hidden;});
  }
}
customElements.define('bili-comment-box',DemoCommentBox);
customElements.define('bili-comments-header-renderer',class extends HTMLElement{
  constructor(){super();this.attachShadow({mode:'open'}).innerHTML=`<style>:host{display:block}#navbar{margin:18px 0 12px;font-size:13px}.bili-comments-bottom-fixed-wrapper.pinned{position:fixed;bottom:0;left:8vw;width:60vw;z-index:20}.bili-comments-bottom-fixed-wrapper>div{padding:14px;background:#10141d;border-top:1px solid #283246}</style><div id="navbar">评论 · 本地透明测试</div><div class="bili-comments-bottom-fixed-wrapper"><div><bili-comment-box></bili-comment-box></div></div>`;}
});
customElements.define('bili-comments',class extends HTMLElement{constructor(){super();this.attachShadow({mode:'open'}).innerHTML='<bili-comments-header-renderer></bili-comments-header-renderer>';}});
const commentHeader=()=>sampleRegion.querySelector('bili-comments').shadowRoot.querySelector('bili-comments-header-renderer');
document.querySelector('#rebuild-comments').addEventListener('click',()=>commentHeader().replaceWith(document.createElement('bili-comments-header-renderer')));
document.querySelector('#pin-comments').addEventListener('click',()=>commentHeader().shadowRoot.querySelector('.bili-comments-bottom-fixed-wrapper').classList.toggle('pinned'));
const nested=document.createElement('div');nested.className='video-pod nested-collection';
nested.innerHTML=`<div class="video-pod__header">合集 · 嵌套分 P</div><div class="video-pod__body"><div class="video-pod__list section"><div class="pod-item video-pod__item simple"><div class="single-p"><button class="simple-base-item active normal"><i class="playing-gif">▥</i>极光漫游 <small>07:07</small></button></div></div><div class="pod-item video-pod__item simple"><div class="multi-p"><button class="simple-base-item head">深蓝时刻 · 分 P ⌄</button><div class="page-list simple"><button class="simple-base-item page-item active sub">▥ 第一章 <small>02:36</small></button></div></div></div></div></div>`;
document.querySelector('.video-pod').after(nested);
const recFooter=document.createElement('div');recFooter.className='recommend-list-v1';recFooter.innerHTML='<button class="rec-footer" aria-expanded="false">展开</button>';
document.querySelector('.rec-card').after(recFooter);
recFooter.querySelector('button').addEventListener('click',event=>{const e=event.currentTarget,on=e.getAttribute('aria-expanded')!=='true';e.setAttribute('aria-expanded',on);e.textContent=on?'收起':'展开';});
document.querySelector('#surface-tests').addEventListener('click',async()=>{
  const original=await BiliGlow.storage.get(),out=document.querySelector('#surface-results'),results=[];
  const check=(ok,label)=>{results.push(`${ok?'✓':'✗'} ${label}`);out.textContent=results.join('\n');};
  const roots=()=>{const header=commentHeader().shadowRoot;return {header,box:header.querySelector('bili-comment-box').shadowRoot};};
  const clear=e=>getComputedStyle(e).backgroundColor==='rgba(0, 0, 0, 0)';
  const backgrounds=()=>[...document.querySelectorAll('.bpx-player-dm-btn-history,.nested-collection .simple-base-item,.rec-footer,.video-tag-container .tag-link,.show-more-btn'),roots().header.querySelector('.bili-comments-bottom-fixed-wrapper>div'),roots().box.querySelector('#editor')];
  try{
    await BiliGlow.storage.set({enabled:false});
    const nativeBackgrounds=backgrounds().map(e=>getComputedStyle(e).backgroundColor);
    await BiliGlow.storage.set({enabled:true});await wait(1200);
    check(backgrounds().every(clear),'历史弹幕按钮、嵌套合集、推荐按钮、标签、Shadow DOM 评论栏全部透明');
    roots().box.querySelector('#editor').focus();
    check(clear(roots().box.querySelector('#editor'))&&getComputedStyle(roots().box.querySelector('#editor')).outlineStyle!=='none','评论输入聚焦时透明，保留键盘焦点提示');
    check(!clear(roots().box.querySelector('#emoji-popover')),'表情菜单仍有独立底色');
    check(getComputedStyle(document.querySelector('.tag-icon path')).fill!=='none'&&getComputedStyle(document.querySelector('#protected-thumbnail')).opacity==='1','标签图标与推荐缩略图未被淡化');
    document.querySelector('#rebuild-comments').click();await wait(1200);
    check(backgrounds().every(clear),'异步重建的评论组件自动恢复透明');
    document.querySelector('#pin-comments').click();
    check(clear(roots().header.querySelector('.bili-comments-bottom-fixed-wrapper>div')),'吸底状态没有新增实心底板');
    await BiliGlow.storage.set({enabled:false});await wait(100);
    roots().box.querySelector('#editor').blur();
    check(backgrounds().every((e,index)=>getComputedStyle(e).backgroundColor===nativeBackgrounds[index]),'关闭光效恢复原生背景');
    check(!roots().box.querySelector('[data-biliglow-comments]')&&!roots().header.querySelector('[data-biliglow-comments]'),'关闭后移除组件内注入样式');
  }finally{roots().header.querySelector('.bili-comments-bottom-fixed-wrapper').classList.remove('pinned');await BiliGlow.storage.set(original);out.dataset.passed=String(results.every(s=>s.startsWith('✓')));}
});
