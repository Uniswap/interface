import { ChainId, WETH9 } from '@uniswap/sdk-core'
import {
  MATIC,
  USDC_ARBITRUM,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  WBTC,
  WETH_POLYGON,
} from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { validateUrlChainParam } from 'graphql/data/util'

import { MoonpaySupportedCurrencyCode } from './constants'

const CURRENCY_CODES: {
  [K in Chain]: {
    [key: string]: MoonpaySupportedCurrencyCode
    NATIVE: MoonpaySupportedCurrencyCode
  }
} = {
  [Chain.Ethereum]: {
    [WETH9[ChainId.MAINNET]?.address]: 'weth',
    [USDC_MAINNET.address]: 'usdc',
    [USDT.address]: 'usdt',
    [WBTC.address]: 'wbtc',
    [MATIC.address]: 'polygon',
    NATIVE: 'eth',
  },
  [Chain.Arbitrum]: {
    [USDC_ARBITRUM.address]: 'usdc_arbitrum',
    NATIVE: 'eth_arbitrum',
  },
  [Chain.Optimism]: {
    [USDC_OPTIMISM.address]: 'usdc_optimism',
    NATIVE: 'eth_optimism',
  },
  [Chain.Polygon]: {
    [USDC_POLYGON.address]: 'usdc_polygon',
    [WETH_POLYGON.address]: 'eth_polygon',
    NATIVE: 'matic_polygon',
  },
  // Defaults for unsupported chains, needed to satisfy type checker.
  [Chain.Avalanche]: {
    NATIVE: 'eth',
  },
  [Chain.Base]: {
    NATIVE: 'eth',
  },
  [Chain.Bnb]: {
    NATIVE: 'eth',
  },
  [Chain.Celo]: {
    NATIVE: 'eth',
  },
  [Chain.EthereumGoerli]: {
    NATIVE: 'eth',
  },
  [Chain.EthereumSepolia]: {
    NATIVE: 'eth',
  },
  [Chain.UnknownChain]: {
    NATIVE: 'eth',
  },
}

export function getDefaultCurrencyCode(
  address: string | undefined,
  chainName: string | undefined
): MoonpaySupportedCurrencyCode {
  const chain = validateUrlChainParam(chainName)
  if (!address || !chain) return 'eth'
  const code: MoonpaySupportedCurrencyCode = CURRENCY_CODES[chain]?.[address]
  return code ?? 'eth'
}
