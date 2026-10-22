# Changelog

## 3.0.0 — 2026-10-22

First Home OS release, following the local Sala 2.x prototype.

- Renamed the interface and package display name to Home OS; retained the application ID for signed updates.
- Added complete Spanish, French, German, and Italian catalogs, alongside Brazilian Portuguese, European Portuguese, and English: 120 messages per locale.
- Consolidated styles and removed unused tile labels, footer instructions, brand-color sampling, old layout overrides, and the captured device inventory.
- Reused one native-icon loader for the home row and library, including a neutral fallback.
- Preserved existing app nodes when the installed-app list is unchanged and reused concurrent weather requests.
- Paused periodic work while hidden and tied cached forecasts to their configured coordinates.
- Added a minified production build targeting Chromium 76, reproducible dependency lockfile, browser checks, and GitHub Actions.
- Kept the Samsung Home/Back defaults. Automatic system-wide return to Home OS is not implemented; the unsuccessful prototype remapping is not included.

This refactor was verified with unit tests and source/production browser checks. The previous Sala 2.1.0 build was verified on a Samsung QN55Q70A / Tizen 6.0; the 3.0.0 refactor still needs its own hardware verification.
