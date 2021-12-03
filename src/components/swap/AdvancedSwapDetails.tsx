import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { OutlineCard } from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components/macro'

import { Separator, TYPE } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

const StyledCard = styled(OutlineCard)`
  border: 1px solid ${({ theme }) => theme.bg2};
  padding: 12px;
`

interface AdvancedSwapDetailsProps {
  trade?: Trade<Currency, Currency, TradeType>
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

export function AdvancedSwapDetails({ trade, allowedSlippage, syncing = false }: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const { realizedLPFee, expectedOutputAmount } = useMemo(() => {
    if (!trade) return { realizedLPFee: undefined, expectedOutputAmount: undefined }
    const expectedOutputAmount = trade.outputAmount
    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    const realizedLPFee = trade.inputAmount.multiply(realizedLpFeePercent)
    return { realizedLPFee, expectedOutputAmount }
  }, [trade])

  return !trade ? null : (
    <StyledCard>
      <AutoColumn gap="8px">
        <RowBetween>
          <RowFixed>
            <TYPE.subHeader color={theme.text1}>
              <Trans>Expected Output</Trans>
            </TYPE.subHeader>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={65}>
            <TYPE.black textAlign="right" fontSize={14}>
              {expectedOutputAmount
                ? `${expectedOutputAmount.toSignificant(4)}  ${expectedOutputAmount.currency.symbol}`
                : '-'}
            </TYPE.black>
          </TextWithLoadingPlaceholder>
        </RowBetween>
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
        <Separator />
        <RowBetween>
          <RowFixed>
            <TYPE.subHeader color={theme.text3}>
              {trade.tradeType === TradeType.EXACT_INPUT ? (
                <Trans>Minimum received</Trans>
              ) : (
                <Trans>Maximum sent</Trans>
              )}{' '}
              <Trans>after slippage</Trans> {`(${allowedSlippage.toFixed(2)}%)`}
            </TYPE.subHeader>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>
            <TYPE.black textAlign="right" fontSize={14} color={theme.text3}>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
                : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
            </TYPE.black>
          </TextWithLoadingPlaceholder>
        </RowBetween>
      </AutoColumn>
    </StyledCard>
  )
}
