import { t } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { integratorFeeAtom } from 'lib/state/settings'
import { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { currencyId } from 'utils/currencyId'
import { computeRealizedLPFeePercent } from 'utils/prices'

import Row from '../../Row'

interface DetailProps {
  label: string
  value: string
}

function Detail({ label, value }: DetailProps) {
  return (
    <ThemedText.Caption>
      <Row gap={2}>
        <span>{label}</span>
        <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
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
  const [integratorFee] = useAtom(integratorFeeAtom)

  const priceImpact = useMemo(() => {
    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    return trade.priceImpact.subtract(realizedLpFeePercent)
  }, [trade])

  const details = useMemo((): [string, string][] => {
    // @TODO(ianlapham): Check that provider fee is even a valid list item
    return [
      // [t`Liquidity provider fee`, `${swap.lpFee} ${inputSymbol}`],
      [t`${integrator} fee`, integratorFee && `${integratorFee} ${currencyId(inputCurrency)}`],
      [t`Price impact`, `${priceImpact.toFixed(2)}%`],
      trade.tradeType === TradeType.EXACT_INPUT
        ? [t`Maximum sent`, `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${inputCurrency.symbol}`]
        : [],
      trade.tradeType === TradeType.EXACT_OUTPUT
        ? [t`Minimum received`, `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${outputCurrency.symbol}`]
        : [],
      [t`Slippage tolerance`, `${allowedSlippage.toFixed(2)}%`],
    ].filter(isDetail)

    function isDetail(detail: unknown[]): detail is [string, string] {
      return Boolean(detail[1])
    }
  }, [allowedSlippage, inputCurrency, integrator, integratorFee, outputCurrency.symbol, priceImpact, trade])
  return (
    <>
      {details.map(([label, detail]) => (
        <Detail key={label} label={label} value={detail} />
      ))}
    </>
  )
}
