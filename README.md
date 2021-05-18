# Uniswap Interface

[![Unit Tests](https://github.com/Uniswap/uniswap-interface/actions/workflows/unit-tests.yaml/badge.svg)](https://github.com/Uniswap/uniswap-interface/actions/workflows/unit-tests.yaml)
[![Integration Tests](https://github.com/Uniswap/uniswap-interface/actions/workflows/integration-tests.yaml/badge.svg)](https://github.com/Uniswap/uniswap-interface/actions/workflows/integration-tests.yaml)
[![Lint](https://github.com/Uniswap/uniswap-interface/actions/workflows/lint.yml/badge.svg)](https://github.com/Uniswap/uniswap-interface/actions/workflows/lint.yml)
[![Release](https://github.com/Uniswap/uniswap-interface/actions/workflows/release.yaml/badge.svg)](https://github.com/Uniswap/uniswap-interface/actions/workflows/release.yaml)

An open source interface for Uniswap -- a protocol for decentralized exchange of Ethereum tokens.

- Website: [uniswap.org](https://uniswap.org/)
- Interface: [app.uniswap.org](https://app.uniswap.org)
- Docs: [uniswap.org/docs/](https://uniswap.org/docs/)
- Twitter: [@UniswapProtocol](https://twitter.com/UniswapProtocol)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- Email: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.gg/FCfyBSbCU5)
- Whitepaper: [Link](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)

## Accessing the Uniswap Interface

To access the Uniswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Uniswap/uniswap-interface/releases/latest),
or visit [app.uniswap.org](https://app.uniswap.org).

## Development

### Install Dependencies

```bash
yarn install
```

### Run

```bash
yarn start
```

## Contributions

**Please open all pull requests against the `main` branch.**
CI checks will run against all PRs.

## Accessing Uniswap V2

The Uniswap Interface supports swapping, adding liquidity, removing liquidity and migrating liquidity for 
Uniswap protocol V2.

- Swap on Uniswap V2: https://app.uniswap.org/#/swap?use=v2
- View V2 liquidity: https://app.uniswap.org/#/pool/v2
- Add V2 liquidity: https://app.uniswap.org/#/add/v2
- Migrate V2 liquidity to V3: https://app.uniswap.org/#/migrate/v2

## Accessing Uniswap V1
 
The Uniswap V1 interface for mainnet and testnets is accessible via IPFS gateways 
linked from the [v1.0.0 release](https://github.com/Uniswap/uniswap-interface/releases/tag/v1.0.0).
