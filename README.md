# DMM DAO Web App

This repository serves as an open source interface for the DMM DAO dashboard - a protocol for earning interest on crypto-based deposits whose interest is backed by real-world assets. This repository was originally forked from [Uniswap](https://uniswap.io) and is expected to change drastically over time.

- Website: [defimoneymarket.com](https://defimoneymarket.com)
- Twitter: [@DMMDAO](https://twitter.com/DMMDAO)
- Reddit: [/r/DMMDAO](https://www.reddit.com/r/DMMDAO/)
- Whitepaper: [Link](https://defimoneymarket.com/DMM-Ecosystem.pdf)
  
## Develop Locally

### Install Dependencies

```bash
yarn
```

### Configure Environment

Rename `.env.local.example` to `.env.local` and fill in the appropriate variables.

### Run

```bash
yarn start
```

To run on a testnet, make a copy of `.env.local.example` named `.env.local`, change `REACT_APP_CHAIN_ID` to 
`"{yourChainId}"`, and change `REACT_APP_NETWORK_URL` to e.g. `"https://{yourNetwork}.infura.io/v3/{yourKey}"`.

If deploying with Github Pages, be aware there is some 
[tricky client-side routing behavior with `create-react-app`](https://create-react-app.dev/docs/deployment#notes-on-client-side-routing).

## Contributions

**Please open all pull requests against the `master` branch.** CI checks will run against all PRs. To ensure that your 
changes will pass, run `yarn check:all` before pushing. If this command fails, you can try to automatically fix problems
with `yarn fix:all`, or do it manually.
