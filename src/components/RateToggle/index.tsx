import React from 'react'
import { Currency } from '@uniswap/sdk-core'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'

// the order of displayed base currencies from left to right is always in sort order
// currencyA is treated as the preferred base currency
export default function RateToggle({
  currencyA,
  currencyB,
  handleRateToggle,
}: {
  currencyA: Currency
  currencyB: Currency
  handleRateToggle: () => void
}) {
  const tokenA = currencyA?.wrapped
  const tokenB = currencyB?.wrapped

  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  return tokenA && tokenB ? (
    <div style={{ width: 'fit-content', display: 'flex', alignItems: 'center' }}>
      <ToggleWrapper width="fit-content">
        <ToggleElement isActive={isSorted} fontSize="12px" onClick={handleRateToggle}>
          {isSorted ? currencyA.symbol + ' price ' : currencyB.symbol + ' price '}
        </ToggleElement>
        <ToggleElement isActive={!isSorted} fontSize="12px" onClick={handleRateToggle}>
          {isSorted ? currencyB.symbol + ' price ' : currencyA.symbol + ' price '}
        </ToggleElement>
      </ToggleWrapper>
    </div>
  ) : null
}
