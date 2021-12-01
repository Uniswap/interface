import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { LoadingRows } from 'components/Loader/styled'
import { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components/macro'

import { TYPE } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { TransactionDetailsLabel } from './styleds'
import SwapRoute from './SwapRoute'

const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg2};
`

interface AdvancedSwapDetailsProps {
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  hideRouteDiagram?: boolean
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

export function AdvancedSwapDetails({
  trade,
  allowedSlippage,
  syncing = false,
  hideRouteDiagram = false,
}: AdvancedSwapDetailsProps) {
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
      <TransactionDetailsLabel fontWeight={500} fontSize={14} hideBorder={hideRouteDiagram}>
        <Trans>Transaction Details</Trans>
      </TransactionDetailsLabel>
      {hideRouteDiagram ? null : <SwapRoute trade={trade} syncing={syncing} />}
      <Separator />
      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Liquidity Provider Fee</Trans>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={65}>
          <TYPE.black textAlign="right" fontSize={14}>
            {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Price Impact</Trans>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={50}>
          <TYPE.black textAlign="right" fontSize={14}>
            <FormattedPriceImpact priceImpact={priceImpact} />
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Allowed Slippage</Trans>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={45}>
          <TYPE.black textAlign="right" fontSize={14}>
            {allowedSlippage.toFixed(2)}%
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            {trade.tradeType === TradeType.EXACT_INPUT ? <Trans>Minimum received</Trans> : <Trans>Maximum sent</Trans>}
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={70}>
          <TYPE.black textAlign="right" fontSize={14}>
            {trade.tradeType === TradeType.EXACT_INPUT
              ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
              : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
    </AutoColumn>
  )
}
