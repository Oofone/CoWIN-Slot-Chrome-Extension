// Module Imports

import {STATES, STATE_IDENTIFIER, NODES, API_PARAMS} from "./constants.js"

// DOM Objects

var root = document.getElementById(NODES.ROOT);
var idleNode = document.getElementById(NODES.FORM);
var pollingNode = document.getElementById(NODES.SEARCHING);
var resultNode = document.getElementById(NODES.FOUND);
var searchButton = document.getElementById("searchSlots");
var stopSearchButton = document.getElementById("stopSearch");

// Listeners and Callbacks Registration 

searchButton.onclick = function () {
  chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.POLLING]}); 
};

stopSearchButton.onclick = function() {
  chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.IDLE]})
};

chrome.storage.onChanged.addListener(function(change, area) {
  console.log("Storage Changed");
  console.log(change);
  if (area == "local") {
    loadPopup();
  }
});

// Render Functions

root.onload = function () {
  loadPopup()
};

function loadPopup() {
  chrome.storage.local.get(STATE_IDENTIFIER, function(storage) {
    //Notify that we get the value.
    var state = storage.STATE_IDENTIFIER;
    console.log('STATE_IDENTIFIER Value is ' + state);
    if (state === undefined) {
      chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.IDLE]}, loadIdle()); 
      return;
    } 

    if (state == STATES.POLLING) {
      loadPolling(); 
    } else if (state == STATES.FOUND) {
      loadFound();
    } else {
      loadIdle();
    }
  });
}

function loadIdle() {
  console.log("Loading Idle Page");
  hide(pollingNode);
  hide(resultNode);
  show(idleNode);
} 

function loadPolling() {
  console.log("Loading Polling Page");
  hide(idleNode); 
  hide(resultNode);
  show(pollingNode);
}

function loadFound() {
  console.log("Loading Found Page");
  hide(idleNode);
  hide(pollingNode);
  show(resultNode);
}

// Network Calls and Functions

// function getAPIStateOptions() {
//   chrome.storage.local.get(API_PARAMS, function(states) {
//     if (!states) {

//     }
//   };
// };

// Util Functions

function hide(element) {
  if (!element.classList.contains("gone")) {
    !element.classList.add("gone")
  }  
};

function show(element){
  if (element.classList.contains("gone")) {
    !element.classList.remove("gone")
  }  
};