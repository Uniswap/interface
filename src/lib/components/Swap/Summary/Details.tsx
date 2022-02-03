import { t } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { ALLOWED_PRICE_IMPACT_HIGH, ALLOWED_PRICE_IMPACT_MEDIUM } from 'constants/misc'
import { useAtom } from 'jotai'
import { integratorFeeAtom, MIN_HIGH_SLIPPAGE } from 'lib/state/settings'
import styled, { Color, ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { currencyId } from 'utils/currencyId'
import { computeRealizedPriceImpact } from 'utils/prices'

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
    <ThemedText.Caption>
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
  const priceImpact = useMemo(() => computeRealizedPriceImpact(trade), [trade])

  const integrator = window.location.hostname
  const [integratorFee] = useAtom(integratorFeeAtom)

  const details = useMemo(() => {
    // @TODO(ianlapham): Check that provider fee is even a valid list item
    return [
      // [t`Liquidity provider fee`, `${swap.lpFee} ${inputSymbol}`],
      [t`${integrator} fee`, integratorFee && `${integratorFee} ${currencyId(inputCurrency)}`],
      [
        t`Price impact`,
        `${priceImpact.toFixed(2)}%`,
        !priceImpact.lessThan(ALLOWED_PRICE_IMPACT_HIGH)
          ? 'error'
          : !priceImpact.lessThan(ALLOWED_PRICE_IMPACT_MEDIUM)
          ? 'warning'
          : undefined,
      ],
      trade.tradeType === TradeType.EXACT_INPUT
        ? [t`Maximum sent`, `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${inputCurrency.symbol}`]
        : [],
      trade.tradeType === TradeType.EXACT_OUTPUT
        ? [t`Minimum received`, `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${outputCurrency.symbol}`]
        : [],
      [
        t`Slippage tolerance`,
        `${allowedSlippage.toFixed(2)}%`,
        !allowedSlippage.lessThan(MIN_HIGH_SLIPPAGE) && 'warning',
      ],
    ].filter(isDetail)

    function isDetail(detail: unknown[]): detail is [string, string, Color | undefined] {
      return Boolean(detail[1])
    }
  }, [allowedSlippage, inputCurrency, integrator, integratorFee, outputCurrency.symbol, priceImpact, trade])
  return (
    <>
      {details.map(([label, detail, color]) => (
        <Detail key={label} label={label} value={detail} color={color} />
      ))}
    </>
  )
}
