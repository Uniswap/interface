import { UNICHAIN_BRIDGED_ASSETS } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function checkIsBridgedAsset(currencyInfo?: CurrencyInfo): boolean {
  if (!currencyInfo) {
    return false
  }

  return (
    currencyInfo.currency.chainId === UniverseChainId.Unichain &&
    currencyInfo.currency.isToken &&
    UNICHAIN_BRIDGED_ASSETS.includes(currencyInfo.currency.address)
  )
}
