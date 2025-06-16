# NextTrade Labs Web Interface

## Accessing the NextTrade Interface

To access the NextTrade Interface, use an IPFS gateway link from the
[latest release](https://github.com/NextTrade/uniswap-interface/releases/latest),
or visit [app.nexttrade.com](https://app.nexttrade.com).

## Running the interface locally

```bash
yarn
yarn web start
```

## Translations

To get translations to work you'll need to set up 1Password, and then:

```
eval $(op signin)
```

Sign into 1Password, then:

```
yarn mobile env:local:download
```

Which downs a `.env.defaults.local` file at the root. Finally:

```
yarn web i18n:download
```

Which will download the translations to `./apps/web/src/i18n/locales/translations`.

## Accessing NextTrade V2

The NextTrade Interface supports swapping, adding liquidity, removing liquidity and migrating liquidity for NextTrade protocol V2.

- Swap on NextTrade V2: <https://app.nexttrade.com/swap?use=v2>
- View V2 liquidity: <https://app.nexttrade.com/pools/v2>
- Add V2 liquidity: <https://app.nexttrade.com/add/v2>
- Migrate V2 liquidity to V3: <https://app.nexttrade.com/migrate/v2>

## Accessing NextTrade V1

The NextTrade V1 interface for mainnet and testnets is accessible via IPFS gateways
linked from the [v1.0.0 release](https://github.com/NextTrade/uniswap-interface/releases/tag/v1.0.0).
