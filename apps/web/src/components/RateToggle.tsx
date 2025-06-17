import { Currency } from '@uniswap/sdk-core'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { Flex } from 'ui/src'

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
  const tokenA = currencyA.wrapped
  const tokenB = currencyB.wrapped

  const isSorted = tokenA.sortsBefore(tokenB)

  return (
    <Flex width="fit-content" alignItems="center" onPress={handleRateToggle}>
      <ToggleWrapper width="fit-content">
        <ToggleElement isActive={isSorted} fontSize="12px">
          {isSorted ? currencyA.symbol : currencyB.symbol}
        </ToggleElement>
        <ToggleElement isActive={!isSorted} fontSize="12px">
          {isSorted ? currencyB.symbol : currencyA.symbol}
        </ToggleElement>
      </ToggleWrapper>
    </Flex>
  )
}
