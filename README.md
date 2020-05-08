# Uniswap Frontend

[![Netlify Status](https://api.netlify.com/api/v1/badges/fa110555-b3c7-4eeb-b840-88a835009c62/deploy-status)](https://app.netlify.com/sites/uniswap/deploys)
[![Tests](https://github.com/Uniswap/uniswap-frontend/workflows/Tests/badge.svg?branch=v2)](https://github.com/Uniswap/uniswap-frontend/actions?query=workflow%3ATests)
[![Styled With Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

This an open source interface for Uniswap - a protocol for decentralized exchange of Ethereum tokens.

- Website: [uniswap.org](https://uniswap.org/)
- Docs: [uniswap.org/docs/](https://uniswap.org/docs/)
- Twitter: [@UniswapProtocol](https://twitter.com/UniswapProtocol)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- Email: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.gg/Y7TF6QA)
- Whitepaper: [Link](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)
  
## Run Uniswap Locally
 
1. Download and unzip the `build.zip` file from the latest release in the [Releases tab](https://github.com/Uniswap/uniswap-frontend/releases/latest).

2. Serve the `build/` folder locally, and access the application via a browser.

For more information on running a local server see [https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server). This simple approach has one downside: refreshing the page will give a `404` because of how React handles client-side routing. To fix this issue, consider running `serve -s` courtesy of the [serve](https://github.com/zeit/serve) package.
  
## Develop Uniswap Locally

### Install Dependencies

```bash
yarn
```

### Configure Environment

Copy `.env` to `.env.local` and change the appropriate variables.

### Run

```bash
yarn start
```

To run on a testnet, make a copy of `.env` named `.env.local`, change `REACT_APP_NETWORK_ID` to `"{yourNetworkId}"`, 
and change `REACT_APP_NETWORK_URL` to e.g. `"https://{yourNetwork}.infura.io/v3/{yourKey}"`. 

If deploying with Github Pages, be aware that there's some
[tricky client-side routing behavior with `create-react-app`](https://create-react-app.dev/docs/deployment#notes-on-client-side-routing).

## Contributions

**Please open all pull requests against the `v2` branch.** 
CI checks will run against all PRs. 
