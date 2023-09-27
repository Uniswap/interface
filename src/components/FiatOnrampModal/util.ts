import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { MATIC, USDC_ARBITRUM, USDC_MAINNET, USDC_OPTIMISM, USDC_POLYGON, USDT, WBTC } from 'constants/tokens'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { validateUrlChainParam } from 'graphql/data/util'

export const MOONPAY_SUPPORTED_CURRENCY_CODES = [
  'ETH',
  'ETH_ARBITRUM',
  'ETH_OPTIMISM',
  'ETH_POLYGON',
  'WETH',
  'WBTC',
  'WMATIC_POLYGON',
  'POLYGON',
  'USDC_ARBITRUM',
  'USDC_OPTIMISM',
  'USDC_POLYGON',
  'USDC',
  'USDT',
] as const

type MoonpaySupportedCurrencyCode = (typeof MOONPAY_SUPPORTED_CURRENCY_CODES)[number]

export function getDefaultCurrencyCode(
  address: string | undefined,
  chainName: string | undefined
): MoonpaySupportedCurrencyCode {
  const chain = validateUrlChainParam(chainName)
  if (address === 'NATIVE' && chain === Chain.Arbitrum) {
    return 'ETH_ARBITRUM'
  }
  if (address === 'NATIVE' && chain === Chain.Optimism) {
    return 'ETH_OPTIMISM'
  }
  if (address === '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619' && chain === Chain.Polygon) {
    return 'ETH_POLYGON'
  }
  if (address === WETH9[ChainId.MAINNET]?.address && chain === Chain.Ethereum) {
    return 'WETH'
  }
  if (address === WBTC.address && chain === Chain.Ethereum) {
    return 'WBTC'
  }
  if (address === 'NATIVE' && chain === Chain.Polygon) {
    return 'WMATIC_POLYGON'
  }
  if (address === MATIC.address && chain === Chain.Ethereum) {
    return 'POLYGON'
  }
  if (address === USDC_MAINNET.address && chain === Chain.Ethereum) {
    return 'USDC'
  }
  if (address === USDC_ARBITRUM.address && chain === Chain.Arbitrum) {
    return 'USDC_ARBITRUM'
  }
  if (address === USDC_OPTIMISM.address && chain === Chain.Optimism) {
    return 'USDC_OPTIMISM'
  }
  if (address === USDC_POLYGON.address && chain === Chain.Polygon) {
    return 'USDC_POLYGON'
  }
  if (address === USDT.address && chain === Chain.Ethereum) {
    return 'USDT'
  }
  return 'ETH'
}
