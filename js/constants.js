// Constants Declared in this module

export const STATE_IDENTIFIER = 'STATE_IDENTIFIER'

export const STATES = {
  POLLING: 'POLLING',
  IDLE: 'IDLE',
  FOUND: 'FOUND',
  OFF: 'OFF'
}

export const NODES = {
  ROOT: 'root',
  FORM: 'formDisplay',
  SEARCHING: 'pollingDisplay',
  FOUND: 'foundDisplay'
}

export const API_PARAMS = {
  STATES: 'API_STATES',
  REGIONS: 'API_REGIONS'
}

// URLs

export const API_URLS = {
  STATES: "https://cdn-api.co-vin.in/api/v2/admin/location/states",
  CITIES: "https://cdn-api.co-vin.in/api/v2/admin/location/districts/{STATE_ID}"
}

// Settings Keys

export const POLLING_SETTINGS = {
  LOCATION_TYPE: "LOCATION_TYPE",
  AGE_GROUP: "AGE_GROUP",
  PINCODE: "PINCODE",
  STATE: "STATE",
  CITY: "CITY",
}

export const RESULT_STORE_KEYS = {
  CENTER_ID: "RESULT_CENTER_ID",
  CENTER_NAME: "RESULT_CENTER_NAME",
  CENTER_ADDRESS: "RESULT_CENTER_ADDRESS",
  CENTER_STATE: "RESULT_CENTER_STATE",
  CENTER_CITY: "RESULT_CENTER_CITY",
  CENTER_BLOCK: "RESULT_CENTER_BLOCK",
  CENTER_PINCODE: "RESULT_CENTER_PINCODE",
  CENTER_SLOTS: "RESULT_CENTER_SLOTS"
}
