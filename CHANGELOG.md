# Changelog

## 3.0.0 — 2026-10-22

First public Home OS release.

- Minimal home screen with clock, weather, ambient mode, and native app icons.
- Added complete Spanish, French, German, and Italian catalogs, alongside Brazilian Portuguese, European Portuguese, and English: 120 messages per locale.
- Consolidated styles and removed unused tile labels, footer instructions, brand-color sampling, old layout overrides, and the captured device inventory.
- Reused one native-icon loader for the home row and library, including a neutral fallback.
- Preserved existing app nodes when the installed-app list is unchanged and reused concurrent weather requests.
- Paused periodic work while hidden and tied cached forecasts to their configured coordinates.
- Added a minified production build targeting Chromium 76, reproducible dependency lockfile, browser checks, and GitHub Actions.
- Default-home and system return integration is planned.

Test device: Samsung QN55Q70A / Tizen 6.0.
