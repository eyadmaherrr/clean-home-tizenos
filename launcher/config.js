window.TV_CONFIG = {
  spotifyUrl: "",
  spotifyClientId: "",
  spotifyRefreshToken: "",

  // Background photos: a curated Unsplash set bundled in wallpapers/ (the TV can't
  // reach Unsplash's image CDN live). Rotates every rotateHours.
  photos: { count: 22, rotateHours: 2 },

  // Location (Cairo area). Pinned so weather/prayer don't depend on a live lookup;
  // set both to null to auto-detect by IP instead.
  geo: { auto: true, latitude: 30.0444, longitude: 31.2357 },

  // Weather (Open-Meteo, no key). Coordinates come from geo above.
  weather: { units: "celsius" },

  // Prayer times (AlAdhan, no key). method 5 = Egyptian General Authority of Survey.
  prayer: { method: 5 }
};
