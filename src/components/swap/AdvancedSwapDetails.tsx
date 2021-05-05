import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { computePriceImpactWithMaximumSlippage } from '../../utils/computePriceImpactWithMaximumSlippage'
import { computeRealizedLPFeeAmount } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'

export interface AdvancedSwapDetailsProps {
  trade?: V2Trade | V3Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const realizedLPFee = computeRealizedLPFeeAmount(trade)
  const [allowedSlippage] = useUserSlippageTolerance()

  return !trade ? null : (
    <AutoColumn gap="8px">
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Liquidity Provider Fee
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Route
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          <SwapRoute trade={trade} />
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Execution price vs. spot price
          </TYPE.black>
        </RowFixed>
        <TYPE.black textAlign="right" fontSize={12} color={theme.text1}>
          <FormattedPriceImpact priceImpact={computePriceImpactWithMaximumSlippage(trade, allowedSlippage)} />
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  )
}
