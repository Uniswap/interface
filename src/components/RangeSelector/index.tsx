import { Trans } from '@lingui/macro'
import React from 'react'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import StepCounter from 'components/InputStepCounter/InputStepCounter'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'
import PresetsButtons from './PresetsButtons'
import { batch } from 'react-redux'
import { Bound } from 'state/mint/v3/actions'

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
  getSetRange,
  getSetFullRange,
  currencyA,
  currencyB,
  feeAmount,
  atBounds,
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  getDecrementLower: () => string
  getIncrementLower: () => string
  getDecrementUpper: () => string
  getIncrementUpper: () => string
  getSetRange: (numTicks: number) => string[]
  getSetFullRange: () => void
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  currencyA?: Currency | null
  currencyB?: Currency | null
  feeAmount?: number
  atBounds: { [bound in Bound]?: boolean | undefined }
}) {
  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped
  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  return (
    <AutoColumn gap="md">
      <PresetsButtons
        feeAmount={feeAmount}
        setRange={(numTicks) => {
          const [range1, range2] = getSetRange(numTicks)
          batch(() => {
            onLeftRangeInput(isSorted ? range1 : range2)
            onRightRangeInput(isSorted ? range2 : range1)
          })
        }}
        setFullRange={getSetFullRange}
      />
      <RowBetween>
        <StepCounter
          value={atBounds[Bound.LOWER] ? '0' : leftPrice?.toSignificant(5) ?? ''}
          onUserInput={onLeftRangeInput}
          width="48%"
          decrement={isSorted ? getDecrementLower : getIncrementUpper}
          increment={isSorted ? getIncrementLower : getDecrementUpper}
          decrementDisabled={atBounds[Bound.LOWER]}
          incrementDisabled={atBounds[Bound.LOWER]}
          feeAmount={feeAmount}
          label={leftPrice ? `${currencyB?.symbol}` : '-'}
          title={<Trans>Min Price</Trans>}
          tokenA={currencyA?.symbol}
          tokenB={currencyB?.symbol}
        />
        <StepCounter
          value={atBounds[Bound.UPPER] ? '∞' : rightPrice?.toSignificant(5) ?? ''}
          onUserInput={onRightRangeInput}
          width="48%"
          decrement={isSorted ? getDecrementUpper : getIncrementLower}
          increment={isSorted ? getIncrementUpper : getDecrementLower}
          incrementDisabled={atBounds[Bound.UPPER]}
          decrementDisabled={atBounds[Bound.UPPER]}
          feeAmount={feeAmount}
          label={rightPrice ? `${currencyB?.symbol}` : '-'}
          tokenA={currencyA?.symbol}
          tokenB={currencyB?.symbol}
          title={<Trans>Max Price</Trans>}
        />
      </RowBetween>
    </AutoColumn>
  )
}
