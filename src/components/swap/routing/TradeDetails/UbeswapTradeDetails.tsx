import { Trade, TradeType } from '@ubeswap/sdk'
import React, { useContext } from 'react'
import { Field } from 'state/swap/actions'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../../../utils/prices'
import QuestionHelper from '../../../QuestionHelper'
import { RowBetween, RowFixed } from '../../../Row'
import FormattedPriceImpact from '../../FormattedPriceImpact'

interface Props {
  trade: Trade
  allowedSlippage: number
}

export const UbeswapTradeDetails: React.FC<Props> = ({ trade, allowedSlippage }: Props) => {
  const theme = useContext(ThemeContext)
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)
  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  return (
    <>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
            {isExactIn ? 'Minimum received' : 'Maximum sold'}
          </TYPE.black>
          <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
        </RowFixed>
        <RowFixed>
          <TYPE.black color={theme.text1} fontSize={14}>
            {isExactIn
              ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.currency.symbol}` ??
                '-'
              : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.currency.symbol}` ?? '-'}
          </TYPE.black>
        </RowFixed>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
            Price Impact
          </TYPE.black>
          <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
        </RowFixed>
        <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
            Liquidity Provider Fee
          </TYPE.black>
          <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
        </RowFixed>
        <TYPE.black fontSize={14} color={theme.text1}>
          {realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
        </TYPE.black>
      </RowBetween>
    </>
  )
}
