import { Currency, Price } from '@uniswap/sdk-core'
import StepCounter from 'components/InputStepCounter/InputStepCounter'
import { RowBetween } from 'components/Row'
import React from 'react'

// currencyA is the base token
export default function RangeSelector({
  priceLower,
  priceUpper,
  onUpperRangeInput,
  onLowerRangeInput,
  getLowerDecrement,
  getLowerIncrement,
  getUpperDecrement,
  getUpperIncrement,
  currencyA,
  currencyB,
  feeAmount,
  fixedValueLower,
  fixedValueUpper,
}: {
  priceLower?: Price
  priceUpper?: Price
  getLowerIncrement?: () => string
  getLowerDecrement?: () => string
  getUpperIncrement?: () => string
  getUpperDecrement?: () => string
  onLowerRangeInput: (typedValue: string) => void
  onUpperRangeInput: (typedValue: string) => void
  currencyA?: Currency | null
  currencyB?: Currency | null
  feeAmount?: number
  fixedValueLower?: string
  fixedValueUpper?: string
}) {
  return (
    <RowBetween>
      <StepCounter
        value={fixedValueLower ?? priceLower?.toSignificant(5) ?? ''}
        onUserInput={onLowerRangeInput}
        width="48%"
        getIncrementValue={getLowerIncrement}
        getDecrementValue={getLowerDecrement}
        feeAmount={feeAmount}
        label={
          priceLower && currencyA && currencyB
            ? `${priceLower.toSignificant(4)} ${currencyB.symbol} / 1 ${currencyA.symbol}`
            : '-'
        }
        locked={!!fixedValueLower}
      />
      <StepCounter
        value={fixedValueUpper ?? priceUpper?.toSignificant(5) ?? ''}
        onUserInput={onUpperRangeInput}
        width="48%"
        getDecrementValue={getUpperDecrement}
        getIncrementValue={getUpperIncrement}
        feeAmount={feeAmount}
        label={
          priceUpper && currencyA && currencyB
            ? `${priceUpper.toSignificant(4)} ${currencyB?.symbol} / 1 ${currencyA?.symbol}`
            : '-'
        }
        locked={!!fixedValueUpper}
      />
    </RowBetween>
  )
}
