import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { AdvancedSwapDetailsContainer, DimmableText } from './styleds'
import SwapRoute from './SwapRoute'

interface AdvancedSwapDetailsProps {
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
}

export function AdvancedSwapDetails({ trade, allowedSlippage, syncing = false }: AdvancedSwapDetailsProps) {
  const { realizedLPFee, priceImpact } = useMemo(() => {
    if (!trade) return { realizedLPFee: undefined, priceImpact: undefined }

    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    const realizedLPFee = trade.inputAmount.multiply(realizedLpFeePercent)
    const priceImpact = trade.priceImpact.subtract(realizedLpFeePercent)
    return { priceImpact, realizedLPFee }
  }, [trade])

  return !trade ? null : (
    <AdvancedSwapDetailsContainer gap="8px" syncing={syncing}>
      <RowBetween>
        <SwapRoute trade={trade} />
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <DimmableText dim={syncing} fontSize={12} fontWeight={400}>
            <Trans>Liquidity Provider Fee</Trans>
          </DimmableText>
        </RowFixed>
        <DimmableText dim={syncing} textAlign="right" fontSize={12}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
        </DimmableText>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <DimmableText dim={syncing} fontSize={12} fontWeight={400}>
            <Trans>Expected price Impact</Trans>
          </DimmableText>
        </RowFixed>
        <DimmableText dim={syncing} textAlign="right" fontSize={12}>
          <FormattedPriceImpact priceImpact={priceImpact} />
        </DimmableText>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <DimmableText dim={syncing} fontSize={12} fontWeight={400}>
            <Trans>Allowed Slippage</Trans>
          </DimmableText>
        </RowFixed>
        <DimmableText dim={syncing} textAlign="right" fontSize={12}>
          {allowedSlippage.toFixed(2)}%
        </DimmableText>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <DimmableText dim={syncing} fontSize={12} fontWeight={400}>
            {trade.tradeType === TradeType.EXACT_INPUT ? (
              <Trans>Minimum amount received</Trans>
            ) : (
              <Trans>Maximum amount sent</Trans>
            )}
          </DimmableText>
        </RowFixed>
        <DimmableText dim={syncing} textAlign="right" fontSize={12}>
          {trade.tradeType === TradeType.EXACT_INPUT
            ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
            : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
        </DimmableText>
      </RowBetween>
    </AdvancedSwapDetailsContainer>
  )
}
