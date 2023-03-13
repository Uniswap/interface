import { Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React, { useState } from 'react'
import { AlertTriangle, Check } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween } from 'components/Row'
import SlippageWarningNote from 'components/SlippageWarningNote'
import PriceImpactNote from 'components/SwapForm/PriceImpactNote'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { Dots } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useEncodeSolana } from 'state/swap/hooks'
import { CloseIcon } from 'theme/components'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { checkPriceImpact } from 'utils/prices'

import SwapBrief from './SwapBrief'
import SwapDetails, { Props as SwapDetailsProps } from './SwapDetails'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px;
  gap: 16px;
  border-radius: 20px;
`

const PriceUpdateWarning = styled.div<{ isAccepted: boolean; $level: 'warning' | 'error' }>`
  margin-top: 1rem;
  border-radius: 999px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  background: ${({ $level, theme, isAccepted }) =>
    isAccepted
      ? transparentize(0.8, theme.subText)
      : $level === 'warning'
      ? transparentize(0.7, theme.warning)
      : transparentize(0.7, theme.red)};
  color: ${({ theme, isAccepted }) => (isAccepted ? theme.subText : theme.text)};
`

type Props = {
  buildResult: BuildRouteResult | undefined
  isBuildingRoute: boolean
  errorWhileBuildRoute: string | undefined
  onDismiss: () => void
  onSwap: () => void
  onRetry: () => void
}

const ConfirmSwapModalContent: React.FC<Props> = ({
  buildResult,
  isBuildingRoute,
  errorWhileBuildRoute,
  onDismiss,
  onSwap,
  onRetry,
}) => {
  const { isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const { routeSummary, slippage, isStablePairSwap } = useSwapFormContext()

  const shouldDisableConfirmButton = isBuildingRoute || !!errorWhileBuildRoute

  const priceImpactFromBuild =
    ((Number(buildResult?.data?.amountInUsd) - Number(buildResult?.data?.amountOutUsd)) * 100) /
    Number(buildResult?.data?.amountInUsd)
  const priceImpactResult = checkPriceImpact(priceImpactFromBuild)
  const outputAmountChange = Number(buildResult?.data?.outputChange?.amount) || 0

  const getSwapDetailsProps = (): SwapDetailsProps => {
    if (!buildResult?.data || !routeSummary) {
      return {
        isLoading: isBuildingRoute,
        hasError: !!errorWhileBuildRoute,

        gasUsd: undefined,
        executionPrice: undefined,
        parsedAmountOut: undefined,
        amountInUsd: undefined,
        priceImpact: undefined,
      }
    }

    const { amountIn, amountInUsd, amountOut, gasUsd } = buildResult.data
    const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
    const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
    const executionPrice = new Price(
      parsedAmountIn.currency,
      parsedAmountOut.currency,
      parsedAmountIn.quotient,
      parsedAmountOut.quotient,
    )

    return {
      isLoading: isBuildingRoute,
      hasError: !!errorWhileBuildRoute,

      gasUsd,
      executionPrice,
      parsedAmountOut,
      amountInUsd,
      priceImpact: priceImpactFromBuild,
    }
  }

  const renderSwapBrief = () => {
    if (!routeSummary) {
      return null
    }

    let { parsedAmountIn, parsedAmountOut } = routeSummary
    let changedAmount = 0

    if (buildResult?.data) {
      const { amountIn, amountOut } = buildResult.data
      parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
      parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
      const { amount } = buildResult.data.outputChange || {}
      changedAmount = Number(amount)
    }

    return (
      <SwapBrief
        $level={changedAmount > 0 ? 'better' : changedAmount < 0 ? 'worse' : undefined}
        inputAmount={parsedAmountIn}
        outputAmount={parsedAmountOut}
      />
    )
  }

  const theme = useTheme()
  const warningStyle = priceImpactResult.isVeryHigh
    ? { background: theme.red, color: theme.black }
    : priceImpactResult.isHigh
    ? { background: theme.warning, color: theme.black }
    : undefined

  const [confirmNewPrice, setConfirmNewPrice] = useState(false)

  const disableSwap = (outputAmountChange < 0 && !confirmNewPrice) || shouldDisableConfirmButton
  return (
    <Wrapper>
      <AutoColumn>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Confirm Swap</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        {outputAmountChange < 0 && (
          <PriceUpdateWarning $level={priceImpactResult.isVeryHigh ? 'error' : 'warning'} isAccepted={confirmNewPrice}>
            {confirmNewPrice ? (
              <Check size={20} />
            ) : (
              <AlertTriangle color={priceImpactResult.isVeryHigh ? theme.red : theme.warning} size={16} />
            )}
            <Text flex={1}>
              {confirmNewPrice ? (
                <Trans>New Price Accepted</Trans>
              ) : (
                <Trans>Your price has been updated. Please accept the new price before proceeding with the swap</Trans>
              )}
            </Text>
          </PriceUpdateWarning>
        )}

        {renderSwapBrief()}
      </AutoColumn>

      <SwapDetails {...getSwapDetailsProps()} />

      <Flex
        sx={{
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <SlippageWarningNote rawSlippage={slippage} isStablePairSwap={isStablePairSwap} />
        <PriceImpactNote priceImpact={priceImpactFromBuild} hasTooltip={false} />
      </Flex>

      <AutoRow>
        {isSolana && !encodeSolana ? (
          <GreyCard style={{ textAlign: 'center', borderRadius: '999px', padding: '12px' }} id="confirm-swap-or-send">
            <Dots>
              <Trans>Checking accounts</Trans>
            </Dots>
          </GreyCard>
        ) : errorWhileBuildRoute ? (
          <ButtonPrimary onClick={onRetry}>
            <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
              <Trans>Try again</Trans>
            </Text>
          </ButtonPrimary>
        ) : (
          <Flex sx={{ gap: '8px', width: '100%' }}>
            {outputAmountChange < 0 && (
              <ButtonPrimary
                style={
                  confirmNewPrice
                    ? undefined
                    : { backgroundColor: priceImpactResult.isVeryHigh ? theme.red : theme.warning, color: theme.black }
                }
                onClick={() => setConfirmNewPrice(true)}
                disabled={confirmNewPrice}
              >
                Accept New Price
              </ButtonPrimary>
            )}

            <ButtonPrimary
              onClick={onSwap}
              disabled={disableSwap}
              id="confirm-swap-or-send"
              style={disableSwap ? undefined : warningStyle}
            >
              <Text fontSize={14} fontWeight={500} as="span" lineHeight={1}>
                <Trans>Confirm Swap</Trans>
              </Text>
            </ButtonPrimary>
          </Flex>
        )}
      </AutoRow>
    </Wrapper>
  )
}

export default ConfirmSwapModalContent
