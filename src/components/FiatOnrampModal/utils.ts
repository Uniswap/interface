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

type MoonpaySupportedChain = Chain.Ethereum | Chain.Polygon | Chain.Arbitrum | Chain.Optimism
const moonPaySupportedChains = [Chain.Ethereum, Chain.Polygon, Chain.Arbitrum, Chain.Optimism]

const CURRENCY_CODES: {
  [K in MoonpaySupportedChain]: {
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
}

export function getDefaultCurrencyCode(
  address: string | undefined,
  chainName: string | undefined
): MoonpaySupportedCurrencyCode {
  const chain = validateUrlChainParam(chainName)
  if (!address || !chain) return 'eth'
  if (moonPaySupportedChains.includes(chain)) {
    const code = CURRENCY_CODES[chain as MoonpaySupportedChain]?.[address]
    return code ?? 'eth'
  }
  return 'eth'
}

export function parsePathParts(pathname: string): { network?: string; tokenAddress?: string } {
  const pathParts = pathname.split('/')
  // Matches the /tokens/<network>/<tokenAddress> path.
  const network = pathParts.length > 2 ? pathParts[pathParts.length - 2] : undefined
  const tokenAddress = pathParts.length > 2 ? pathParts[pathParts.length - 1] : undefined
  return { network, tokenAddress }
}
