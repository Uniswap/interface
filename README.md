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
yarn typechain
yarn start
```

### Configuring the environment (optional)

To run the environment on Alfajores, run

```bash
yarn start:alfajores
```

## Contributions

**Please open all pull requests against the `main` branch.**
CI checks will run against all PRs.
