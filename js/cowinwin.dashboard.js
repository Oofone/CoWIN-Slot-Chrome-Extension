// Module Imports

import {
  STATES, 
  STATE_IDENTIFIER, 
  NODES, 
  API_PARAMS,
  API_URLS,
  POLLING_SETTINGS,
  RESULT_STORE_KEYS
} from "./constants.js"

// DOM Objects

var root = document.getElementById(NODES.ROOT);
var idleNode = document.getElementById(NODES.FORM);
var pollingNode = document.getElementById(NODES.SEARCHING);
var resultNode = document.getElementById(NODES.FOUND);
var searchButton = document.getElementById("searchSlots");
var stopSearchButton = document.getElementById("stopSearch");
var restartSearchButton = document.getElementById("restartSearch");
var stateSelect = document.getElementById("state");
var citySelect = document.getElementById("city");
var pincodeInput = document.getElementById("pincode");
var errorDisplay = document.getElementById("pincodeError");

// Listeners and Callbacks Registration 

searchButton.onclick = function () {
  var formData = new FormData(document.getElementById("mainForm"));

  var locationSelector = formData.get("locationSelector");
  var ageGroup = formData.get("ageGroup");
  var pincode = formData.get("pincode");
  var state = formData.get("state");
  var city = formData.get("city");

  console.log(locationSelector + " " + ageGroup + " " + pincode + " " + state + " " + city );

  if (mainFormValidation(locationSelector, ageGroup, pincode, state, city)) {
    storeSearchProfile(locationSelector, ageGroup, pincode, state, city);
    chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.POLLING]}); 
  }
};

stopSearchButton.onclick = function() {
  chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.IDLE]})
};

restartSearchButton.onclick = function() {
  chrome.storage.local.set({[STATE_IDENTIFIER]: [STATES.POLLING]})
}

chrome.storage.onChanged.addListener( function(change, area) {
  if (area == "local" && Object.keys(change).includes(STATE_IDENTIFIER)) {
    console.log("STATE Changed");
    console.log(change);  
    loadPopup();
  }
});

stateSelect.addEventListener("change", function() {
  const value = stateSelect.value;
  if (value === "Unselected") {
    pincodeInput.disabled = false;
    clearCitySelect();
    document.getElementById("locationSelector").value = "missing";
  } else {
    hide(document.getElementById("stateError"));
    clearCitySelect();
    pincodeInput.disabled = true;
    const stateId = stateSelect.value;
    loadCityOptions(stateId);

    setLocationSelectorValue("region");
  }
});

citySelect.addEventListener("change", function() {
  const value = citySelect.value;
  if (citySelect.disabled === false && value === "Unselected") {
    show(document.getElementById("cityError"));
  } else {
    hide(document.getElementById("cityError"));
    hide(document.getElementById("eitherOrError"));
  }
});

pincodeInput.addEventListener("change", function() {
  const value = pincodeInput.value;
  if (value == "") {
    stateSelect.disabled = false;
    document.getElementById("locationSelector").value = "missing";
  } else {
    stateSelect.disabled = true;
    clearCitySelect();
    
    setLocationSelectorValue("pincode");
  }
});

pincodeInput.oninput = function(event) {
  const original = pincodeInput.value;
  pincodeInput.value = pincodeInput.value.replace(/[^0-9]/gi, '');

  if (original === pincodeInput.value) {
    hide(errorDisplay);
    hide(document.getElementById("pincodeInputError"));
    hide(document.getElementById("eitherOrError"));
  } else {
    show(errorDisplay);
  }
};

// Render Functions

root.onload = function () {
  loadPopup()
  hide(errorDisplay);
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
  getAPIStateOptions();
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
  setResults();
  hide(idleNode);
  hide(pollingNode);
  show(resultNode);
}

// Network Calls and Functions

function getAPIStateOptions() {
  chrome.storage.local.get(API_PARAMS.STATES, function(states) {
    if (states === undefined || !states || (Object.keys(states).length === 0 && states.constructor === Object)) {
      console.log("STATES not stored in storage, fetching from Server");
      const http = new XMLHttpRequest();
      const url = API_URLS.STATES;

      http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          console.log("STATES Call Succesful, with Response:");
          console.log(this.response);
          var response = (typeof this.response === "string")? JSON.parse(this.response) : this.response;
          const states = response;
          chrome.storage.local.set({[API_PARAMS.STATES]: states})
          updateStatesDropDown(states);
        }
      };

      http.open("GET", url);
      http.send();
    } else {
      console.log("STATES from storage used.");
      console.log(states);
      updateStatesDropDown(states[API_PARAMS.STATES]);
    }
  });
};

function loadCityOptions(stateId) {
  chrome.storage.local.get(API_PARAMS.REGIONS, function(cities) {
    if (cities === undefined || !cities[stateId]) {
      console.log("CITIES or Cities for {STATE_ID} not stored in storage, fetching from Server".replace("{STATE_ID}", String(stateId)));
      const http = new XMLHttpRequest();
      const url = API_URLS.CITIES.replace("{STATE_ID}", String(stateId));
      console.log("Querying at " + url);

      http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          console.log("CITIES Call Succesful with Response:");
          console.log(this.responseType + " " + this.response);
          var response = (typeof this.response === "string")? JSON.parse(this.response) : this.response;
          const districts = {[stateId]: response};
          cities = (cities) ? cities[API_PARAMS.REGIONS] : {};
          cities = { ...cities, ...districts};
          console.log("Updating storage for CITIES with:");
          console.log(cities);
          chrome.storage.local.set({[API_PARAMS.REGIONS]: cities})
          updateCitiesDropDown(cities, stateId);
        }
      };

      http.open("GET", url);
      http.send();
    } else {
      console.log("STATES from storage used.");
      updateCitiesDropDown(cities[API_PARAMS.REGIONS], stateId);
    }
  });
}

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

function storeSearchProfile(locationSelector, ageGroup, pincode, state, city) {
  chrome.storage.local.set({[POLLING_SETTINGS.LOCATION_TYPE]: locationSelector});
  chrome.storage.local.set({[POLLING_SETTINGS.AGE_GROUP]: ageGroup});
  chrome.storage.local.set({[POLLING_SETTINGS.PINCODE]: pincode});
  chrome.storage.local.set({[POLLING_SETTINGS.STATE]: state});
  chrome.storage.local.set({[POLLING_SETTINGS.CITY]: city});
}

function updateStatesDropDown(stored_states) {
  const states = stored_states.states;
  console.log("States being populated");
  console.log(states);
  for (var i = 0; i < states.length; i++){
    var state = states[i];
    var element = document.createElement("option");
    element.innerText = state.state_name;
    element.value = state.state_id;
    stateSelect.append(element);
  }
}

function updateCitiesDropDown(input_cities, stateId) {
  const cities = input_cities[stateId].districts;
  console.log("Cities being populated");
  console.log(cities);
  for (var i = 0; i < cities.length; i++){
    var city = cities[i];
    var element = document.createElement("option");
    element.innerText = city.district_name;
    element.value = city.district_id;
    citySelect.append(element);
  }
  citySelect.disabled = false;
}

function clearCitySelect() {
  citySelect.options.length = 0;
  var unselectedOption = document.createElement("option");
  unselectedOption.innerText = "Unselected";
  unselectedOption.value = "Unselected";
  citySelect.append(unselectedOption);
  citySelect.options[0].selected = 'selected';
  citySelect.disabled = true;
}

function setLocationSelectorValue(value) {
  document.getElementById("locationSelector").value = value;
}

function setResults() {
  chrome.storage.local.get(function(result) {
    var centerName = result[RESULT_STORE_KEYS.CENTER_NAME];
    var centerSlots = result[RESULT_STORE_KEYS.CENTER_SLOTS];
    var centerAddress = result[RESULT_STORE_KEYS.CENTER_ADDRESS];
    var centerPincode = result[RESULT_STORE_KEYS.CENTER_PINCODE];
    var centerBlock = result[RESULT_STORE_KEYS.CENTER_BLOCK];
    var centerCity = result[RESULT_STORE_KEYS.CENTER_CITY];
    var centerState = result[RESULT_STORE_KEYS.CENTER_STATE];

    document.getElementById("result-center").innerHTML = centerName;
    document.getElementById("result-slots").innerHTML = centerSlots;
    document.getElementById("result-address").innerHTML = centerAddress;
    document.getElementById("result-pincode").innerHTML = centerPincode;
    document.getElementById("result-block").innerHTML = centerBlock;
    document.getElementById("result-city").innerHTML = centerCity;
    document.getElementById("result-state").innerHTML = centerState;

    copyTextToClipboard(centerName);
  });
}

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Fallback: Copying text command was ' + msg);
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

// Validation functions

function mainFormValidation(locationSelector, ageGroup, pincode, state, city) {
  if (locationSelector === "region") {
    if (!state || state === undefined || state === "Unselected") {
      show(document.getElementById("stateError"));
      return false;
    }
    if (!city || city === undefined || city === "Unselected") { 
      show(document.getElementById("cityError"));
      return false;
    }
  } else if (locationSelector === "pincode") {
    if (!pincode || pincode === undefined || pincode.length < 6) {
      show(document.getElementById("pincodeInputError"));
      return false;
    }
  } else {
    show(document.getElementById("eitherOrError"));
    return false;
  }

  if (!ageGroup || ageGroup === undefined) {
    show(document.getElementById("ageGroupError"))
    return false;
  }

  return true;
}