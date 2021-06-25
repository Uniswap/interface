import { Trans } from '@lingui/macro'
import { Percent, Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { useContext, useMemo } from 'react'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'

export interface AdvancedSwapDetailsProps {
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
}

export function AdvancedSwapDetails({ trade, allowedSlippage }: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const { realizedLPFee, priceImpact } = useMemo(() => {
    if (!trade) return { realizedLPFee: undefined, priceImpact: undefined }

    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    const realizedLPFee = trade.inputAmount.multiply(realizedLpFeePercent)
    const priceImpact = trade.priceImpact.subtract(realizedLpFeePercent)
    return { priceImpact, realizedLPFee }
  }, [trade])

  return !trade ? null : (
    <AutoColumn gap="8px">
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <Trans>Liquidity Provider Fee</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <Trans>Route</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          <SwapRoute trade={trade} />
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <Trans>Price Impact</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          <FormattedPriceImpact priceImpact={priceImpact} />
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            {trade.tradeType === TradeType.EXACT_INPUT ? <Trans>Minimum received</Trans> : <Trans>Maximum sent</Trans>}
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {trade.tradeType === TradeType.EXACT_INPUT
            ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
            : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            <Trans>Slippage tolerance</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {allowedSlippage.toFixed(2)}%
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  )
}
