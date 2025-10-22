import { BridgedAsset, isBridgedAsset, UNICHAIN_BRIDGED_ASSETS } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export function checkIsBridgedAsset(currencyInfo?: CurrencyInfo): boolean {
  if (!currencyInfo) {
    return false
  }

  return (
    currencyInfo.currency.chainId === UniverseChainId.Unichain &&
    currencyInfo.currency.isToken &&
    isBridgedAsset(currencyInfo.currency.address)
  )
}

export function getBridgedAsset(currencyInfo?: Maybe<CurrencyInfo>): BridgedAsset | undefined {
  if (!currencyInfo || !currencyInfo.currency.isToken) {
    return undefined
  }
  const address = currencyInfo.currency.address
  return UNICHAIN_BRIDGED_ASSETS.find((asset) => asset.unichainAddress === address)
}
