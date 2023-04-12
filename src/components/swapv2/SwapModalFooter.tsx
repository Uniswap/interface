import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonError } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { Dots } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import useTheme from 'hooks/useTheme'
import { TruncatedText } from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { Field } from 'state/swap/actions'
import { useCheckStablePairSwap, useEncodeSolana } from 'state/swap/hooks'
import { useDegenModeManager } from 'state/user/hooks'
import { ExternalLink, TYPE } from 'theme'
import { formattedNum } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { getFormattedFeeAmountUsd } from 'utils/fee'
import { checkPriceImpact, computeSlippageAdjustedAmounts, formatExecutionPrice, formatPriceImpact } from 'utils/prices'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'

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
  const { chainId, isSolana } = useActiveWeb3React()
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useTheme()
  const slippageAdjustedAmounts = useMemo(
    () => computeSlippageAdjustedAmounts(trade, allowedSlippage),
    [allowedSlippage, trade],
  )
  const [isDegenMode] = useDegenModeManager()
  const isWarningSlippage = checkWarningSlippage(allowedSlippage, isStablePairSwap)
  const [encodeSolana] = useEncodeSolana()

  const nativeOutput = useCurrencyConvertedToNative(trade.outputAmount.currency as Currency)

  const formattedFeeAmountUsd = useMemo(() => getFormattedFeeAmountUsd(trade, feeConfig), [trade, feeConfig])
  const { priceImpact } = trade
  const priceImpactResult = checkPriceImpact(priceImpact)

  return (
    <>
      <AutoColumn gap="8px" style={{ padding: '12px 16px', border: `1px solid ${theme.border}`, borderRadius: '16px' }}>
        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <Text fontWeight={400} fontSize={12} color={theme.subText}>
            <Trans>Current Price</Trans>
          </Text>
          <Text
            fontWeight={500}
            fontSize={12}
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

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed style={{ minWidth: 'max-content' }}>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText} minWidth="max-content">
              <MouseoverTooltip
                width="200px"
                text={<Trans>You will receive at least this amount or your transaction will revert</Trans>}
                placement="right"
              >
                <Trans>Minimum Received</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <TYPE.black fontSize={12} fontWeight={500}>
            <Flex style={{ color: theme.text, fontWeight: 500, whiteSpace: 'nowrap' }}>
              <TruncatedText style={{ width: '-webkit-fill-available' }}>
                {formattedNum(slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(10) || '', false, 10)}
              </TruncatedText>
              <Text style={{ minWidth: 'auto' }}>&nbsp;{nativeOutput?.symbol}</Text>
            </Flex>
          </TYPE.black>
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
              <MouseoverTooltip
                text={
                  <div>
                    <Trans>Estimated change in price due to the size of your transaction.</Trans>
                    <Trans>
                      <Text fontSize={12}>
                        Read more{' '}
                        <a
                          href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <b>here ↗</b>
                        </a>
                      </Text>
                    </Trans>
                  </div>
                }
                placement="right"
              >
                <Trans>Price Impact</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <TYPE.black
            fontSize={12}
            color={priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </TYPE.black>
        </RowBetween>

        <RowBetween align="center" height="20px" style={{ gap: '16px' }}>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} color={theme.subText}>
              <MouseoverTooltip
                text={
                  <Text>
                    <Trans>
                      During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                      <ExternalLink href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage">
                        here ↗
                      </ExternalLink>
                    </Trans>
                  </Text>
                }
                placement="right"
              >
                <Trans>Max Slippage</Trans>
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <TYPE.black fontSize={12} color={isWarningSlippage ? theme.warning : undefined}>
            {formatSlippage(allowedSlippage)}
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

        <PriceImpactNote priceImpact={priceImpact} isDegenMode={isDegenMode} />

        <HurryUpBanner startedTime={startedTime} />
        <AutoRow>
          {isSolana && !encodeSolana ? (
            <GreyCard
              style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }}
              id="confirm-swap-or-send"
              fontSize={14}
            >
              <Dots>
                <Trans>Checking accounts</Trans>
              </Dots>
            </GreyCard>
          ) : (
            <ButtonError
              onClick={onConfirm}
              disabled={disabledConfirm}
              style={{
                ...((priceImpactResult.isVeryHigh || priceImpactResult.isInvalid) && {
                  border: 'none',
                  background: theme.red,
                  color: theme.text,
                }),
              }}
              id="confirm-swap-or-send"
            >
              <Text fontSize={14} fontWeight={500}>
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
