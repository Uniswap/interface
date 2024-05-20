import { ChainId, Token } from '@ubeswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import _ from 'lodash'

import { WRAPPED_NATIVE_CURRENCY } from '../../util/chains'
import { log } from '../../util/log'
import {
  CELO,
  CELO_ALFAJORES,
  CEUR_CELO,
  CUSD_CELO,
  CUSD_CELO_ALFAJORES,
  DAI_MAINNET,
  USDC_MAINNET,
  USDT_MAINNET,
  WBTC_MAINNET,
} from '../token-provider'

import { IV2SubgraphProvider, V2SubgraphPool } from './subgraph-provider'

type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}

const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  [ChainId.MAINNET]: [WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET]!, DAI_MAINNET, USDC_MAINNET, USDT_MAINNET, WBTC_MAINNET],
  [ChainId.GOERLI]: [],
  [ChainId.SEPOLIA]: [],
  [ChainId.OPTIMISM]: [],
  [ChainId.ARBITRUM_ONE]: [],
  [ChainId.ARBITRUM_GOERLI]: [],
  [ChainId.OPTIMISM_GOERLI]: [],
  [ChainId.POLYGON]: [],
  [ChainId.POLYGON_MUMBAI]: [],
  [ChainId.CELO]: [CELO, CUSD_CELO, CEUR_CELO],
  [ChainId.CELO_ALFAJORES]: [CELO_ALFAJORES, CUSD_CELO_ALFAJORES],
  [ChainId.GNOSIS]: [],
  [ChainId.MOONBEAM]: [],
  [ChainId.BNB]: [],
  [ChainId.AVALANCHE]: [],
  [ChainId.BASE_GOERLI]: [],
  [ChainId.BASE]: [],
  [ChainId.ARBITRUM_SEPOLIA]: [],
  [ChainId.ZORA_SEPOLIA]: [],
  [ChainId.ZORA]: [],
  [ChainId.OPTIMISM_SEPOLIA]: [],
  [ChainId.ROOTSTOCK]: [],
  [ChainId.BLAST]: [],
}

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

  public async getPools(tokenIn?: Token, tokenOut?: Token): Promise<V2SubgraphPool[]> {
    log.info('In static subgraph provider for V2')
    const bases = BASES_TO_CHECK_TRADES_AGAINST[this.chainId]

    const basePairs: [Token, Token][] = _.flatMap(bases, (base): [Token, Token][] =>
      bases.map((otherBase) => [base, otherBase])
    )

    if (tokenIn && tokenOut) {
      basePairs.push(
        [tokenIn, tokenOut],
        ...bases.map((base): [Token, Token] => [tokenIn, base]),
        ...bases.map((base): [Token, Token] => [tokenOut, base])
      )
    }

    const pairs: [Token, Token][] = _(basePairs)
      .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
      .filter(([tokenA, tokenB]) => tokenA.address !== tokenB.address && !tokenA.equals(tokenB))
      .value()

    const poolAddressSet = new Set<string>()

    const subgraphPools: V2SubgraphPool[] = _(pairs)
      .map(([tokenA, tokenB]) => {
        const poolAddress = Pair.getAddress(tokenA, tokenB)

        if (poolAddressSet.has(poolAddress)) {
          return undefined
        }
        poolAddressSet.add(poolAddress)

        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

        return {
          id: poolAddress,
          liquidity: '100',
          token0: {
            id: token0.address,
          },
          token1: {
            id: token1.address,
          },
          supply: 100,
          reserve: 100,
          reserveUSD: 100,
        }
      })
      .compact()
      .value()

    return subgraphPools
  }
}
