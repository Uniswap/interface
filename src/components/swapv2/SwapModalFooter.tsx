import { Currency, TradeType } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonError } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { Dots } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { useCheckStablePairSwap, useEncodeSolana } from 'state/swap/hooks'
import { useDegenModeManager } from 'state/user/hooks'
import { TYPE } from 'theme'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { getFormattedFeeAmountUsd } from 'utils/fee'
import { checkPriceImpact, computeSlippageAdjustedAmounts, formatExecutionPrice, formatPriceImpact } from 'utils/prices'
import { checkWarningSlippage } from 'utils/slippage'

import HurryUpBanner from './HurryUpBanner'
import { StyledBalanceMaxMini, SwapCallbackError } from './styleds'

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
  feeConfig,
  startedTime,
}: {
  trade: Aggregator
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  feeConfig: FeeConfig | undefined
  startedTime: number | undefined
}) {
  const isStablePairSwap = useCheckStablePairSwap()
  const { chainId, isSolana, isEVM } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const slippageAdjustedAmounts = useMemo(
    () => computeSlippageAdjustedAmounts(trade, allowedSlippage),
    [allowedSlippage, trade],
  )
  const [isAdvancedMode] = useDegenModeManager()
  const isWarningSlippge = checkWarningSlippage(allowedSlippage, isStablePairSwap)
  const [encodeSolana] = useEncodeSolana()

  const nativeInput = useCurrencyConvertedToNative(trade.inputAmount.currency as Currency)

  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)

  const formattedFeeAmountUsd = useMemo(() => getFormattedFeeAmountUsd(trade, feeConfig), [trade, feeConfig])
  const { priceImpact } = trade
  const priceImpactResult = checkPriceImpact(priceImpact)

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
        {isEVM && (
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
        )}

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Price Impact</Trans>
            </TYPE.black>
            <InfoHelper size={14} text={t`Estimated change in price due to the size of your transaction`} />
          </RowFixed>
          <TYPE.black
            fontSize={14}
            color={priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </TYPE.black>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.subText}>
              <Trans>Max Slippage</Trans>
            </TYPE.black>
          </RowFixed>
          <TYPE.black fontSize={14} color={isWarningSlippge ? theme.warning : undefined}>
            {allowedSlippage / 100}%
          </TYPE.black>
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

      <Flex
        sx={{
          flexDirection: 'column',
          gap: '0.75rem',
          marginTop: '1rem',
        }}
      >
        <SlippageWarningNote rawSlippage={allowedSlippage} isStablePairSwap={isStablePairSwap} />

        <PriceImpactNote priceImpact={priceImpact} isDegenMode={isAdvancedMode} />

        <HurryUpBanner startedTime={startedTime} />
        <AutoRow>
          {isSolana && !encodeSolana ? (
            <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }} id="confirm-swap-or-send">
              <Dots>
                <Trans>Checking accounts</Trans>
              </Dots>
            </GreyCard>
          ) : (
            <ButtonError
              onClick={onConfirm}
              disabled={disabledConfirm}
              style={{
                ...((priceImpactResult.isHigh || priceImpactResult.isInvalid) && {
                  border: 'none',
                  background: priceImpactResult.isVeryHigh || priceImpactResult.isInvalid ? theme.red : theme.warning,
                  color: theme.text,
                }),
              }}
              id="confirm-swap-or-send"
            >
              <Text fontSize={16} fontWeight={500}>
                <Trans>Confirm Swap</Trans>
              </Text>
            </ButtonError>
          )}

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      </Flex>
    </>
  )
}
