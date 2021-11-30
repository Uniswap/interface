import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { LoadingRows } from 'components/Loader/styled'
import { useContext, useMemo } from 'react'
import { ThemeContext } from 'styled-components/macro'

import { TextPreset } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { TransactionDetailsLabel } from './styleds'

interface AdvancedSwapDetailsProps {
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
}

function TextWithLoadingPlaceholder({
  syncing,
  width,
  children,
}: {
  syncing: boolean
  width: number
  children: JSX.Element
}) {
  return syncing ? (
    <LoadingRows>
      <div style={{ height: '15px', width: `${width}px` }} />
    </LoadingRows>
  ) : (
    children
  )
}

export function AdvancedSwapDetails({ trade, allowedSlippage, syncing = false }: AdvancedSwapDetailsProps) {
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
      <TransactionDetailsLabel fontWeight={500} fontSize={14}>
        <Trans>Transaction Details</Trans>
      </TransactionDetailsLabel>
      <RowBetween>
        <RowFixed>
          <TextPreset.SubHeader color={theme.text1}>
            <Trans>Liquidity Provider Fee</Trans>
          </TextPreset.SubHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={65}>
          <TextPreset.Black textAlign="right" fontSize={14}>
            {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
          </TextPreset.Black>
        </TextWithLoadingPlaceholder>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TextPreset.SubHeader color={theme.text1}>
            <Trans>Price Impact</Trans>
          </TextPreset.SubHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={50}>
          <TextPreset.Black textAlign="right" fontSize={14}>
            <FormattedPriceImpact priceImpact={priceImpact} />
          </TextPreset.Black>
        </TextWithLoadingPlaceholder>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TextPreset.SubHeader color={theme.text1}>
            <Trans>Allowed Slippage</Trans>
          </TextPreset.SubHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={45}>
          <TextPreset.Black textAlign="right" fontSize={14}>
            {allowedSlippage.toFixed(2)}%
          </TextPreset.Black>
        </TextWithLoadingPlaceholder>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TextPreset.SubHeader color={theme.text1}>
            {trade.tradeType === TradeType.EXACT_INPUT ? <Trans>Minimum received</Trans> : <Trans>Maximum sent</Trans>}
          </TextPreset.SubHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={70}>
          <TextPreset.Black textAlign="right" fontSize={14}>
            {trade.tradeType === TradeType.EXACT_INPUT
              ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
              : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
          </TextPreset.Black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
    </AutoColumn>
  )
}
