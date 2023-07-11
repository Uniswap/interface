import { Trans } from '@lingui/macro'
import { Currency } from '@thinkincoin-libs/sdk-core'
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
    <div style={{ width: 'fit-content', display: 'flex', alignItems: 'center' }} onClick={handleRateToggle}>
      <ToggleWrapper width="fit-content">
        <ToggleElement isActive={isSorted} fontSize="12px">
          <Trans>{isSorted ? currencyA.symbol : currencyB.symbol}</Trans>
        </ToggleElement>
        <ToggleElement isActive={!isSorted} fontSize="12px">
          <Trans>{isSorted ? currencyB.symbol : currencyA.symbol}</Trans>
        </ToggleElement>
      </ToggleWrapper>
    </div>
  ) : null
}
