import { Trans } from '@lingui/macro'
import { Percent, Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { useContext, useMemo } from 'react'
import { ThemeContext } from 'styled-components/macro'
import { TYPE } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'

interface AdvancedSwapDetailsProps {
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
    <AutoColumn gap="8px" style={{ padding: '.5rem' }}>
      <RowBetween>
        <SwapRoute trade={trade} />
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400}>
            <Trans>Liquidity Provider Fee</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400}>
            <Trans>Expected price Impact</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12}>
          <FormattedPriceImpact priceImpact={priceImpact} />
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400}>
            <Trans>Allowed Slippage</Trans>
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12}>
          {allowedSlippage.toFixed(2)}%
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400}>
            {trade.tradeType === TradeType.EXACT_INPUT ? (
              <Trans>Minimum amount received</Trans>
            ) : (
              <Trans>Maximum amount sent</Trans>
            )}
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12}>
          {trade.tradeType === TradeType.EXACT_INPUT
            ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
            : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  )
}
