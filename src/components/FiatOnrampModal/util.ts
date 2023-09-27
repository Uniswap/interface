import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { MATIC, USDC_ARBITRUM, USDC_MAINNET, USDC_OPTIMISM, USDC_POLYGON, USDT, WBTC } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { validateUrlChainParam } from 'graphql/data/util'

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
  if (address === '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' && chain === Chain.Polygon) {
    return 'eth_polygon'
  }
  if (address === WETH9[ChainId.MAINNET]?.address && chain === Chain.Ethereum) {
    return 'weth'
  }
  if (address === WBTC.address && chain === Chain.Ethereum) {
    return 'wbtc'
  }
  if (address === 'NATIVE' && chain === Chain.Polygon) {
    return 'matic_polygon'
  }
  if (address === MATIC.address && chain === Chain.Ethereum) {
    return 'polygon'
  }
  if (address === USDC_MAINNET.address && chain === Chain.Ethereum) {
    return 'usdc'
  }
  if (address === USDC_ARBITRUM.address && chain === Chain.Arbitrum) {
    return 'usdc_arbitrum'
  }
  if (address === USDC_OPTIMISM.address && chain === Chain.Optimism) {
    return 'usdc_optimism'
  }
  if (address === USDC_POLYGON.address && chain === Chain.Polygon) {
    return 'usdc_polygon'
  }
  if (address === USDT.address && chain === Chain.Ethereum) {
    return 'usdt'
  }
  return 'eth'
}
