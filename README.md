# Home OS

A minimal home screen for Samsung Tizen TVs: landscape wallpapers, a large clock, weather, original TV app icons, and a remote-friendly interface.

Home OS is a community web application, not a firmware replacement or operating system. Derived from [berteotti/custom-tv](https://github.com/berteotti/custom-tv). [Leia em português](README.pt-BR.md).

## Features

- Installed apps come from live Tizen APIs. Refreshes on package events, visibility changes, and a 60-second foreground poll.
- Native icon cache with application-API and neutral fallbacks. Icon-only cards; no navigation instructions in the footer.
- Clock, hourly weather, seven-day forecast, and an ambient view. Weather comes from Open-Meteo. The default city is Brasília; edit its coordinates in `js/config.js` before building.
- Eight optional historical Chromecast landscape URLs, rotating every ten minutes with photographer credit. Broken URLs are skipped; bundled illustrative landscapes provide an offline fallback.
- Brazilian Portuguese, European Portuguese, English, Spanish, French, German, and Italian. All seven catalogs contain 120 messages, including errors and weather conditions.
- Short focus transitions, reduced precipitation rendering, and paused background work.
- No framework, backend, or computer required for daily use on the TV.

## Compatibility and limitations

The Sala 2.1.0 predecessor was tested on a Samsung QN55Q70A / Tizen 6.0 / Chromium 76. This 3.0.0 refactor passes unit and source/production browser checks, but still needs its own hardware validation. Other firmware may expose different app metadata or icon paths.

The 1920 × 1080 logical canvas scales to Tizen's viewport. It does not change the physical panel resolution or another app's playback resolution.

**Home and Back retain Samsung behavior.** Launch Home OS from the TV's app list. The TV menu is also available inside the app. Global Home-button replacement and automatic return from third-party apps are not implemented. An unsuccessful prototype remapping was reverted and is not shipped.

`js/native-icons.js` contains cache-location hints, not an installed-app inventory or allowlist. New apps are detected automatically. Cache aliases may need updates when the API supplies a missing or generic icon.

The optional remote wallpapers use a historical catalog, not a supported Google API or the current Chromecast feed. URLs can stop working. Photographer attribution does not transfer image rights; see [third-party notices](THIRD_PARTY_NOTICES.md). Choose Local weather landscapes in Settings for local backgrounds.

## Develop and preview

Use Node.js 22 or later and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm start
```

Open http://127.0.0.1:4173. The desktop preview cannot read TV apps or launch them. It starts without a captured device inventory; browser tests inject explicit fixtures that are not shipped in the production build.

Edit `js/config.js` for city coordinates, default language, favorite ordering, and optional HDMI entries. Viewers can change language, temperature, clock, effects, backgrounds, and app visibility in Settings. Existing Sala preferences are preserved through retained storage keys.

## Test and build

```sh
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:ui
pnpm test:ui --dist
```

`dist/` contains the minified application, targeting Chromium 76 with one combined script. Readable sources remain in `js/` and `css/`. Build reports record byte counts; minification does not prove a frame-rate improvement.

For system Edge on Windows, set `PLAYWRIGHT_CHANNEL=msedge`. GitHub Actions uses Playwright Chromium. Browser checks cover seven locales across Home, Settings, Library, Forecast, and Ambient, including layout boundaries, remote navigation, preference persistence, and unchanged app-list nodes.

## Install

You need Developer Mode, a Samsung TV Tizen SDK, and your own Samsung signing profile authorized for your TV. Build first, then run in PowerShell:

```powershell
./tools/install.ps1 -SdkPath 'C:\path\tizen-sdk' -Profile 'your-profile' -TvIp 'YOUR_TV_IP'
```

With a native Linux/macOS Tizen SDK:

```sh
bash tools/install.sh /path/to/tizen-sdk your-profile YOUR_TV_IP
```

The installer signs, installs, and launches the built app. Certificates, credentials, SDK installations, personal signed packages, and temporary device/root helpers are not included. The installer does not modify system button routing.

The application ID remains `TvHomeLnch.Home`, package `TvHomeLnch`, to support updates with the same author certificate. The display name is Home OS. A differently signed installation may need removal before installing your own signed build, which can remove saved preferences.

## Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CHANGELOG.md](CHANGELOG.md), and [LICENSE](LICENSE). The original MIT copyright notice is preserved. Native app logos and remote photographs have their own owners; the code license does not license them.

Independent project, not affiliated with Samsung or Google.
