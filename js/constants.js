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
  CENTER_NAME: "CENTER_NAME",
  CENTER_ADDRESS: "CENTER_ADDRESS",
  CENTER_STATE: "CENTER_STATE",
  CENTER_CITY: "CENTER_CITY",
  CENTER_BLOCK: "CENTER_BLOCK",
  CENTER_PINCODE: "CENTER_PINCODE",
  CENTER_SLOTS: "CENTER_SLOTS"
}