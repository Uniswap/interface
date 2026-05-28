# Uniswap Extension

## Developer Quickstart

### Running the extension locally

To run the extension, run the following from the top level of the monorepo:

```bash
yarn
yarn extension start
```

### Environment variables

You need to get the environment variables from 1password in order to get full functionality. Run the command `yarn extension env:local:download` to copy them to your root folder.

### Loading the extension into Chrome

1. Go to **chrome://extensions**
2. At the top right, turn on **Developer mode**
3. Click **Load unpacked**
4. Find and select the extension folder (apps/extension/dev)

## Running the extension locally with an absolute path (for testing scantastic)

Our scantastic API requires a consistent origin header so the build must be loaded from an absolute path. This works because Chrome generates a consistent ID for the extension based on the path it was loaded from.

To run the extension, run the following from the top level of the monorepo:

Mac:

```bash
yarn
yarn extension start:absolute
```

Windows:

```bash
yarn
yarn extension start:absolute:windows
```

1. Go to **chrome://extensions**
2. At the top right, turn on **Developer mode**
3. Click **Load unpacked**
4. Find and select the extension folder with an absolute path (`/Users/Shared/stretch` on Mac and `C:/ProgramData/stretch` on Windows)
5. Your chrome extension url should be `chrome-extension://ceofpnbcmdjbibjjdniemjemmgaibeih` on Mac and `chrome-extension://ffogefanhjekjafbpofianlhkonejcoe` on Windows. The backend allows this origin and the ID will be consistently generated based off an absolute path that is consistent on all machines.

## Migrations

We use `redux-persist` to persist the Redux state between user sessions. Most of this state is shared between the mobile app and the extension. Please review the [Wallet Migrations README](../../packages/wallet/src/state//README.md) for details on how to write migrations when you add or remove anything from the Redux state structure.
