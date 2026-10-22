// Edit these before building to change the weather location or initial preferences.
window.TV_HOME_CONFIG = {
  // Weather location. Find coordinates at https://open-meteo.com/en/docs (search a city).
  location: { name: 'Brasília', latitude: -15.7939, longitude: -47.8828 },
  weatherRefreshMinutes: 15,
  // Tiles pinned first, in this order. List installed app IDs with:
  //   ~/tizen-studio/tools/sdb -s <tv-ip>:26101 shell 0 vd_applist   (use the app_tizen_id lines)
  // `name` is optional. App icons come from Tizen; `icon` is for optional HDMI entries.
  // Inputs are not apps: give them an `input.*` id and a `source`.
  homeApps: [
    // { id: 'org.tizen.netflix-app', name: 'Netflix' },
    // { id: 'input.hdmi1', name: 'Game console', icon: 'css/app-icons/hdmi.svg', source: { type: 'HDMI', number: 1 } },
    // { id: 'input.hdmi2', name: 'HDMI 2', icon: 'css/app-icons/hdmi.svg', source: { type: 'HDMI', number: 2 } }
  ],
  // Apps whose id or name contains one of these come first, in this order.
  favoriteOrder: [
    'netflix', 'youtube', 'prime', 'disney', 'apple', 'globoplay', 'spotify',
    'plex', 'jellyfin', 'xbox', 'browser', 'alexa'
  ],
  // Languages are listed in js/i18n.js. hidden: [] shows all installed apps initially.
  defaults: { language: 'pt-BR', unit: 'C', clock: '24', scenery: 'auto', effects: true, performance: 'balanced', wallpaper: 'chromecast', hidden: [] }
};
