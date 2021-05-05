import React from 'react'
import { Currency, Price } from '@uniswap/sdk-core'
import StepCounter from 'components/InputStepCounter/InputStepCounter'
import { RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { wrappedCurrency } from 'utils/wrappedCurrency'

// currencyA is the base token
export default function RangeSelector({
  priceLower,
  priceUpper,
  onLeftRangeInput,
  onRightRangeInput,
  getDecrementLower,
  getIncrementLower,
  getDecrementUpper,
  getIncrementUpper,
  currencyA,
  currencyB,
  feeAmount,
}: {
  priceLower?: Price
  priceUpper?: Price
  getDecrementLower: () => string
  getIncrementLower: () => string
  getDecrementUpper: () => string
  getIncrementUpper: () => string
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  currencyA?: Currency | null
  currencyB?: Currency | null
  feeAmount?: number
}) {
  const { chainId } = useActiveWeb3React()
  const tokenA = wrappedCurrency(currencyA ?? undefined, chainId)
  const tokenB = wrappedCurrency(currencyB ?? undefined, chainId)
  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  return (
    <RowBetween>
      <StepCounter
        value={leftPrice?.toSignificant(5) ?? ''}
        onUserInput={onLeftRangeInput}
        width="48%"
        decrement={isSorted ? getDecrementLower : getIncrementUpper}
        increment={isSorted ? getIncrementLower : getDecrementUpper}
        feeAmount={feeAmount}
        label={leftPrice ? `${currencyB?.symbol}` : '-'}
        title={'Min Price'}
        tokenA={currencyA?.symbol}
        tokenB={currencyB?.symbol}
      />
      <StepCounter
        value={rightPrice?.toSignificant(5) ?? ''}
        onUserInput={onRightRangeInput}
        width="48%"
        decrement={isSorted ? getDecrementUpper : getIncrementLower}
        increment={isSorted ? getIncrementUpper : getDecrementLower}
        feeAmount={feeAmount}
        label={rightPrice ? `${currencyB?.symbol}` : '-'}
        tokenA={currencyA?.symbol}
        tokenB={currencyB?.symbol}
        title={'Max Price'}
      />
    </RowBetween>
  )
}
