# Uniswap Labs Web Interface

## Accessing the Uniswap Interface

To access the Uniswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Uniswap/uniswap-interface/releases/latest),
or visit [app.uniswap.org](https://app.uniswap.org).

## Running the interface locally

```bash
bun install
bun web start
```

## Translations

To get translations to work you'll need to set up 1Password, and then:

```
eval $(op signin)
```

Sign into 1Password, then:

```
bun mobile env:local:download
```

Which downs a `.env.defaults.local` file at the root. Finally:

```
bun web i18n:download
```

Which will download the translations to `./apps/web/src/i18n/locales/translations`.

## Accessing Uniswap V2

The Uniswap Interface supports swapping, adding liquidity, removing liquidity and migrating liquidity for Uniswap protocol V2.

- Swap on Uniswap V2: <https://app.uniswap.org/swap?use=v2>
- View V2 liquidity: <https://app.uniswap.org/pools/v2>
- Add V2 liquidity: <https://app.uniswap.org/add/v2>
- Migrate V2 liquidity to V3: <https://app.uniswap.org/migrate/v2>

## Accessing Uniswap V1

The Uniswap V1 interface for mainnet and testnets is accessible via IPFS gateways
linked from the [v1.0.0 release](https://github.com/Uniswap/uniswap-interface/releases/tag/v1.0.0).
