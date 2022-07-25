import { useActiveWeb3React } from 'hooks'
import { TradeType, Currency } from '@kyberswap/ks-sdk-core'
import React, { useContext, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, formatExecutionPrice } from '../../utils/prices'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { StyledBalanceMaxMini, SwapCallbackError } from './styleds'
import { Aggregator } from 'utils/aggregator'
import { formattedNum } from 'utils'
import InfoHelper from 'components/InfoHelper'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import { getFormattedFeeAmountUsd } from 'utils/fee'

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
  feeConfig,
}: {
  trade: Aggregator
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  feeConfig: FeeConfig | undefined
}) {
  const { chainId } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useContext(ThemeContext)
  const slippageAdjustedAmounts = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage), [
    allowedSlippage,
    trade,
  ])

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency as Currency)

  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)

  const formattedFeeAmountUsd = useMemo(() => getFormattedFeeAmountUsd(trade, feeConfig), [trade, feeConfig])

  return (
    <>
      <AutoColumn gap="0.5rem" style={{ padding: '1rem', border: `1px solid ${theme.border}`, borderRadius: '8px' }}>
        <RowBetween align="center">
          <Text fontWeight={400} fontSize={14} color={theme.subText}>
            <Trans>Current Price</Trans>
          </Text>
          <Text
            fontWeight={500}
            fontSize={14}
            color={theme.text}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px',
            }}
          >
            {formatExecutionPrice(trade, showInverted, chainId)}
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} color={theme.text} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              {trade.tradeType === TradeType.EXACT_INPUT ? t`Minimum Received` : t`Maximum Sold`}
            </TYPE.black>
            <InfoHelper size={14} text={t`Minimum amount you will receive or your transaction will revert`} />
          </RowFixed>
          <RowFixed>
            <TYPE.black fontSize={14}>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
            </TYPE.black>
            <TYPE.black fontSize={14} marginLeft={'4px'}>
              {trade.tradeType === TradeType.EXACT_INPUT ? nativeOutput?.symbol : nativeInput?.symbol}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Gas Fee</Trans>
            </TYPE.black>
            <InfoHelper size={14} text={t`Estimated network fee for your transaction`} />
          </RowFixed>

          <TYPE.black color={theme.text} fontSize={14}>
            {trade.gasUsd ? formattedNum(trade.gasUsd?.toString(), true) : '--'}
          </TYPE.black>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Price Impact</Trans>
            </TYPE.black>
            <InfoHelper size={14} text={t`Estimated change in price due to the size of your transaction`} />
          </RowFixed>
          <TYPE.black fontSize={14} color={trade.priceImpact > 5 ? theme.red : theme.text}>
            {trade.priceImpact > 0.01 ? trade.priceImpact.toFixed(3) : '< 0.01'}%
          </TYPE.black>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Slippage</Trans>
            </TYPE.black>
          </RowFixed>
          <TYPE.black fontSize={14}>{allowedSlippage / 100}%</TYPE.black>
        </RowBetween>

        {feeConfig && (
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
                <Trans>Referral Fee</Trans>
              </TYPE.black>
              <InfoHelper size={14} text={t`Commission fee to be paid directly to your referrer`} />
            </RowFixed>
            <TYPE.black color={theme.text} fontSize={14}>
              {formattedFeeAmountUsd}
            </TYPE.black>
          </RowBetween>
        )}
      </AutoColumn>

      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{
            margin: '28px 0 0 0',
            ...(trade.priceImpact > 5 && {
              border: 'none',
              background: theme.red,
              color: theme.white,
            }),
          }}
          id="confirm-swap-or-send"
        >
          <Text fontSize={20} fontWeight={500}>
            {t`Confirm Swap`}
          </Text>
        </ButtonError>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
