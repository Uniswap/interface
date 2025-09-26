# Uniswap Extension

## Developer Quickstart

### Environment variables

Before running the extension, you need to get the environment variables from 1password in order to get full functionality. Run the command `bun extension env:local:download` to copy them to your root folder.

### Running the extension locally

To run the extension, run the following from the top level of the monorepo:

```bash
bun install
bun extension start
```

Then, load the extension into Chrome (if using Webpack):

1. Go to **chrome://extensions**
2. At the top right, turn on **Developer mode**
3. Click **Load unpacked**
4. Find and select the extension folder (apps/extension/dev)

## Configuring WXT Browser-opening behavior

To customize the default WXT behavior, create a file `web-ext.config.ts` in this directory.

``` web-ext.config.ts
import { defineWebExtConfig } from 'wxt';

export default defineWebExtConfig({
  // ...

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

  // ...
});
```

## Running the extension locally with an absolute path (for testing scantastic)

Our scantastic API requires a consistent origin header so the build must be loaded from an absolute path. This works because Chrome generates a consistent ID for the extension based on the path it was loaded from.

To run the extension, run the following from the top level of the monorepo:

Mac:

```bash
bun
bun extension start:absolute
```

Windows:

```bash
bun
bun extension start:absolute:windows
```

Then, load the extension into Chrome (if using Webpack):

1. Go to **chrome://extensions**
2. At the top right, turn on **Developer mode**
3. Click **Load unpacked**
4. Find and select the extension folder with an absolute path (`/Users/Shared/stretch` on Mac and `C:/ProgramData/stretch` on Windows)
5. Your chrome extension url should be `chrome-extension://ceofpnbcmdjbibjjdniemjemmgaibeih` on Mac and `chrome-extension://ffogefanhjekjafbpofianlhkonejcoe` on Windows. The backend allows this origin and the ID will be consistently generated based off an absolute path that is consistent on all machines.

## Migrations

We use `redux-persist` to persist the Redux state between user sessions. Most of this state is shared between the mobile app and the extension. Please review the [Wallet Migrations README](../../packages/wallet/src/state//README.md) for details on how to write migrations when you add or remove anything from the Redux state structure.
