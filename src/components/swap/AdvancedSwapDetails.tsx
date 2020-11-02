import { Trade, TradeType } from 'dxswap-sdk'
import React from 'react'
import styled from 'styled-components'
import { Field } from '../../state/swap/actions'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE, ExternalLink } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'

const InfoLink = styled(ExternalLink)`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.purple3};
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
  text-transform: uppercase;
  color: ${({ theme }) => theme.purple3};
`

function TradeSummary({ trade, allowedSlippage }: { trade: Trade; allowedSlippage: number }) {
  const { priceImpactWithoutFee, realizedLPFee, realizedLPFeeAmount } = computeTradePriceBreakdown(trade)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  return (
    <>
      <AutoColumn style={{ padding: '0 20px' }} gap="8px">
        <RowBetween>
          <RowFixed align="center">
            <TYPE.purple3 fontSize={12} fontWeight={400}>
              {isExactIn ? 'Minimum received' : 'Maximum sold'}
            </TYPE.purple3>
            <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
          </RowFixed>
          <RowFixed>
            <TYPE.purple3 fontSize={12}>
              {isExactIn
                ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.currency.symbol}` ??
                  '-'
                : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.currency.symbol}` ??
                  '-'}
            </TYPE.purple3>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.purple3 fontSize={12} fontWeight={400}>
              Price impact
            </TYPE.purple3>
            <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.purple3 fontSize={12} fontWeight={400}>
              Swap fee %
            </TYPE.purple3>
            <QuestionHelper text="A portion of each trade (between 0% - 0.30%) goes to liquidity providers as a protocol incentive." />
          </RowFixed>
          <TYPE.purple3 fontSize={12}>{realizedLPFee ? `${realizedLPFee.toSignificant(2)} %` : '-'}</TYPE.purple3>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.purple3 fontSize={12} fontWeight={400}>
              Swap fee amount
            </TYPE.purple3>
            <QuestionHelper text="The token amount of the swap fee." />
          </RowFixed>
          <TYPE.purple3 fontSize={12}>
            {realizedLPFeeAmount ? `${realizedLPFeeAmount.toSignificant(2)} ${trade.inputAmount.currency.symbol}` : '-'}
          </TYPE.purple3>
        </RowBetween>
      </AutoColumn>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()

  const showRoute = Boolean(trade && trade.route.path.length > 2)

  return (
    <AutoColumn gap="md">
      {trade && (
        <>
          <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
          {showRoute && (
            <AutoColumn style={{ padding: '0 20px' }}>
              <RowFixed>
                <TYPE.purple3 fontSize={16} fontWeight={400}>
                  Route
                </TYPE.purple3>
                <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
              </RowFixed>
              <SwapRoute trade={trade} />
            </AutoColumn>
          )}
          <AutoColumn style={{ padding: '0 24px', marginTop: '4px' }}>
            <InfoLink href={'https://uniswap.info/pair/' + trade.route.pairs[0].liquidityToken.address} target="_blank">
              View pair analytics ↗
            </InfoLink>
          </AutoColumn>
        </>
      )}
    </AutoColumn>
  )
}
