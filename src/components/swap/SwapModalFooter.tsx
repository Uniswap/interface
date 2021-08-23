import { Trade, TradeType } from '@swapr/sdk'
import React, { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import {
  computeSlippageAdjustedAmounts,
  computeTradePriceBreakdown,
  formatExecutionPrice,
  warningSeverity
} from '../../utils/prices'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { StyledBalanceMaxMini, SwapCallbackError } from './styleds'

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm
}: {
  trade: Trade
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
}) {
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const slippageAdjustedAmounts = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage), [
    allowedSlippage,
    trade
  ])
  const { priceImpactWithoutFee, realizedLPFeeAmount } = useMemo(() => computeTradePriceBreakdown(trade), [trade])
  const severity = warningSeverity(priceImpactWithoutFee)

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center" mb="6px">
          <TYPE.body fontWeight={400} fontSize="13px" color="text5">
            Price
          </TYPE.body>
          <TYPE.body
            fontWeight={500}
            fontSize="12px"
            color="text5"
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px'
            }}
          >
            {formatExecutionPrice(trade, showInverted)}
            <StyledBalanceMaxMini style={{ marginLeft: 6 }} onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} />
            </StyledBalanceMaxMini>
          </TYPE.body>
        </RowBetween>

        <RowBetween mb="6px">
          <RowFixed>
            <TYPE.body fontWeight={400} fontSize="13px" color="text5">
              {trade.tradeType === TradeType.EXACT_INPUT ? 'Minimum received' : 'Maximum sold'}
            </TYPE.body>
            <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
          </RowFixed>
          <RowFixed>
            <TYPE.body fontWeight={500} fontSize="12px" color="text5">
              {trade.tradeType === TradeType.EXACT_INPUT
                ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
            </TYPE.body>
            <TYPE.body fontWeight={500} fontSize="12px" color="text5" marginLeft={'4px'}>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? trade.outputAmount.currency.symbol
                : trade.inputAmount.currency.symbol}
            </TYPE.body>
          </RowFixed>
        </RowBetween>
        <RowBetween mb="6px">
          <RowFixed>
            <TYPE.body fontWeight={400} fontSize="13px" color="text5">
              Price Impact
            </TYPE.body>
            <QuestionHelper text="The difference between the market price and your price due to trade size." />
          </RowFixed>
          <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
        </RowBetween>
        <RowBetween mb="6px">
          <RowFixed>
            <TYPE.body fontWeight={400} fontSize="13px" color="text5">
              Liquidity provider fee
            </TYPE.body>
            <QuestionHelper text="A portion of each trade goes to liquidity providers as incentive." />
          </RowFixed>
          <TYPE.body fontWeight={500} fontSize="12px" color="text5">
            {realizedLPFeeAmount
              ? `${realizedLPFeeAmount?.toSignificant(6)} ${trade.inputAmount.currency.symbol}`
              : '-'}
          </TYPE.body>
        </RowBetween>
      </AutoColumn>

      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          error={severity > 2}
          style={{ margin: '10px 0 0 0' }}
          id="confirm-swap-or-send"
        >
          <Text fontSize={13} fontWeight={600}>
            {severity > 2 ? 'Swap Anyway' : 'Confirm Swap'}
          </Text>
        </ButtonError>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
