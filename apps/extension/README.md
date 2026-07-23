# Uniswap Extension

## Developer Quickstart

### Build System

The extension is built with **WXT** (Vite-based) for both local development and production. The dev server opens a browser automatically.

### Running the extension locally

First, install dependencies from the top level of the monorepo:

```bash
bun install
```

---

#### Running with WXT

```bash
bun extension dev
```

WXT automatically opens a browser window with the extension loaded.

##### Configuring WXT browser behavior

To customize the browser WXT opens, create a file `web-ext.config.ts` in this directory:

```ts
// web-ext.config.ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // Option 1: Connect to already running Chrome (requires Chrome to be started with --remote-debugging-port=9222)
  // chromiumPort: 9222,

  // Option 2: Use your existing Chrome profile (but Chrome must be closed first)
  // chromiumArgs: [
  //   '--user-data-dir=/Users/<username>/Library/Application Support/Google/Chrome',
  //   '--profile-directory=Default'
  // ],

  // Option 3: Create a persistent profile that matches your existing setup (recommended)
  chromiumArgs: [
    '--user-data-dir=./.wxt/chrome-data',
    // Sync with your Google account to get bookmarks, extensions, etc.
    // '--enable-sync',
  ],
});
```

##### Running WXT with absolute paths (for Scantastic testing)

```bash
# Auto-detect current OS (Mac / Linux / Windows)
bun extension start:absolute

# Windows
bun extension start:absolute:windows
```

Absolute output directories by platform:
- Mac: `/Users/Shared/stretch`
- Linux: `/var/tmp/stretch`
- Windows: `C:/ProgramData/stretch`

##### Loading into your own Chrome (no managed browser)

`start:absolute` auto-launches a separate web-ext-managed Chrome with its own
profile, so it onboards fresh on every run. To instead build/watch to the
absolute path and load it into your everyday Chrome — keeping your login and
completed onboarding, the way the old `start:webpack:absolute` worked:

```bash
bun extension start:absolute:no-browser
```

Then load the output directory (e.g. `/Users/Shared/stretch` on Mac) once via
`chrome://extensions` → **Load unpacked**. Because it lives in your own profile,
state persists across reruns and you only onboard once. The dev server still
hot-reloads the unpacked extension.

### Reusing an already-onboarded extension state (managed browser)

`start:absolute` persists its Chrome profile by default — the profile lives in a
sibling directory of the output dir (e.g. `/Users/Shared/stretch-chrome-data` on
Mac), so it survives the outdir wipe WXT performs on each build. Complete
onboarding once and it's preserved (local storage + persisted Redux state) across
reruns.

To point at a different profile directory, set `WXT_CHROME_USER_DATA_DIR` to any
stable path **outside** the output dir:

```bash
WXT_CHROME_USER_DATA_DIR=/var/tmp/uniswap-extension-chrome-data bun extension start:absolute
```

## Migrations

We use `redux-persist` to persist the Redux state between user sessions. Most of this state is shared between the mobile app and the extension. Please review the [Wallet Migrations README](../../packages/wallet/src/state//README.md) for details on how to write migrations when you add or remove anything from the Redux state structure.
