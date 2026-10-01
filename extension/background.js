'use strict';
chrome.commands.onCommand.addListener(async command=>{
  if(command!=='toggle-ambient')return;
  const {enabled=true,privacyAccepted=false}=await chrome.storage.local.get(['enabled','privacyAccepted']);
  // Keyboard shortcuts must not bypass the in-product disclosure and consent.
  if(privacyAccepted!==true)return;
  await chrome.storage.local.set({enabled:!enabled});
});
