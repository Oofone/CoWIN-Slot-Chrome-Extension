// Redefining Constants since constants module seems to be un-importable in Background Scripts :(

var POLLING_TIME_IN_MILLIS = 10000;

var STATE_IDENTIFIER = 'STATE_IDENTIFIER'

var POLLING_URL_BY_DISTRICT = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id={DISTRICT_ID}&date={DATE}";
var POLLING_URL_BY_PINCODE = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode={PINCODE}&date={DATE}"

var URL_PARAMS = {
  DISTRICT_ID: "{DISTRICT_ID}",
  PINCODE: "{PINCODE}",
  DATE: "{DATE}"
}

var STATES = {
  POLLING: 'POLLING',
  IDLE: 'IDLE',
  FOUND: 'FOUND',
  OFF: 'OFF'
}

var POLLING_SETTINGS = {
  LOCATION_TYPE: "LOCATION_TYPE",
  AGE_GROUP: "AGE_GROUP",
  PINCODE: "PINCODE",
  STATE: "STATE",
  CITY: "CITY",
}

var LOCATION_TYPE = {
  PINCODE: "pincode",
  REGION: "region"
}

var RESULT_STORE_KEYS = {
  CENTER_ID: "RESULT_CENTER_ID",
  CENTER_NAME: "RESULT_CENTER_NAME",
  CENTER_ADDRESS: "RESULT_CENTER_ADDRESS",
  CENTER_STATE: "RESULT_CENTER_STATE",
  CENTER_CITY: "RESULT_CENTER_CITY",
  CENTER_BLOCK: "RESULT_CENTER_BLOCK",
  CENTER_PINCODE: "RESULT_CENTER_PINCODE",
  CENTER_SLOTS: "RESULT_CENTER_SLOTS"
}

var months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
var daysOfMonth = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];

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

// Main polling loop

function poll () {
  
  // Action
  chrome.storage.local.get(STATE_IDENTIFIER, function (result) {
    console.log("Storage Result: ");
    console.log(result);
  
    var appState = result[STATE_IDENTIFIER][0];
    console.log(appState);
    if (appState === STATES.POLLING) {

      console.log("Polling Mode Enabled: Searching for Parameters: ");
  
      chrome.storage.local.get(function(result) {
        var locationSelection = result[POLLING_SETTINGS.LOCATION_TYPE];
        var ageSelection = result[POLLING_SETTINGS.AGE_GROUP];
        var pincode = result[POLLING_SETTINGS.PINCODE];
        var state = result[POLLING_SETTINGS.STATE];
        var city = result[POLLING_SETTINGS.CITY];
  
        console.log(locationSelection + " " + ageSelection + " " + pincode + " " + state + " " + city);
        var currentDate = new Date();
  
        var month = months[currentDate.getMonth()];
        var dayOfMonth = daysOfMonth[currentDate.getDate() - 1];
        var year = currentDate.getFullYear();
  
        var dateString = dayOfMonth + "-" + month + "-" + year;
        var url = "";

        console.log("Current Date: " + currentDate + " Date Data: " + currentDate.getDay() + " " + currentDate.getMonth() + " " + currentDate.getFullYear() + " " + dateString);
  
        if (locationSelection === LOCATION_TYPE.PINCODE) {
          url = POLLING_URL_BY_PINCODE.replace(URL_PARAMS.PINCODE, pincode).replace(URL_PARAMS.DATE, dateString);
        } else if (locationSelection == LOCATION_TYPE.REGION) {
          url = POLLING_URL_BY_DISTRICT.replace(URL_PARAMS.DISTRICT_ID, city).replace(URL_PARAMS.DATE, dateString);
        } else {
          console.log("location selection [" + locationSelection + "] is unknown");
          return;
        }
  
        console.log("URL for Polling: " + url);
        getCall(url).then(response => {
          // console.log("Response: ");
          // console.log(response);
  
          updateDatastoresAndState(response.centers, ageSelection);
        });
      });
    }
  });

  console.log("Action Complete. Waiting 10 Seconds.")

  // Relay
  sleep(POLLING_TIME_IN_MILLIS).then(() => poll());
}

// Network Calls
async function getCall(url = '') {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

// Utility Functions 
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateDatastoresAndState(centers, ageSelection) {
  var maxSlotsSoFar = 0;
  var bestCenter = undefined;
  for (var centerIndex = 0; centerIndex < centers.length; centerIndex++) {
    
    var center = centers[centerIndex];
    // console.log("Checking center: " + center.name);

    var slotsForSession = centerFilter(center, ageSelection);
    if (slotsForSession !== undefined) {
      console.log("Found a Center! Name: " + center.name + " Slots: " + slotsForSession);
      if (slotsForSession > maxSlotsSoFar) {
        bestCenter = center; 
        maxSlotsSoFar = slotsForSession;
      }
    }
  }

  updateStoresForCenter(bestCenter, maxSlotsSoFar);
}

function updateStoresForCenter(center, slots) {
  if (center === undefined) {
    return;
  }

  chrome.storage.local.set({[STATE_IDENTIFIER]: STATES.FOUND});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_ID]: center.center_id});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_NAME]: center.name});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_ADDRESS]: center.address});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_STATE]: center.state_name});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_CITY]: center.district_name});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_BLOCK]: center.block_name});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_PINCODE]: center.pincode});
  chrome.storage.local.set({[RESULT_STORE_KEYS.CENTER_SLOTS]: slots});
}

function centerFilter(center, ageSelection) {
  var slots = 0;
  for (var sessionIndex = 0; sessionIndex < center.sessions.length; sessionIndex++) {
    var session = center.sessions[sessionIndex];
    if (session.available_capacity > 0 && doesAgeMatch(session.min_age_limit, ageSelection)) {
      // console.log("Session matches age limit: " + center.name + " Capacity= " + session.available_capacity);
      slots += parseInt(session.available_capacity);
    }
  }

  if (slots === 0) {
    // console.log("No fitting slots");
    return undefined;
  } else {
    // console.log("slots for Center: " + slots);
    return slots;
  }
}

function doesAgeMatch(min_age_limit, ageSelection) {
  if (ageSelection === "eighteenPlus") {
    return min_age_limit === 18;
  } else if (ageSelection === "fortyFivePlus") {
    return min_age_limit === 45;
  }

  return false;
}

// Start

poll();