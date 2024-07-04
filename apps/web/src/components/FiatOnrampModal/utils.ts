import { WETH9 } from '@uniswap/sdk-core'
import { MoonpaySupportedCurrencyCode } from 'components/FiatOnrampModal/constants'
import { InterfaceGqlChain, getChainFromChainUrlParam, getChainUrlParam } from 'constants/chains'
import {
  MATIC_MAINNET,
  USDC_ARBITRUM,
  USDC_BASE,
  USDC_MAINNET,
  USDC_OPTIMISM,
  USDC_POLYGON,
  USDT,
  WBTC,
  WETH_POLYGON,
} from 'constants/tokens'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'

type MoonpaySupportedChain = Chain.Ethereum | Chain.Polygon | Chain.Arbitrum | Chain.Optimism | Chain.Base
const moonPaySupportedChains = [Chain.Ethereum, Chain.Polygon, Chain.Arbitrum, Chain.Optimism, Chain.Base]
const isMoonpaySupportedChain = (chain?: Chain): chain is MoonpaySupportedChain =>
  !!chain && moonPaySupportedChains.includes(chain)

const CURRENCY_CODES: {
  [K in MoonpaySupportedChain]: {
    [key: string]: MoonpaySupportedCurrencyCode
    native: MoonpaySupportedCurrencyCode
  }
} = {
  [Chain.Ethereum]: {
    [WETH9[UniverseChainId.Mainnet]?.address.toLowerCase()]: 'weth',
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
  [Chain.Base]: {
    [USDC_BASE.address.toLowerCase()]: 'usdc_base',
    native: 'eth_base',
  },
}

export function getDefaultCurrencyCode(address?: string, gqlChain?: InterfaceGqlChain): MoonpaySupportedCurrencyCode {
  if (!gqlChain) {
    return 'eth'
  }
  if (!address) {
    return isMoonpaySupportedChain(gqlChain) ? CURRENCY_CODES[gqlChain]?.native : 'eth'
  }
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
