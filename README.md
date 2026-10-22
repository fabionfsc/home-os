# Home OS

A minimal home screen for Samsung Tizen TVs: landscape wallpapers, a large clock, weather, original TV app icons, and a remote-friendly interface.

Home OS is a community web application for Samsung Tizen TVs.

## Features

- Installed apps come from live Tizen APIs. Refreshes on package events, visibility changes, and a 60-second foreground poll.
- Original TV app icons in a minimal, icon-only layout.
- Clock, hourly weather, seven-day forecast, and an ambient view. Weather comes from Open-Meteo. The default city is Brasília; edit its coordinates in `js/config.js` before building.
- Eight optional historical Chromecast landscape URLs, rotating every ten minutes with photographer credit. Broken URLs are skipped; bundled illustrative landscapes provide an offline fallback.
- Brazilian Portuguese, European Portuguese, English, Spanish, French, German, and Italian.
- Short focus transitions, reduced precipitation rendering, and paused background work.
- No framework, backend, or computer required for daily use on the TV.

## Compatibility and limitations

Tested on a Samsung QN55Q70A running Tizen 6.0 / Chromium 76. Compatibility with other models and firmware may vary.

The 1920 × 1080 logical canvas scales to Tizen's viewport. It does not change the physical panel resolution or another app's playback resolution.

Launch Home OS from the TV's app list. The original TV menu remains accessible inside the app. Integration as the default home screen, including Home-button and return behavior, is planned.

New apps are detected automatically. Some firmware may require icon-path adjustments when the TV supplies a missing or generic icon.

The optional remote wallpapers use a historical catalog, not a supported Google API or the current Chromecast feed. URLs can stop working. Photographer attribution does not transfer image rights; see [third-party notices](THIRD_PARTY_NOTICES.md). Choose Local weather landscapes in Settings for local backgrounds.

## Develop and preview

Use Node.js 22 or later and pnpm 11.25.0:

```sh
pnpm install --frozen-lockfile
pnpm start
```

Open http://127.0.0.1:4173. The desktop preview shows the interface; installed-app discovery and app launching require a TV.

Edit `js/config.js` for city coordinates, default language, favorite ordering, and optional HDMI entries. Viewers can change language, temperature, clock, effects, backgrounds, and app visibility in Settings.

## Build

```sh
pnpm build
```

The ready-to-package application is generated in `dist/`.

Development and test instructions are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Install

You need Developer Mode, a Samsung TV Tizen SDK, and your own Samsung signing profile authorized for your TV. Build first, then run in PowerShell:

```powershell
./tools/install.ps1 -SdkPath 'C:\path\tizen-sdk' -Profile 'your-profile' -TvIp 'YOUR_TV_IP'
```

With a native Linux/macOS Tizen SDK:

```sh
bash tools/install.sh /path/to/tizen-sdk your-profile YOUR_TV_IP
```

The installer signs, installs, and launches the built app using your own Samsung profile. It does not modify system button routing.

Updates require the same author certificate used for the installed app. A differently signed installation may need removal first, which can remove saved preferences.

### Install with an AI coding assistant

Codex, Claude Code, or another coding assistant with terminal access can help prepare the SDK, build, sign, and install Home OS. Open this repository in your assistant and use this prompt:

> Install Home OS from https://github.com/fabionfsc/home-os on my Samsung Tizen TV. Read the README and installation scripts first. Detect my computer's operating system, find or help install the Samsung TV Tizen SDK, install the project dependencies, and build the app. Ask me for the TV IP and my existing Samsung signing profile when needed, then use the appropriate installer to sign, install, and launch it. Explain any steps I must complete on the TV or in the certificate manager. Keep the TV's current Home/Back routing and other apps unchanged.

Developer Mode and Samsung certificate authorization can require manual steps. Complete account sign-in and certificate creation yourself when prompted; an AI assistant cannot bypass those requirements.

## Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CHANGELOG.md](CHANGELOG.md), and [LICENSE](LICENSE). Native app logos and remote photographs have their own owners; the code license does not license them.

Independent project, not affiliated with Samsung or Google.
