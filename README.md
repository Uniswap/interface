# Ubeswap Interface

[![Lint](https://github.com/Ubeswap/ubeswap-interface/workflows/Lint/badge.svg)](https://github.com/Ubeswap/ubeswap-interface/actions?query=workflow%3ALint)
[![Tests](https://github.com/Ubeswap/ubeswap-interface/workflows/Tests/badge.svg)](https://github.com/Ubeswap/ubeswap-interface/actions?query=workflow%3ATests)
[![Styled With Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

An open source interface for Ubeswap -- a protocol for decentralized exchange of Celo tokens.

- Website: [ubeswap.org](https://ubeswap.org/)
- Interface: [app.ubeswap.org](https://app.ubeswap.org)
- Twitter: [@Ubeswap](https://twitter.com/Ubeswap)
- Reddit: [/r/Ubeswap](https://www.reddit.com/r/Ubeswap/)
- Email: [contact@ubeswap.org](mailto:contact@ubeswap.org)
- Discord: [Ubeswap](https://discord.gg/zZkUXCMPGP)

## Accessing the Ubeswap Interface

To access the Ubeswap Interface, visit [app.ubeswap.org](https://app.ubeswap.org).

## Listing a token

Please see the
[@ubeswap/default-token-list](https://github.com/ubeswap/default-token-list)
repository.

## Development

### Install Dependencies

```bash
yarn
```

### Run

```bash
yarn start
```

### Configuring the environment (optional)

To have the interface default to a different network when a wallet is not connected:

1. Make a copy of `.env` named `.env.local`
2. Change `REACT_APP_NETWORK_ID` to `"{YOUR_NETWORK_ID}"`

Note that the interface only works on testnets where both
[Uniswap V2](https://uniswap.org/docs/v2/smart-contracts/factory/) and
[multicall](https://github.com/makerdao/multicall) are deployed.
The interface will not work on other networks.

## Contributions

**Please open all pull requests against the `master` branch.**
CI checks will run against all PRs.
