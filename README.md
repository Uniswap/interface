# Uniswap Frontend

[![Netlify Status](https://api.netlify.com/api/v1/badges/fa110555-b3c7-4eeb-b840-88a835009c62/deploy-status)](https://app.netlify.com/sites/uniswap/deploys)
[![Build Status](https://travis-ci.org/Uniswap/uniswap-frontend.svg)](https://travis-ci.org/Uniswap/uniswap-frontend)
[![Styled With Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

This an an open source interface for Uniswap - a protocol for decentralized exchange of Ethereum tokens.

- Website: [uniswap.io](https://uniswap.io/)
- Docs: [docs.uniswap.io](https://docs.uniswap.io/)
- Twitter: [@UniswapExchange](https://twitter.com/UniswapExchange)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/UniSwap/)
- Email: [contact@uniswap.io](mailto:contact@uniswap.io)
- Slack: [uni-swap.slack.com/](https://join.slack.com/t/uni-swap/shared_invite/enQtNDYwMjg1ODc5ODA4LWEyYmU0OGU1ZGQ3NjE4YzhmNzcxMDAyM2ExNzNkZjZjZjcxYTkwNzU0MGE3M2JkNzMxOTA2MzE2ZWM0YWQwNjU)
- Whitepaper: [Link](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)

## To Start Development

###### Installing dependencies

```bash
yarn
```

###### Running locally on Rinkeby

```bash
yarn start:rinkeby
```

###### Running locally on other testnet

```bash
REACT_APP_NETWORK_ID=2 REACT_APP_NETWORK='Ropsten Test Network' yarn start
```

## Contributions

Please open all pull requests against the `beta` branch. CI checks will run against all PRs. To ensure that your changes will pass, run `yarn check:all` before pushing. If this command fails, you can try to automatically fix eslint/prettier problems with `yarn lint`/`yarn format`, or manually fix the problems.
