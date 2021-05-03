import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { computeTradePriceBreakdown } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'

function TradeSummary({ trade }: { trade: V2Trade | V3Trade }) {
  const theme = useContext(ThemeContext)
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)

  return (
    <>
      <AutoColumn gap={'8px'}>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
              Price Impact
            </TYPE.black>
            {/* <QuestionHelper text="The difference between the market price and estimated price due to trade size." /> */}
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
              Liquidity Provider Fee
            </TYPE.black>
            {/* <QuestionHelper text="A portion of each trade goes to liquidity providers as a protocol incentive." /> */}
          </RowFixed>
          <TYPE.black fontSize={12} color={theme.text1}>
            {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: V2Trade | V3Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const showRoute = Boolean(
    (trade && trade instanceof V2Trade && trade.route.pairs.length > 2) ||
      (trade instanceof V3Trade && trade.route.pools.length > 2)
  )

  return (
    <AutoColumn gap="0px">
      {trade && (
        <>
          <TradeSummary trade={trade} />
          {showRoute && (
            <>
              <RowBetween style={{ padding: '4px 16px' }}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                    Route
                  </TYPE.black>
                  {/* <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." /> */}
                </span>
                <SwapRoute trade={trade} />
              </RowBetween>
            </>
          )}
        </>
      )}
    </AutoColumn>
  )
}
