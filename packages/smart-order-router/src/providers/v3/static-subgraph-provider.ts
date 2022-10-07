import { Token } from '@uniswap/sdk-core';
import { FeeAmount, Pool } from '@uniswap/v3-sdk';
import JSBI from 'jsbi';
import _ from 'lodash';

import { unparseFeeAmount } from '../../util/amounts';
import { ChainId, WRAPPED_NATIVE_CURRENCY } from '../../util/chains';
import { log } from '../../util/log';
import {
  CELO,
  CELO_ALFAJORES,
  CEUR_CELO,
  CEUR_CELO_ALFAJORES,
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI_ARBITRUM,
  DAI_ARBITRUM_RINKEBY,
  DAI_CELO,
  DAI_CELO_ALFAJORES,
  DAI_GÖRLI,
  DAI_KOVAN,
  DAI_MAINNET,
  DAI_MOONBEAM,
  DAI_OPTIMISM, DAI_OPTIMISTIC_GOERLI,
  DAI_OPTIMISTIC_KOVAN,
  DAI_POLYGON_MUMBAI,
  DAI_RINKEBY_1,
  DAI_RINKEBY_2,
  DAI_ROPSTEN,
  UNI_ARBITRUM_RINKEBY,
  USDC_ARBITRUM,
  USDC_ETHEREUM_GNOSIS,
  USDC_GÖRLI,
  USDC_KOVAN,
  USDC_MAINNET,
  USDC_MOONBEAM,
  USDC_OPTIMISM, USDC_OPTIMISTIC_GOERLI,
  USDC_OPTIMISTIC_KOVAN,
  USDC_POLYGON,
  USDC_RINKEBY,
  USDC_ROPSTEN,
  USDT_ARBITRUM,
  USDT_ARBITRUM_RINKEBY,
  USDT_GÖRLI,
  USDT_KOVAN,
  USDT_MAINNET,
  USDT_OPTIMISM, USDT_OPTIMISTIC_GOERLI,
  USDT_OPTIMISTIC_KOVAN,
  USDT_RINKEBY,
  USDT_ROPSTEN,
  WBTC_ARBITRUM,
  WBTC_GNOSIS,
  WBTC_GÖRLI,
  WBTC_KOVAN,
  WBTC_MAINNET,
  WBTC_MOONBEAM,
  WBTC_OPTIMISM,
  WBTC_OPTIMISTIC_KOVAN,
  WETH_OPTIMISTIC_GOERLI,
  WETH_POLYGON,
  WMATIC_POLYGON,
  WMATIC_POLYGON_MUMBAI,
  WXDAI_GNOSIS,
} from '../token-provider';

import { IV3PoolProvider } from './pool-provider';
import { IV3SubgraphProvider, V3SubgraphPool } from './subgraph-provider';

type ChainTokenList = {
  readonly [chainId in ChainId]: Token[];
};

const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.MAINNET]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET]!,
    DAI_MAINNET,
    USDC_MAINNET,
    USDT_MAINNET,
    WBTC_MAINNET,
  ],
  [ChainId.ROPSTEN]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.ROPSTEN]!,
    DAI_ROPSTEN,
    USDT_ROPSTEN,
    USDC_ROPSTEN,
  ],
  [ChainId.RINKEBY]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.RINKEBY]!,
    DAI_RINKEBY_1,
    DAI_RINKEBY_2,
    USDC_RINKEBY,
    USDT_RINKEBY,
  ],
  [ChainId.GÖRLI]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.GÖRLI]!,
    USDT_GÖRLI,
    USDC_GÖRLI,
    WBTC_GÖRLI,
    DAI_GÖRLI,
  ],
  [ChainId.KOVAN]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.KOVAN]!,
    USDC_KOVAN,
    USDT_KOVAN,
    WBTC_KOVAN,
    DAI_KOVAN,
  ],
  [ChainId.OPTIMISM]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISM]!,
    USDC_OPTIMISM,
    DAI_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
  ],
  [ChainId.ARBITRUM_ONE]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_ONE]!,
    WBTC_ARBITRUM,
    DAI_ARBITRUM,
    USDC_ARBITRUM,
    USDT_ARBITRUM,
  ],
  [ChainId.ARBITRUM_RINKEBY]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.ARBITRUM_RINKEBY]!,
    DAI_ARBITRUM_RINKEBY,
    UNI_ARBITRUM_RINKEBY,
    USDT_ARBITRUM_RINKEBY,
  ],
  [ChainId.OPTIMISTIC_KOVAN]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISTIC_KOVAN]!,
    DAI_OPTIMISTIC_KOVAN,
    WBTC_OPTIMISTIC_KOVAN,
    USDT_OPTIMISTIC_KOVAN,
    USDC_OPTIMISTIC_KOVAN,
  ],
  [ChainId.OPTIMISTIC_GOERLI]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISTIC_GOERLI]!,
    DAI_OPTIMISTIC_GOERLI,
    WETH_OPTIMISTIC_GOERLI,
    USDT_OPTIMISTIC_GOERLI,
    USDC_OPTIMISTIC_GOERLI,
  ],
  [ChainId.POLYGON]: [USDC_POLYGON, WETH_POLYGON, WMATIC_POLYGON],
  [ChainId.POLYGON_MUMBAI]: [
    DAI_POLYGON_MUMBAI,
    WRAPPED_NATIVE_CURRENCY[ChainId.POLYGON_MUMBAI]!,
    WMATIC_POLYGON_MUMBAI,
  ],
  [ChainId.CELO]: [CELO, CUSD_CELO, CEUR_CELO, DAI_CELO],
  [ChainId.CELO_ALFAJORES]: [
    CELO_ALFAJORES,
    CUSD_CELO_ALFAJORES,
    CEUR_CELO_ALFAJORES,
    DAI_CELO_ALFAJORES,
  ],
  [ChainId.GNOSIS]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.GNOSIS],
    WBTC_GNOSIS,
    WXDAI_GNOSIS,
    USDC_ETHEREUM_GNOSIS,
  ],
  [ChainId.MOONBEAM]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.MOONBEAM],
    DAI_MOONBEAM,
    USDC_MOONBEAM,
    WBTC_MOONBEAM,
  ],
};

/**
 * Provider that uses a hardcoded list of V3 pools to generate a list of subgraph pools.
 *
 * Since the pools are hardcoded and the data does not come from the Subgraph, the TVL values
 * are dummys and should not be depended on.
 *
 * Useful for instances where other data sources are unavailable. E.g. Subgraph not available.
 *
 * @export
 * @class StaticV3SubgraphProvider
 */
export class StaticV3SubgraphProvider implements IV3SubgraphProvider {
  constructor(
    private chainId: ChainId,
    private poolProvider: IV3PoolProvider
  ) {}

  public async getPools(
    tokenIn?: Token,
    tokenOut?: Token
  ): Promise<V3SubgraphPool[]> {
    log.info('In static subgraph provider for V3');
    const bases = BASES_TO_CHECK_TRADES_AGAINST[this.chainId];

    const basePairs: [Token, Token][] = _.flatMap(
      bases,
      (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase])
    );

    if (tokenIn && tokenOut) {
      basePairs.push(
        [tokenIn, tokenOut],
        ...bases.map((base): [Token, Token] => [tokenIn, base]),
        ...bases.map((base): [Token, Token] => [tokenOut, base])
      );
    }

    const pairs: [Token, Token, FeeAmount][] = _(basePairs)
      .filter((tokens): tokens is [Token, Token] =>
        Boolean(tokens[0] && tokens[1])
      )
      .filter(
        ([tokenA, tokenB]) =>
          tokenA.address !== tokenB.address && !tokenA.equals(tokenB)
      )
      .flatMap<[Token, Token, FeeAmount]>(([tokenA, tokenB]) => {
        return [
          [tokenA, tokenB, FeeAmount.LOWEST],
          [tokenA, tokenB, FeeAmount.LOW],
          [tokenA, tokenB, FeeAmount.MEDIUM],
          [tokenA, tokenB, FeeAmount.HIGH],
        ];
      })
      .value();

    log.info(
      `V3 Static subgraph provider about to get ${pairs.length} pools on-chain`
    );
    const poolAccessor = await this.poolProvider.getPools(pairs);
    const pools = poolAccessor.getAllPools();

    const poolAddressSet = new Set<string>();
    const subgraphPools: V3SubgraphPool[] = _(pools)
      .map((pool) => {
        const { token0, token1, fee, liquidity } = pool;

        const poolAddress = Pool.getAddress(pool.token0, pool.token1, pool.fee);

        if (poolAddressSet.has(poolAddress)) {
          return undefined;
        }
        poolAddressSet.add(poolAddress);

        const liquidityNumber = JSBI.toNumber(liquidity);

        return {
          id: poolAddress,
          feeTier: unparseFeeAmount(fee),
          liquidity: liquidity.toString(),
          token0: {
            id: token0.address,
          },
          token1: {
            id: token1.address,
          },
          // TODO: debug joy, fix
          stable: false,
          // As a very rough proxy we just use liquidity for TVL.
          tvlETH: liquidityNumber,
          tvlUSD: liquidityNumber,
        };
      })
      .compact()
      .value();

    return subgraphPools;
  }
}
