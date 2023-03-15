import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React, { useState } from 'react'
import { AlertTriangle, Check } from 'react-feather'
import { Flex, Text } from 'rebass'
import { calculatePriceImpact } from 'services/route/utils'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
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
import { checkWarningSlippage } from 'utils/slippage'

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
  const theme = useTheme()
  const { isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const { routeSummary, slippage, isStablePairSwap, isAdvancedMode } = useSwapFormContext()
  const [hasAcceptedNewPrice, setHasAcceptedNewPrice] = useState(false)

  const shouldDisableConfirmButton = isBuildingRoute || !!errorWhileBuildRoute
  const isWarningSlippage = checkWarningSlippage(slippage, isStablePairSwap)

  const priceImpactFromBuild = buildResult?.data
    ? calculatePriceImpact(Number(buildResult?.data?.amountInUsd || 0), Number(buildResult?.data?.amountOutUsd || 0))
    : undefined

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

    let { parsedAmountIn } = routeSummary
    let changedAmount = 0
    let parsedAmountOut: CurrencyAmount<Currency> | undefined = undefined

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
        outputAmountFromBuild={parsedAmountOut}
        currencyOut={routeSummary.parsedAmountOut.currency}
        isLoading={isBuildingRoute}
      />
    )
  }

  const warningStyle =
    priceImpactResult.isVeryHigh || priceImpactResult.isInvalid
      ? { background: theme.red }
      : priceImpactResult.isHigh || isWarningSlippage
      ? { background: theme.warning }
      : undefined

  const disableByPriceImpact = !isAdvancedMode && (priceImpactResult.isVeryHigh || priceImpactResult.isInvalid)
  const disableSwap =
    (outputAmountChange < 0 && !hasAcceptedNewPrice) || shouldDisableConfirmButton || disableByPriceImpact
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
          <PriceUpdateWarning
            $level={priceImpactResult.isVeryHigh ? 'error' : 'warning'}
            isAccepted={hasAcceptedNewPrice}
          >
            {hasAcceptedNewPrice ? (
              <Check size={20} />
            ) : (
              <AlertTriangle
                color={priceImpactResult.isVeryHigh || priceImpactResult.isInvalid ? theme.red : theme.warning}
                size={16}
              />
            )}
            <Text flex={1}>
              {hasAcceptedNewPrice ? (
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
        <PriceImpactNote isAdvancedMode={isAdvancedMode} priceImpact={priceImpactFromBuild} />

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
                  hasAcceptedNewPrice
                    ? undefined
                    : {
                        backgroundColor:
                          priceImpactResult.isVeryHigh || priceImpactResult.isInvalid ? theme.red : theme.warning,
                      }
                }
                onClick={() => setHasAcceptedNewPrice(true)}
                disabled={hasAcceptedNewPrice}
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
      </Flex>
    </Wrapper>
  )
}

export default ConfirmSwapModalContent
