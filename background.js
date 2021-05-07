// Redefining Constants since constants module seems to be un-importable in Background Scripts :(

var STATE_IDENTIFIER = 'STATE_IDENTIFIER'

var STATES = {
  POLLING: 'POLLING',
  IDLE: 'IDLE',
  FOUND: 'FOUND',
  OFF: 'OFF'
}

// Runtime Listeners

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.IDLE]});
});

chrome.runtime.onStartup.addListener(function() {
  chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.IDLE]});
});

chrome.runtime.onSuspend.addListener(function() {
  chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.IDLE]});
});
