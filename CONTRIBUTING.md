# Contributing

Use Node.js 22 or later and pnpm 11.25.0. Run `pnpm install`, `pnpm test`, and `pnpm build`. Install the test browser with `pnpm exec playwright install chromium`, then run `pnpm test:ui` and `pnpm test:ui --dist`.

The TV runtime has no framework or package dependencies. Keep runtime code compatible with Chromium 76. In particular, do not introduce CSS `inset`, flex `gap`, optional chaining, or untranspiled modern syntax into the source preview. Grid `gap` is supported. Production JS/CSS is compiled for `chrome76`; that does not polyfill missing browser APIs.

Add user-facing messages to all seven catalogs in `js/locales/`. Keep interpolation tokens such as `{place}` unchanged. The tests check complete key coverage and matching tokens. Preserve language preferences and migrate old settings deliberately.

Use explicit app fixtures in tests. Never seed a runtime installed-app list from a developer's machine or TV. Native icon aliases are cache hints only, not an allowlist.

For hardware bugs, include the model, firmware/Tizen version, app version, and repeatable steps. Browser tests cannot verify Samsung APIs, native app launches, or physical remote behavior. Do not change global Home/Back routing as part of an interface change.

Keep certificates, signed personal packages, SDK installations, credentials, and temporary device helpers out of pull requests. Preserve applicable copyright notices and licenses.
