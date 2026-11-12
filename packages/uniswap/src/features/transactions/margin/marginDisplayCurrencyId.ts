import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToChain,
  areCurrencyIdsEqual,
} from 'uniswap/src/utils/currencyId'

/** Margin shows wrapped native as native (WETH as ETH), as /margin does. Display-only. */
export function getMarginDisplayCurrencyId(currencyId: string): string {
  const chainId = currencyIdToChain(currencyId)
  const wrappedNativeId = chainId ? buildWrappedNativeCurrencyId(chainId) : undefined
  return chainId && wrappedNativeId && areCurrencyIdsEqual(currencyId, wrappedNativeId)
    ? buildNativeCurrencyId(chainId)
    : currencyId
}
