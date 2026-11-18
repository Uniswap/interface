import { Text, TouchableArea } from '@universe/mycelium'
import { useState } from 'react'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { marginUnwrapSymbol } from '~/features/margin/utils/marginTokenDisplay'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'

/**
 * The Margin row: the deposit's dollars with the quote-leg amount beside it (≈$1 a unit); pressing it
 * restates the amount in the exposure leg at the mark.
 */
export function MarginDepositValue({
  derivedMarginInfo: { market, direction, paymentUsdValue },
  mark,
}: {
  derivedMarginInfo: DerivedMarginInfo
  mark: number | undefined
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const [showExposure, setShowExposure] = useState(false)
  const toggle = useEvent(() => setShowExposure((prev) => !prev))
  const usd = paymentUsdValue ? Number(paymentUsdValue.toExact()) : undefined
  if (!usd) {
    return <Text color="$neutral3">—</Text>
  }
  const isShort = direction === MarginDirection.SHORT
  const [amount, leg] =
    showExposure && mark
      ? [usd / mark, isShort ? market.debt : market.collateral]
      : [usd, isShort ? market.collateral : market.debt]
  return (
    <TouchableArea onPress={toggle}>
      <AnimatedNumber
        value={formatNumberOrString({ value: usd, type: NumberType.FiatStandard })}
        numericValue={usd}
        textVariant="$body3"
        color="$neutral1"
        EndElement={
          <Text variant="body3" color="$neutral2" style={{ whiteSpace: 'pre' }}>
            {` (${formatNumberOrString({ value: amount, type: NumberType.TokenTx })} ${marginUnwrapSymbol(leg)})`}
          </Text>
        }
        endElementGap={0}
      />
    </TouchableArea>
  )
}

/** The Swapping row when paying with another token: "100 USDC → 0.05 ETH". */
export function MarginPaymentSwapValue({
  derivedMarginInfo: { paymentCurrencyAmount, paymentToken, market },
  equity,
}: {
  derivedMarginInfo: DerivedMarginInfo
  // The deposit in collateral units; undefined while a stale quote's figure is withheld.
  equity: number | undefined
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()
  const token = (value: number | undefined): string =>
    value === undefined ? '—' : formatNumberOrString({ value, type: NumberType.TokenTx })
  const paid = paymentCurrencyAmount ? Number(paymentCurrencyAmount.toExact()) : undefined
  return (
    <AnimatedNumber
      value={`${token(paid)} ${paymentToken.symbol} → ${token(equity)} ${marginUnwrapSymbol(market.collateral)}`}
      textVariant="$body3"
      color="$neutral1"
    />
  )
}
