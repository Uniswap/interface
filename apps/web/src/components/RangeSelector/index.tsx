import { Currency, Price, Token } from '@uniswap/sdk-core'
import StepCounter from 'components/InputStepCounter'
import { Trans } from 'react-i18next'
import { Bound } from 'state/mint/v3/actions'
import { Flex } from 'ui/src'

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
  ticksAtLimit,
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  getDecrementLower: () => string
  getIncrementLower: () => string
  getDecrementUpper: () => string
  getIncrementUpper: () => string
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
  currencyA?: Currency | null
  currencyB?: Currency | null
  feeAmount?: number
  ticksAtLimit: { [bound in Bound]?: boolean | undefined }
}) {
  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped
  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  return (
    <Flex gap="$gap8" width="100%">
      <StepCounter
        width="100%"
        value={ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER] ? '0' : (leftPrice?.toSignificant(8) ?? '')}
        onUserInput={onLeftRangeInput}
        decrement={isSorted ? getDecrementLower : getIncrementUpper}
        increment={isSorted ? getIncrementLower : getDecrementUpper}
        decrementDisabled={leftPrice === undefined || ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]}
        incrementDisabled={leftPrice === undefined || ticksAtLimit[isSorted ? Bound.LOWER : Bound.UPPER]}
        feeAmount={feeAmount}
        label={leftPrice ? `${currencyB?.symbol}` : '-'}
        title={<Trans i18nKey="common.lowPrice" />}
        tokenA={currencyA?.symbol}
        tokenB={currencyB?.symbol}
      />
      <StepCounter
        width="100%"
        value={ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER] ? '∞' : (rightPrice?.toSignificant(8) ?? '')}
        onUserInput={onRightRangeInput}
        decrement={isSorted ? getDecrementUpper : getIncrementLower}
        increment={isSorted ? getIncrementUpper : getDecrementLower}
        incrementDisabled={rightPrice === undefined || ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]}
        decrementDisabled={rightPrice === undefined || ticksAtLimit[isSorted ? Bound.UPPER : Bound.LOWER]}
        feeAmount={feeAmount}
        label={rightPrice ? `${currencyB?.symbol}` : '-'}
        tokenA={currencyA?.symbol}
        tokenB={currencyB?.symbol}
        title={<Trans i18nKey="common.highPrice" />}
      />
    </Flex>
  )
}
