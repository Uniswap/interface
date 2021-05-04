import { CurrencyAmount, Percent, Price } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { computeRealizedLPFeeAmount } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import SwapRoute from './SwapRoute'

export interface AdvancedSwapDetailsProps {
  trade?: V2Trade | V3Trade
}

function computePriceImpact(midPrice: Price, inputAmount: CurrencyAmount, outputAmount: CurrencyAmount): Percent {
  const exactQuote = midPrice.raw.multiply(inputAmount.raw)
  // calculate slippage := (exactQuote - outputAmount) / exactQuote
  const slippage = exactQuote.subtract(outputAmount.raw).divide(exactQuote)
  return new Percent(slippage.numerator, slippage.denominator)
}

function computePriceImpactWithMaximumSlippage(trade: V2Trade | V3Trade, allowedSlippage: Percent): Percent {
  return computePriceImpact(
    trade.route.midPrice,
    trade.maximumAmountIn(allowedSlippage),
    trade.minimumAmountOut(allowedSlippage)
  )
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
        <TYPE.black fontSize={12} color={theme.text1}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Route
          </TYPE.black>
        </RowFixed>
        <TYPE.black fontSize={12} color={theme.text1}>
          <SwapRoute trade={trade} />
        </TYPE.black>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={12} fontWeight={400} color={theme.text2}>
            Execution price vs. spot price
          </TYPE.black>
        </RowFixed>
        <TYPE.black fontSize={12} color={theme.text1}>
          {computePriceImpactWithMaximumSlippage(trade, allowedSlippage).toSignificant(4)}%
        </TYPE.black>
      </RowBetween>
    </AutoColumn>
  )
}
