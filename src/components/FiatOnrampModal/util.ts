import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { MATIC, USDC_ARBITRUM, USDC_MAINNET, USDC_OPTIMISM, USDC_POLYGON, USDT, WBTC } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { validateUrlChainParam } from 'graphql/data/util'
import { isSameAddress } from 'utils/addresses'

export const MOONPAY_SUPPORTED_CURRENCY_CODES = [
  'eth',
  'eth_arbitrum',
  'eth_optimism',
  'eth_polygon',
  'weth',
  'wbtc',
  'matic_polygon',
  'polygon',
  'usdc_arbitrum',
  'usdc_optimism',
  'usdc_polygon',
  'usdc',
  'usdt',
] as const

type MoonpaySupportedCurrencyCode = (typeof MOONPAY_SUPPORTED_CURRENCY_CODES)[number]

export function getDefaultCurrencyCode(
  address: string | undefined,
  chainName: string | undefined
): MoonpaySupportedCurrencyCode {
  const chain = validateUrlChainParam(chainName)
  if (address === 'NATIVE' && chain === Chain.Arbitrum) {
    return 'eth_arbitrum'
  }
  if (address === 'NATIVE' && chain === Chain.Optimism) {
    return 'eth_optimism'
  }
  if (isSameAddress(address, '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619') && chain === Chain.Polygon) {
    return 'eth_polygon'
  }
  if (isSameAddress(address, WETH9[ChainId.MAINNET]?.address) && chain === Chain.Ethereum) {
    return 'weth'
  }
  if (isSameAddress(address, WBTC.address) && chain === Chain.Ethereum) {
    return 'wbtc'
  }
  if (isSameAddress(address, 'NATIVE') && chain === Chain.Polygon) {
    return 'matic_polygon'
  }
  if (isSameAddress(address, MATIC.address) && chain === Chain.Ethereum) {
    return 'polygon'
  }
  if (isSameAddress(address, USDC_MAINNET.address) && chain === Chain.Ethereum) {
    return 'usdc'
  }
  if (isSameAddress(address, USDC_ARBITRUM.address) && chain === Chain.Arbitrum) {
    return 'usdc_arbitrum'
  }
  if (isSameAddress(address, USDC_OPTIMISM.address) && chain === Chain.Optimism) {
    return 'usdc_optimism'
  }
  if (isSameAddress(address, USDC_POLYGON.address) && chain === Chain.Polygon) {
    return 'usdc_polygon'
  }
  if (isSameAddress(address, USDT.address) && chain === Chain.Ethereum) {
    return 'usdt'
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
