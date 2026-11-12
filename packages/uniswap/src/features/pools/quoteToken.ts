import { areAddressesEqual, Platform } from '@universe/chains'

export function isToken0Quote({
  token0Address,
  quoteTokenAddress,
}: {
  token0Address?: string
  quoteTokenAddress?: string
}): boolean {
  if (token0Address === undefined || quoteTokenAddress === undefined) {
    return false
  }
  // Pools served with a quote are EVM-only today; EVM comparison also tolerates mixed checksum casing
  return areAddressesEqual({
    addressInput1: { address: token0Address, platform: Platform.EVM },
    addressInput2: { address: quoteTokenAddress, platform: Platform.EVM },
  })
}

/** Orders a pair's data for display: base first, quote second. */
export function orderPoolDataByQuoteToken<T>({
  token0IsQuote,
  data0,
  data1,
}: {
  token0IsQuote: boolean | undefined
  data0: T
  data1: T
}): [T, T] {
  return token0IsQuote ? [data1, data0] : [data0, data1]
}
