import { t } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { useAtom } from 'jotai'
import { useSwapInfo } from 'lib/hooks/swap'
import { integratorFeeAtom } from 'lib/state/swap'
import { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { currencyId } from 'utils/currencyId'
import { computeRealizedLPFeePercent } from 'utils/prices'

import Row from '../../Row'

interface DetailProps {
  label: string
  value: string | JSX.Element
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
}

export default function Details({ trade }: DetailsProps) {
  const integrator = window.location.hostname

  const { allowedSlippage } = useSwapInfo()

  const { inputAmount, outputAmount } = trade
  const inputCurrency = inputAmount.currency
  const outputCurrency = outputAmount.currency

  const [integratorFee] = useAtom(integratorFeeAtom)

  const priceImpact = useMemo(() => {
    if (!trade) return undefined
    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    const priceImpact = trade.priceImpact.subtract(realizedLpFeePercent)
    return priceImpact
  }, [trade])

  const details = useMemo((): [string, string][] => {
    // @TODO(ianlapham) check that provdier fee is even a valid list item
    return [
      // [t`Liquidity provider fee`, `${swap.lpFee} ${inputSymbol}`],
      [t`${integrator} fee`, integratorFee && `${integratorFee} ${currencyId(inputCurrency)}`],
      [t`Price impact`, `${priceImpact?.toFixed(2)}%`],
      [t`Maximum sent`, `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${inputCurrency.symbol}`],
      [t`Minimum received`, `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${outputCurrency.symbol}`],
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
