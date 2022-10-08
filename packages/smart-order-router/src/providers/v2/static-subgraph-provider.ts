import { Pair } from '@teleswap/v2-sdk';
import { Token } from '@uniswap/sdk-core';
import _ from 'lodash';

import { ChainId, WRAPPED_NATIVE_CURRENCY } from '../../util/chains';
import { log } from '../../util/log';
import {
  DAI_MAINNET,
  DAI_OPTIMISTIC_GOERLI,
  DAI_RINKEBY_1,
  DAI_RINKEBY_2,
  USDC_MAINNET,
  USDC_OPTIMISTIC_GOERLI,
  USDT_MAINNET,
  USDT_OPTIMISTIC_GOERLI,
  WBTC_MAINNET,
  WETH_OPTIMISTIC_GOERLI,
} from '../token-provider';

import { IV2SubgraphProvider, V2SubgraphPool } from './subgraph-provider';

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
  [ChainId.ROPSTEN]: [WRAPPED_NATIVE_CURRENCY[ChainId.ROPSTEN]!],
  [ChainId.RINKEBY]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.RINKEBY]!,
    DAI_RINKEBY_1,
    DAI_RINKEBY_2,
  ],
  [ChainId.GÖRLI]: [WRAPPED_NATIVE_CURRENCY[ChainId.GÖRLI]!],
  [ChainId.KOVAN]: [WRAPPED_NATIVE_CURRENCY[ChainId.KOVAN]!],
  //v2 not deployed on [optimism, arbitrum, polygon, celo, gnosis, moonbeam] and their testnets
  [ChainId.OPTIMISM]: [],
  [ChainId.ARBITRUM_ONE]: [],
  [ChainId.ARBITRUM_RINKEBY]: [],
  [ChainId.OPTIMISTIC_KOVAN]: [],
  [ChainId.OPTIMISTIC_GOERLI]: [
    WRAPPED_NATIVE_CURRENCY[ChainId.OPTIMISTIC_GOERLI]!,
    DAI_OPTIMISTIC_GOERLI,
    WETH_OPTIMISTIC_GOERLI,
    USDT_OPTIMISTIC_GOERLI,
    USDC_OPTIMISTIC_GOERLI,
  ],
  [ChainId.POLYGON]: [],
  [ChainId.POLYGON_MUMBAI]: [],
  [ChainId.CELO]: [],
  [ChainId.CELO_ALFAJORES]: [],
  [ChainId.GNOSIS]: [],
  [ChainId.MOONBEAM]: [],
};

/**
 * Provider that does not get data from an external source and instead returns
 * a hardcoded list of Subgraph pools.
 *
 * Since the pools are hardcoded, the liquidity/price values are dummys and should not
 * be depended on.
 *
 * Useful for instances where other data sources are unavailable. E.g. subgraph not available.
 *
 * @export
 * @class StaticV2SubgraphProvider
 */
export class StaticV2SubgraphProvider implements IV2SubgraphProvider {
  constructor(private chainId: ChainId) {}

  public async getPools(
    tokenIn?: Token,
    tokenOut?: Token
  ): Promise<V2SubgraphPool[]> {
    log.info('In static subgraph provider for V2');
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

    const pairs: [Token, Token, boolean][] = _(basePairs)
      .filter((tokens): tokens is [Token, Token] =>
        Boolean(tokens[0] && tokens[1])
      )
      .filter(
        ([tokenA, tokenB]) =>
          tokenA.address !== tokenB.address && !tokenA.equals(tokenB)
      ).flatMap<[Token, Token, boolean]>(([tokenA, tokenB]) => {
        return [
          [tokenA, tokenB, false],
          [tokenA, tokenB, true],
        ]
      })
      .value();

    const poolAddressSet = new Set<string>();

    const subgraphPools: V2SubgraphPool[] = _(pairs)
      .map(([tokenA, tokenB, stable]) => {
        const poolAddress = Pair.getAddress(tokenA, tokenB, stable);

        if (poolAddressSet.has(poolAddress)) {
          return undefined;
        }
        poolAddressSet.add(poolAddress);

        const [token0, token1] = tokenA.sortsBefore(tokenB)
          ? [tokenA, tokenB]
          : [tokenB, tokenA];

        return {
          id: poolAddress,
          liquidity: '100',
          token0: {
            id: token0.address,
          },
          token1: {
            id: token1.address,
          },
          stable: stable,
          supply: 100,
          reserve: 100,
          reserveUSD: 100,
        };
      })
      .compact()
      .value();

    return subgraphPools;
  }
}
