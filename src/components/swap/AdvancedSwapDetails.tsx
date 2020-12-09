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
  font-size: 11px;
  line-height: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
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
            <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
              {isExactIn ? 'Minimum received' : 'Maximum sold'}
            </TYPE.body>
            <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
          </RowFixed>
          <RowFixed>
            <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
              {isExactIn
                ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.currency.symbol}` ??
                  '-'
                : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.currency.symbol}` ??
                  '-'}
            </TYPE.body>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
              Price impact
            </TYPE.body>
            <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
              Swap fee %
            </TYPE.body>
            <QuestionHelper text="A portion of each trade (between 0% - 0.30%) goes to liquidity providers as a protocol incentive." />
          </RowFixed>
          <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
            {realizedLPFee ? `${realizedLPFee.toSignificant(2)} %` : '-'}
          </TYPE.body>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
              Swap fee amount
            </TYPE.body>
            <QuestionHelper text="The token amount of the swap fee." />
          </RowFixed>
          <TYPE.body fontSize="12px" lineHeight="15px" fontWeight="500">
            {realizedLPFeeAmount ? `${realizedLPFeeAmount.toSignificant(2)} ${trade.inputAmount.currency.symbol}` : '-'}
          </TYPE.body>
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
    <AutoColumn gap="8px">
      {trade && (
        <>
          <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
          {showRoute && (
            <AutoColumn style={{ padding: '0 20px' }}>
              <RowFixed>
                <TYPE.body fontSize="14px" lineHeight="17px" fontWeight="500">
                  Route
                </TYPE.body>
                <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
              </RowFixed>
              <SwapRoute trade={trade} />
            </AutoColumn>
          )}
          <AutoColumn style={{ padding: '0 24px', marginTop: '8px' }}>
            <InfoLink href={'https://dxstats.eth.link/' + trade.route.pairs[0].liquidityToken.address} target="_blank">
              View pair analytics ↗
            </InfoLink>
          </AutoColumn>
        </>
      )}
    </AutoColumn>
  )
}
