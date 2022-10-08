# Uniswap Smart Order Router

This repository contains routing logic for the Uniswap V3 protocol.

It searches for the most efficient way to swap token A for token B, considering splitting swaps across multiple routes and gas costs.

## Testing

### Unit Tests

First make sure you have run `npm install` and `npm run build`.

```
npm run test
```

### Integration Tests

Make sure the `.env` file is configured to connect to mainnet and other chains. See the [CLI](#cli) section below for more details.

```
npm run integ-test
```

### CLI

The package can be run as a CLI for testing purposes.

First create a `.env` file in the root of the project and configure:

```
JSON_RPC_PROVIDER = '<JSON_RPC_PROVIDER>'
```

To run on chains other than mainnet set up a connection by specifying the environment variable

```
JSON_RPC_PROVIDER_{CHAIN} = '<JSON_RPC_PROVIDER>'
```

For example, specifying a provider for Optimism :

```
JSON_RPC_PROVIDER_OPTIMISM = '<JSON_RPC_PROVIDER>'
```

Then from the root directory you can execute the CLI.

## Examples

Some examples to use for manual CLI testing.

### Mainnet

```
./bin/cli quote --tokenIn 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 --tokenOut 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984 --amount 1000 --exactIn --recipient 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B --protocols v2,v3

Best Route:
100.00% = USDC -- 0.3% --> UNI
	Raw Quote Out:
		35.72
	Gas Adjusted Quote Out:
		34.03

Gas Used Quote Token: 1.691772
Gas Used USD: 47.592951
Calldata: 0x414bf389000000000000...
Value: 0x00

  blockNumber: "13088815"
  estimatedGasUsed: "113000"
  gasPriceWei: "130000000000"


./bin/cli quote-to-ratio --token0 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 --token1 0xdac17f958d2ee523a2206206994597c13d831ec7 --feeAmount 3000 --recipient 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B  --token0Balance 1000 --token1Balance 2000 --tickLower -120 --tickUpper 120

Best Route:
100.00% = USDT -- 0.05% --> USDC
Raw Quote Exact In:
	392.68
Gas Adjusted Quote In}:
	346.13

Gas Used Quote Token: 46.550010
Gas Used USD: 46.342899
Calldata: 0x414bf389000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec7000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000000001f4000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000176a736c000000000000000000000000000000000000000000000000000000001764f8650000000000000000000000000000000000000000000000000000000000000000
	Value: 0x00

	blockNumber: "13239188"
	estimatedGasUsed: "113000"
	gasPriceWei: "116690684398"

./bin/cli quote --tokenIn 0x0391D2021f89DC339F60Fff84546EA23E337750f --tokenOut 0x4d224452801ACEd8B2F0aebE155379bb5D594381 --amount 10000 --exactIn --recipient 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B --protocols v2,v3,mixed
Best Route:
[V2 + V3] 100.00% = BOND -- [0x6591c4BcD6D7A1eb4E537DA8B78676C1576Ba244] --> USDC -- 0.3% [0xB07Fe2F407F971125D4EB1977f8aCEe8846C7324] --> APE
	Raw Quote Exact In:
		10437.85
	Gas Adjusted Quote In:
		10433.83

Gas Used Quote Token: 4.018625
Gas Used USD: 29.669402
Calldata: 0x5ae401dc0000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000016000000000000000000000000000000000000000000000000000000000000000e4472b43f300000000000000000000000000000000000000000000021e19e0c9bab240000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000020000000000000000000000000391d2021f89dc339f60fff84546ea23e337750f000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000104b858183f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000080000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002358df5b3b4459a3f5b000000000000000000000000000000000000000000000000000000000000002ba0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000bb84d224452801aced8b2f0aebe155379bb5d59438100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
Value: 0x00

  blockNumber: "15303839"
  estimatedGasUsed: "434000"
  gasPriceWei: "38218865879"
Total ticks crossed: 7
```

## Rinkeby

```
./bin/cli quote --tokenIn 0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea --tokenOut 0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b --amount 200000 --exactIn --minSplits 1 --router alpha --chainId 4
```

## Kovan

```
./bin/cli quote --tokenIn 0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa --tokenOut 0xd0a1e359811322d97991e03f863a0c30c2cf029c --amount 10 --exactIn --minSplits 1 --router alpha --chainId 42
```

## Ropsten

```
./bin/cli quote --tokenIn 0x07865c6e87b9f70255377e024ace6630c1eaa37f --tokenOut 0xc778417e063141139fce010982780140aa0cd5ab --amount 200000 --exactIn --minSplits 1 --router alpha --chainId 3
```

## Optimism

```
./bin/cli quote --tokenIn 0x7F5c764cBc14f9669B88837ca1490cCa17c31607 --tokenOut 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1 --amount 200000 --exactIn --minSplits 1 --router alpha --chainId 10

```

## Optimistic-Kovan

```
./bin/cli quote --tokenIn 0x7F5c764cBc14f9669B88837ca1490cCa17c31607 --tokenOut 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1 --amount 200 --exactIn --minSplits 1 --router alpha --chainId 69
```

## Arbitrum

```
./bin/cli quote --tokenIn 0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9 --tokenOut 0x82af49447d8a07e3bd95bd0d56f35241523fbab1 --amount 20000 --exactIn --minSplits 1 --router alpha --chainId 42161 --debug
```

## Arbitrum-Rinkeby

```
./bin/cli quote --tokenIn 0x09b98f8b2395d076514037ff7d39a091a536206c --tokenOut 0xb47e6a5f8b33b3f17603c83a0535a9dcd7e32681 --amount 200 --exactIn --minSplits 1 --router alpha --chainId 421611
```

## Polygon Mumbai

```
./bin/cli quote --tokenIn 0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f --tokenOut 0x9c3c9283d3e44854697cd22d3faa240cfb032889 --amount 1 --exactIn --protocols v3 --recipient 0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B --minSplits 1 --router alpha --chainId 80001
```

## Polygon Mainnet

```
./bin/cli quote --tokenIn 0x2791bca1f2de4661ed88a30c99a7a9449aa84174 --tokenOut 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 --amount 5 --exactIn --minSplits 1 --protocols v3 --router alpha --chainId 137
```

## Celo Mainnet

```
./bin/cli quote --tokenIn CELO --tokenOut 0x765DE816845861e75A25fCA122bb6898B8B1282a --amount 5 --exactIn --minSplits 1 --protocols v3 --router alpha --chainId 42220
```

## Adding a new Chain

The main components to complete are:

- Deploy contracts on chain, add the pools to subgraph
- Populate v3 providers in `src/providers/v3/subgraph-provider` and `src/providers/v3/static-subgraph-provider`
- Populate chainId and addresses in `src/util/chains.ts` and `src/util/addresses.ts`
- Populate token providers in `src/providers/caching-token-provider` and `src/providers/token-provider.ts`
- Populate gas constants in `src/routers/alpha-router/gas-models/*`
- Populate bases in `src/routers/legacy-router/bases.ts`
- Populate `test/integ/routers/alpha-router/alpha-router.integration.test.ts` and `src/providers/v2/static-subgraph-provider.ts`
- Populate `src/routers/alpha-router/*`
- Add a log to `/CHANGELOG.md`
- Run `npm run integ-test` successfully

# Troubleshooting

## ProviderGasLimit errors

The package sends many large multicall requests to nodes. You must ensure that your node provider's `eth_call` gas limit is high enough to succesfully process the RPC calls.

By default each `eth_call` will consume up to:

- 132,000,000 gas on Optimism
- 120,000,000 gas on Arbitrum
- 50,000,000 gas on Celo
- 150,000,000 gas on every other network (Mainnet, Goerli, etc.)

If you are using a node provider with a lower gas limit per `eth_call` you will need to override the default `V3QuoteProvider` with an instance that lowers the `multicallChunk` and `gasLimitPerCall` parameters. Lowering these values will cause each multicall to consume less gas. See [here](https://github.com/Uniswap/smart-order-router/blob/main/src/routers/alpha-router/alpha-router.ts#L379) for examples of how to set these values.

If you are running your own node, we recommend you configure start your node with a higher gas limit per call. For example, on Geth you can use the command line argument `--rpc.gascap 150000000` to raise the limit to 150m, which is enough to run the default configuration of this package.

If you are using Hardhat mainnet forking, you should add `blockGasLimit: 150_000_000` to your Hardhat config to use the default package configuration.
