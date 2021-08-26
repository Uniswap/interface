import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { AutoColumn } from 'components/Column'
import { useMemo } from 'react'
import { TYPE } from 'theme'
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
    <AdvancedSwapDetailsContainer gap="8px" dim={syncing}>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400}>
            <Trans>Liquidity Provider Fee</Trans>
          </TYPE.black>
        </RowFixed>
        <DimmableText textAlign="right" fontSize={14} dim={syncing}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
        </DimmableText>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400}>
            <Trans>Expected price Impact</Trans>
          </TYPE.black>
        </RowFixed>
        <DimmableText textAlign="right" fontSize={14} dim={syncing}>
          {/* insert placeholder when syncing to guarantee width/height */}
          {syncing ? '---' : <FormattedPriceImpact priceImpact={priceImpact} />}
        </DimmableText>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400}>
            <Trans>Allowed Slippage</Trans>
          </TYPE.black>
        </RowFixed>
        <DimmableText textAlign="right" fontSize={14} dim={syncing}>
          {allowedSlippage.toFixed(2)}%
        </DimmableText>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400}>
            {trade.tradeType === TradeType.EXACT_INPUT ? (
              <Trans>Minimum amount received</Trans>
            ) : (
              <Trans>Maximum amount sent</Trans>
            )}
          </TYPE.black>
        </RowFixed>
        <DimmableText textAlign="right" fontSize={14} dim={syncing}>
          {trade.tradeType === TradeType.EXACT_INPUT
            ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
            : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
        </DimmableText>
      </RowBetween>

      <AutoColumn>
        <TYPE.black fontSize={14} fontWeight={400}>
          <Trans>Swap Route</Trans>
        </TYPE.black>
        <SwapRoute trade={trade} dim={syncing} />
      </AutoColumn>
    </AdvancedSwapDetailsContainer>
  )
}
