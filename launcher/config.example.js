/*
 * Launcher configuration. Copy to config.js and edit. config.js ships with safe defaults and
 * holds NO secrets — keep it that way. Anything with a token/key stays on your machine only.
 */
window.TV_CONFIG = {
  // Optional Spotify Now-Playing widget. Leave empty to disable.
  // spotifyUrl is a small token-refresh helper you host on your LAN (see docs).
  spotifyUrl: "",
  spotifyClientId: "",
  spotifyRefreshToken: "",

  // Background photos bundled in wallpapers/ (the TV can't reach Unsplash's CDN live),
  // rotated locally every rotateHours.
  photos: { count: 22, rotateHours: 2 },

  // Location for weather + prayer times. Set auto:true to detect by IP, or pin lat/lon.
  geo: { auto: true, latitude: 30.0444, longitude: 31.2357 },

  // Weather via Open-Meteo (no key).
  weather: { units: "celsius" },

  // Prayer times via AlAdhan (no key). method 5 = Egyptian General Authority of Survey.
  prayer: { method: 5 },

  // Development only: a LAN URL (e.g. "http://192.168.1.10:8792") that receives perf/caps
  // beacons while debugging on the TV. Empty (default) turns every beacon off.
  debugBeacon: ""
};
