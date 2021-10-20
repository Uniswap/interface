import { Currency, TradeType } from '@dynamic-amm/sdk'
import React, { useContext, useState } from 'react'
import { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { Field } from '../../state/swap/actions'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { Aggregator } from '../../utils/aggregator'
import { formattedNum } from '../../utils'
import TradePrice from './TradePrice'

interface TradeSummaryProps {
  trade: Aggregator
  allowedSlippage: number
}

function TradeSummary({ trade, allowedSlippage }: TradeSummaryProps) {
  const theme = useContext(ThemeContext)
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency as Currency)
  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)
  return (
    <>
      <AutoColumn style={{ padding: '0 20px' }} gap="0.375rem">
        <RowBetween>
          <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
            {t`Price`}
          </TYPE.black>
          <TradePrice price={trade?.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              {isExactIn ? t`Minimum received` : t`Maximum sold`}
            </TYPE.black>
            <QuestionHelper
              text={t`Your transaction will revert if there is a large, unfavorable price movement before it is confirmed.`}
            />
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text1} fontSize={14}>
              {isExactIn
                ? !!slippageAdjustedAmounts[Field.OUTPUT]
                  ? `${formattedNum(slippageAdjustedAmounts[Field.OUTPUT]!.toSignificant(10))} ${nativeOutput?.symbol}`
                  : '-'
                : !!slippageAdjustedAmounts[Field.INPUT]
                ? `${formattedNum(slippageAdjustedAmounts[Field.INPUT]!.toSignificant(10))} ${nativeInput?.symbol}`
                : '-'}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
            <Trans>Estimated cost</Trans>
          </TYPE.black>
          <TYPE.black color={theme.text1} fontSize={14}>
            {formattedNum(trade.gasUsd?.toString(), true)}
          </TYPE.black>
        </RowBetween>
      </AutoColumn>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Aggregator
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()

  return (
    <AutoColumn gap="md">
      {trade && (
        <>
          <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
        </>
      )}
    </AutoColumn>
  )
}
