import { Currency, TradeType } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import Divider from 'components/Divider'
import InfoHelper from 'components/InfoHelper'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { getFormattedFeeAmountUsd } from 'utils/fee'
import { computeSlippageAdjustedAmounts } from 'utils/prices'

import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

const IconWrapper = styled.div<{ show: boolean }>`
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ show }) => (!show ? '0deg' : '-180deg')});
  transition: transform 300ms;
`
const ContentWrapper = styled(AutoColumn)<{ show: boolean }>`
  max-height: ${({ show }) => (show ? '500px' : 0)};
  margin-top: ${({ show }) => (show ? '12px' : 0)};
  transition: margin-top 300ms ease, height 300ms ease;
  overflow: hidden;
`

interface TradeSummaryProps {
  trade: Aggregator
  allowedSlippage: number
  feeConfig?: FeeConfig | undefined
}

function TradeSummary({ trade, feeConfig, allowedSlippage }: TradeSummaryProps) {
  const theme = useTheme()
  const [show, setShow] = useState(feeConfig ? true : false)

  const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency as Currency)
  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)

  const formattedFeeAmountUsd = useMemo(() => getFormattedFeeAmountUsd(trade, feeConfig), [trade, feeConfig])

  return (
    <>
      <AutoColumn>
        <RowBetween style={{ cursor: 'pointer' }} onClick={() => setShow(prev => !prev)} role="button">
          <Text fontSize={12} fontWeight={500} color={theme.text}>
            <Trans>MORE INFORMATION</Trans>
          </Text>
          <IconWrapper show={show}>
            <DropdownSVG></DropdownSVG>
          </IconWrapper>
        </RowBetween>
        <ContentWrapper show={show} gap="0.75rem">
          <Divider />
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                {isExactIn ? t`Minimum Received` : t`Maximum Sold`}
              </TYPE.black>
              <InfoHelper size={14} text={t`Minimum amount you will receive or your transaction will revert`} />
            </RowFixed>
            <RowFixed>
              <TYPE.black color={theme.text} fontSize={12}>
                {isExactIn
                  ? !!slippageAdjustedAmounts[Field.OUTPUT]
                    ? `${formattedNum(slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(10) || '0')} ${
                        nativeOutput?.symbol
                      }`
                    : '-'
                  : !!slippageAdjustedAmounts[Field.INPUT]
                  ? `${formattedNum(slippageAdjustedAmounts[Field.INPUT]?.toSignificant(10) || '0')} ${
                      nativeInput?.symbol
                    }`
                  : '-'}
              </TYPE.black>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Gas Fee</Trans>
              </TYPE.black>

              <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={12}>
              {trade.gasUsd ? formattedNum(trade.gasUsd?.toString(), true) : '--'}
            </TYPE.black>
          </RowBetween>

          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                <Trans>Price Impact</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Estimated change in price due to the size of your transaction`} />
            </RowFixed>
            <TYPE.black fontSize={12} color={trade.priceImpact > 5 ? theme.red : theme.text}>
              {trade.priceImpact === -1
                ? '--'
                : trade.priceImpact > 0.01
                ? trade.priceImpact.toFixed(3) + '%'
                : '< 0.01%'}
            </TYPE.black>
          </RowBetween>
          {feeConfig && (
            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                  <Trans>Referral Fee</Trans>
                </TYPE.black>
                <InfoHelper size={14} text={t`Commission fee to be paid directly to your referrer`} />
              </RowFixed>
              <TYPE.black color={theme.text} fontSize={12}>
                {formattedFeeAmountUsd}
              </TYPE.black>
            </RowBetween>
          )}
          {/* <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={12} fontWeight={400} color={theme.subText}>
                  <Trans>Route</Trans>
                </TYPE.black>
              </RowFixed>
              <ButtonEmpty padding="0" width="max-content" onClick={toggleRoute}>
                <Text fontSize={12} marginRight="4px">
                  <Trans>View your trade route</Trans>
                </Text>
                <Eye size={16} />
              </ButtonEmpty>
            </RowBetween> */}
        </ContentWrapper>
      </AutoColumn>
    </>
  )
}

export interface AdvancedSwapDetailsProps {
  trade?: Aggregator
  feeConfig?: FeeConfig | undefined
}

export function AdvancedSwapDetails({ trade, feeConfig }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()

  return trade ? <TradeSummary trade={trade} feeConfig={feeConfig} allowedSlippage={allowedSlippage} /> : null
}
