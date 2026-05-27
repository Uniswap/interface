import type { FloorPriceInputState, InputCurrency } from '~/pages/Liquidity/CreateAuction/types'

export function getInitialConfigureAuctionInputCurrency({
  floorPriceInput,
  hasUsdOracle,
}: {
  floorPriceInput: FloorPriceInputState | undefined
  hasUsdOracle: boolean
}): InputCurrency {
  // Trust a persisted USD selection even if the oracle snapshot hasn't resolved yet on this
  // mount. USD was available when the user first picked it (the chain is locked for the rest
  // of the flow), and the snapshot resets on remount — e.g., editing back from the review step.
  // Falling back to 'raise' here flips the denominator under the user.
  if (floorPriceInput?.inputCurrency === 'usd') {
    return 'usd'
  }
  return floorPriceInput?.inputCurrency ?? (hasUsdOracle ? 'usd' : 'raise')
}

export function getNextConfigureAuctionInputCurrency({
  current,
  floorPriceInput,
  hasUsdOracle,
  raiseCurrencyChanged,
}: {
  current: InputCurrency
  floorPriceInput: FloorPriceInputState | undefined
  hasUsdOracle: boolean
  raiseCurrencyChanged: boolean
}): InputCurrency {
  if (raiseCurrencyChanged) {
    return hasUsdOracle ? 'usd' : 'raise'
  }
  // Only fall back from USD when there's no persisted USD selection — otherwise the oracle
  // is mid-snapshot, not permanently unavailable, and we should stay on USD.
  if (current === 'usd' && !hasUsdOracle && floorPriceInput?.inputCurrency !== 'usd') {
    return 'raise'
  }
  if (current === 'raise' && hasUsdOracle && floorPriceInput === undefined) {
    return 'usd'
  }
  return current
}
