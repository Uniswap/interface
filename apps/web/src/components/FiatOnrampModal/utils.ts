import { ChainId, WETH9 } from '@uniswap/sdk-core'
import {
  MATIC_MAINNET,
  USDC_ARBITRUM,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  WBTC,
  WETH_POLYGON,
} from 'constants/tokens'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

import { InterfaceGqlChain, getChainFromChainUrlParam, getChainUrlParam } from 'constants/chains'
import { MoonpaySupportedCurrencyCode } from './constants'

type MoonpaySupportedChain = Chain.Ethereum | Chain.Polygon | Chain.Arbitrum | Chain.Optimism
const moonPaySupportedChains = [Chain.Ethereum, Chain.Polygon, Chain.Arbitrum, Chain.Optimism]
const isMoonpaySupportedChain = (chain?: Chain): chain is MoonpaySupportedChain =>
  !!chain && moonPaySupportedChains.includes(chain)

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
    [MATIC_MAINNET.address.toLowerCase()]: 'polygon',
    native: 'eth',
  },
  [Chain.Arbitrum]: {
    [USDC_ARBITRUM.address.toLowerCase()]: 'usdc_arbitrum',
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
  gqlChain?: InterfaceGqlChain
): MoonpaySupportedCurrencyCode {
  if (!address || !gqlChain) return 'eth'
  if (isMoonpaySupportedChain(gqlChain)) {
    const code = CURRENCY_CODES[gqlChain]?.[address.toLowerCase()]
    return code ?? 'eth'
  }
  return 'eth'
}

/**
 * You should use useParams() from react-router-dom instead of this function if possible.
 * This function is only used in the case where we need to parse the path outside the scope of the router.
 */
export function parsePathParts(pathname: string) {
  const pathParts = pathname.split('/')
  // Matches the /tokens/<network>/<tokenAddress> path.
  const chainSlug = getChainUrlParam(pathParts.length > 2 ? pathParts[pathParts.length - 2] : undefined)
  const chain = getChainFromChainUrlParam(chainSlug)
  const tokenAddress = pathParts.length > 2 ? pathParts[pathParts.length - 1] : undefined
  return { chain, tokenAddress }
}
