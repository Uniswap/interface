# Uniswap Wallet: Extension

## Developer Quickstart

### Running the extension locally

To run the extension, run the following from the top level of the monorepo:

```bash
yarn
yarn web start
```

### Loading the extension into Chrome

1. Go to **chrome://extensions**
2. At the top right, turn on **Developer mode**
3. Click **Load unpacked**
4. Find and select the extension folder (apps/web/dev)

## Technical Debt Tracking

Until we are able to fully share all components across mobile and web, some components or high level wrappers are implemented twice on the UI side, capturing both structure and some business data usage logic. Once ready, these areas should be merged back together taking the most updated/clean code from each (likely mobile while extension is in active alpha/beta development).

The following areas have been noted as potential float that should be remedied at the stage described above:

- `TokenBalanceList` and `TokenBalanceListItem`
- Portfolio Header
- Settings Components?
