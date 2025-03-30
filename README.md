# Permissionless Uniswap Interface by cp0x

An open-source, permissionless interface for Uniswap, based on the official Uniswap repository (tag [v4.101.0](https://github.com/Uniswap/interface/tree/v4.101.0)), designed to be fully permissionless and allow direct, unrestricted interaction with smart contracts.

## Application Links
- Website: [pi.cp0x.com](https://pi.cp0x.com/)
- Interface: [uniswap.cp0x.com](https://uniswap.cp0x.com)
- Twitter: [@cp0xdotcom](https://x.com/cp0xdotcom)

## Docs

- Docs: [uniswap.org/docs/](https://docs.uniswap.org/)
- Whitepapers:
  - [V1](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)
  - [V2](https://uniswap.org/whitepaper.pdf)
  - [V3](https://uniswap.org/whitepaper-v3.pdf)


## Unsupported tokens

Check out `useUnsupportedTokenList()` in [src/state/lists/hooks.ts](./src/state/lists/hooks.ts) for blocking tokens in your instance of the interface.

You can block an entire list of tokens by passing in a tokenlist like [here](./src/constants/lists.ts) or you can block specific tokens by adding them to [unsupported.tokenlist.json](./src/constants/tokenLists/unsupported.tokenlist.json).

## Contributions

For steps on local deployment, development, and code contribution, please see [CONTRIBUTING](./CONTRIBUTING.md).

## Accessing Uniswap V2

The Uniswap Interface supports swapping, adding liquidity, removing liquidity and migrating liquidity for Uniswap protocol V2.

- Swap on Uniswap V2: https://uniswap.cp0x.com/#/swap?use=v2
- View V2 liquidity: https://uniswap.cp0x.com/#/pool/v2
- Add V2 liquidity: https://uniswap.cp0x.com/#/add/v2
- Migrate V2 liquidity to V3: https://uniswap.cp0x.com/#/migrate/v2

