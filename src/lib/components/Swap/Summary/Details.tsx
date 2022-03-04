import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useAtomValue } from 'jotai/utils'
import { getSlippageWarning } from 'lib/hooks/useAllowedSlippage'
import { feeOptionsAtom } from 'lib/state/swap'
import styled, { Color, ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { currencyId } from 'utils/currencyId'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { computeRealizedLPFeeAmount, computeRealizedPriceImpact, getPriceImpactWarning } from 'utils/prices'

import Row from '../../Row'

const Value = styled.span<{ color?: Color }>`
  color: ${({ color, theme }) => color && theme[color]};
  white-space: nowrap;
`

interface DetailProps {
  label: string
  value: string
  color?: Color
}

function Detail({ label, value, color }: DetailProps) {
  return (
    <ThemedText.Caption userSelect>
      <Row gap={2}>
        <span>{label}</span>
        <Value color={color}>{value}</Value>
      </Row>
    </ThemedText.Caption>
  )
}

interface DetailsProps {
  trade: Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
}

export default function Details({ trade, allowedSlippage }: DetailsProps) {
  const { inputAmount, outputAmount } = trade
  const inputCurrency = inputAmount.currency
  const outputCurrency = outputAmount.currency
  const integrator = window.location.hostname
  const feeOptions = useAtomValue(feeOptionsAtom)
  const priceImpact = useMemo(() => computeRealizedPriceImpact(trade), [trade])
  const lpFeeAmount = useMemo(() => computeRealizedLPFeeAmount(trade), [trade])
  const { i18n } = useLingui()

  const details = useMemo(() => {
    const rows: Array<[string, string] | [string, string, Color | undefined]> = []
    // @TODO(ianlapham): Check that provider fee is even a valid list item

    if (feeOptions) {
      const fee = outputAmount.multiply(feeOptions.fee)
      if (fee.greaterThan(0)) {
        const parsedFee = formatCurrencyAmount(fee, 6, i18n.locale)
        rows.push([t`${integrator} fee`, `${parsedFee} ${outputCurrency.symbol || currencyId(outputCurrency)}`])
      }
    }

    rows.push([t`Price impact`, `${priceImpact.toFixed(2)}%`, getPriceImpactWarning(priceImpact)])

    if (lpFeeAmount) {
      const parsedLpFee = formatCurrencyAmount(lpFeeAmount, 6, i18n.locale)
      rows.push([t`Liquidity provider fee`, `${parsedLpFee} ${inputCurrency.symbol || currencyId(inputCurrency)}`])
    }

    if (trade.tradeType === TradeType.EXACT_OUTPUT) {
      const localizedMaxSent = formatCurrencyAmount(trade.maximumAmountIn(allowedSlippage), 6, i18n.locale)
      rows.push([t`Maximum sent`, `${localizedMaxSent} ${inputCurrency.symbol}`])
    }

    if (trade.tradeType === TradeType.EXACT_INPUT) {
      const localizedMaxSent = formatCurrencyAmount(trade.minimumAmountOut(allowedSlippage), 6, i18n.locale)
      rows.push([t`Minimum received`, `${localizedMaxSent} ${outputCurrency.symbol}`])
    }

    rows.push([t`Slippage tolerance`, `${allowedSlippage.toFixed(2)}%`, getSlippageWarning(allowedSlippage)])

    return rows
  }, [
    feeOptions,
    priceImpact,
    lpFeeAmount,
    trade,
    allowedSlippage,
    outputAmount,
    i18n.locale,
    integrator,
    outputCurrency,
    inputCurrency,
  ])

  return (
    <>
      {details.map(([label, detail, color]) => (
        <Detail key={label} label={label} value={detail} color={color} />
      ))}
    </>
  )
}
