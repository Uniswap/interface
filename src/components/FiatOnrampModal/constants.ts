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

export type MoonpaySupportedCurrencyCode = (typeof MOONPAY_SUPPORTED_CURRENCY_CODES)[number]
