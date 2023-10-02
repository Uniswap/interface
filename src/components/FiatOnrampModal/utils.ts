import { ChainId, WETH9 } from '@uniswap/sdk-core'
import {
  BRIDGED_USDC_ARBITRUM,
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
    native: MoonpaySupportedCurrencyCode
  }
} = {
  [Chain.Ethereum]: {
    [WETH9[ChainId.MAINNET]?.address.toLowerCase()]: 'weth',
    [USDC_MAINNET.address.toLowerCase()]: 'usdc',
    [USDT.address.toLowerCase()]: 'usdt',
    [WBTC.address.toLowerCase()]: 'wbtc',
    [MATIC.address.toLowerCase()]: 'polygon',
    native: 'eth',
  },
  [Chain.Arbitrum]: {
    [USDC_ARBITRUM.address.toLowerCase()]: 'usdc_arbitrum',
    [BRIDGED_USDC_ARBITRUM.address.toLowerCase()]: 'usdc_arbitrum',
    native: 'eth_arbitrum',
  },
  [Chain.Optimism]: {
    [USDC_OPTIMISM.address.toLowerCase()]: 'usdc_optimism',
    native: 'eth_optimism',
  },
  [Chain.Polygon]: {
    [USDC_POLYGON.address.toLowerCase()]: 'usdc_polygon',
    [WETH_POLYGON.address.toLowerCase()]: 'eth_polygon',
    native: 'matic_polygon',
  },
}

export function getDefaultCurrencyCode(
  address: string | undefined,
  chainName: string | undefined
): MoonpaySupportedCurrencyCode {
  const chain = validateUrlChainParam(chainName)
  if (!address || !chain) return 'eth'
  if (moonPaySupportedChains.includes(chain)) {
    const code = CURRENCY_CODES[chain as MoonpaySupportedChain]?.[address.toLowerCase()]
    return code ?? 'eth'
  }
  return 'eth'
}

/**
 * You should use useParams() from react-router-dom instead of this function if possible.
 * This function is only used in the case where we need to parse the path outside the scope of the router.
 */
export function parsePathParts(pathname: string): { network?: string; tokenAddress?: string } {
  const pathParts = pathname.split('/')
  // Matches the /tokens/<network>/<tokenAddress> path.
  const network = pathParts.length > 2 ? pathParts[pathParts.length - 2] : undefined
  const tokenAddress = pathParts.length > 2 ? pathParts[pathParts.length - 1] : undefined
  return { network, tokenAddress }
}
