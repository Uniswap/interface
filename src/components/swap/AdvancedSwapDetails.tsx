import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import Card from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import { useContext, useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import styled, { ThemeContext } from 'styled-components/macro'

import { Separator, TYPE } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'

const StyledCard = styled(Card)`
  padding: 12px;
`

interface AdvancedSwapDetailsProps {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
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

  const { realizedLPFee, priceImpact, expectedOutputAmount } = useMemo(() => {
    if (!trade) return { realizedLPFee: undefined, expectedOutputAmount: undefined }
    const expectedOutputAmount = trade.outputAmount
    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    const realizedLPFee = trade.inputAmount.multiply(realizedLpFeePercent)
    const priceImpact = trade.priceImpact.subtract(realizedLpFeePercent)

    return { realizedLPFee, expectedOutputAmount, priceImpact }
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
              -{realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${realizedLPFee.currency.symbol}` : '-'}
            </TYPE.black>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <Separator />
        <RowBetween>
          <RowFixed style={{ marginRight: '20px' }}>
            <TYPE.subHeader color={theme.text3}>
              {trade.tradeType === TradeType.EXACT_INPUT ? (
                <Trans>Minimum received</Trans>
              ) : (
                <Trans>Maximum sent</Trans>
              )}{' '}
              <Trans>after slippage</Trans>
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
        <RowBetween>
          <TYPE.subHeader color={theme.text3}>
            <Trans>Allowed Slippage</Trans>
          </TYPE.subHeader>
          <TextWithLoadingPlaceholder syncing={syncing} width={50}>
            <TYPE.subHeader color={theme.text3}>{allowedSlippage.toFixed(2)}%</TYPE.subHeader>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <TYPE.subHeader color={theme.text3}>
            <Trans>Price Impact</Trans>
          </TYPE.subHeader>
          <TextWithLoadingPlaceholder syncing={syncing} width={50}>
            <TYPE.subHeader color={theme.text3}>
              <FormattedPriceImpact priceImpact={priceImpact} />
            </TYPE.subHeader>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        {!trade?.gasUseEstimateUSD ? null : (
          <RowBetween>
            <TYPE.subHeader color={theme.text3}>
              <Trans>Network Fee</Trans>
            </TYPE.subHeader>
            <TextWithLoadingPlaceholder syncing={syncing} width={50}>
              <TYPE.subHeader color={theme.text3}>~${trade.gasUseEstimateUSD.toFixed(2)}</TYPE.subHeader>
            </TextWithLoadingPlaceholder>
          </RowBetween>
        )}
      </AutoColumn>
    </StyledCard>
  )
}
