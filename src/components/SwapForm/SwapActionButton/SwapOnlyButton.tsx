import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useCallback, useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import SwapModal from 'components/SwapForm/SwapModal'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { MouseoverTooltip } from 'components/Tooltip'
import { Dots } from 'components/swapv2/styleds'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useSwapCallbackV3 from 'hooks/useSwapCallbackV3'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { useEncodeSolana } from 'state/swap/hooks'
import { DetailedRouteSummary } from 'types/route'
import { toCurrencyAmount } from 'utils/currencyAmount'
import { checkPriceImpact } from 'utils/prices'

const CustomPrimaryButton = styled(ButtonPrimary).attrs({
  id: 'swap-button',
})<{ $minimal?: boolean }>`
  border: none;
  font-weight: 500;

  &:disabled {
    border: none;
  }

  width: ${({ $minimal }) => ($minimal ? '48%' : '100%')};
`

export type Props = {
  minimal?: boolean
  isDegenMode: boolean
  routeSummary: DetailedRouteSummary | undefined
  isGettingRoute: boolean
  isProcessingSwap: boolean
  isApproved?: boolean

  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  balanceOut: CurrencyAmount<Currency> | undefined
  parsedAmount: CurrencyAmount<Currency> | undefined

  setProcessingSwap: React.Dispatch<React.SetStateAction<boolean>>
  setErrorWhileSwap: (e: string) => void
  buildRoute: () => Promise<BuildRouteResult>
}

const SwapOnlyButton: React.FC<Props> = ({
  minimal,
  isDegenMode,
  routeSummary,
  isGettingRoute,
  isProcessingSwap,
  isApproved,

  currencyIn,
  currencyOut,
  balanceIn,
  balanceOut,
  parsedAmount,

  setProcessingSwap,
  setErrorWhileSwap,
  buildRoute,
}) => {
  const { isSolana } = useActiveWeb3React()
  const [encodeSolana] = useEncodeSolana()
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })
  const [buildResult, setBuildResult] = useState<BuildRouteResult>()
  const [isBuildingRoute, setBuildingRoute] = useState(false)
  const { priceImpact } = routeSummary || {}

  // the callback to execute the swap
  const swapCallback = useSwapCallbackV3()
  const priceImpactResult = checkPriceImpact(priceImpact)
  const userHasSpecifiedInputOutput = Boolean(currencyIn && currencyOut && parsedAmount)
  const showLoading = isGettingRoute || isBuildingRoute || ((!balanceIn || !balanceOut) && userHasSpecifiedInputOutput)

  const handleClickSwapForNormalMode = async () => {
    if (!swapCallback || isBuildingRoute) {
      return
    }

    setProcessingSwap(true)
    // dismiss the modal will setProcessingSwap to false

    setBuildingRoute(true)
    setBuildResult(undefined)
    const result = await buildRoute()
    setBuildingRoute(false)
    setBuildResult(result)
  }

  const mixpanelSwapInit = () => {
    mixpanelHandler(MIXPANEL_TYPE.SWAP_INITIATED, {
      gasUsd: routeSummary?.gasUsd,
      inputAmount: routeSummary?.parsedAmountIn,
      priceImpact: routeSummary?.priceImpact,
    })
  }

  const handleClickSwapButton = () => {
    mixpanelSwapInit()

    setErrorWhileSwap('')

    handleClickSwapForNormalMode()
  }

  const swapCallbackForModal = useMemo(() => {
    if (buildResult?.data?.data && buildResult?.data?.routerAddress && swapCallback) {
      return () => {
        let outputAmountDescription = ''
        if (buildResult.data?.amountOut !== undefined && buildResult.data?.outputChange?.percent !== undefined) {
          const amountOut = buildResult.data?.amountOut
          const percent = buildResult.data?.outputChange?.percent
          if (percent === 0) {
            outputAmountDescription = 'Unchanged'
          } else if (percent > 0) {
            outputAmountDescription = 'New output amt is better than initial output amt'
          } else if (percent > -1) {
            outputAmountDescription = `New output amt is ${amountOut} to < 1% worse than initial output amt`
          } else if (percent >= -5) {
            outputAmountDescription = `New output amt is ${amountOut} to >= 1% to <= 5% worse than initial output amt`
          } else {
            outputAmountDescription = `New output amt is ${amountOut} to > 5% worse than initial output amt`
          }
        }

        let currentPrice = ''
        if (routeSummary !== undefined) {
          const { amountIn, amountOut } = buildResult.data
          const parsedAmountIn = toCurrencyAmount(routeSummary.parsedAmountIn.currency, amountIn)
          const parsedAmountOut = toCurrencyAmount(routeSummary.parsedAmountOut.currency, amountOut)
          const executionPrice = new Price(
            parsedAmountIn.currency,
            parsedAmountOut.currency,
            parsedAmountIn.quotient,
            parsedAmountOut.quotient,
          )
          const inputSymbol = executionPrice.baseCurrency?.symbol
          const outputSymbol = executionPrice.quoteCurrency?.symbol
          const formattedPrice = executionPrice?.toSignificant(6)
          currentPrice = `1 ${inputSymbol} = ${formattedPrice} ${outputSymbol}`
        }

        mixpanelHandler(MIXPANEL_TYPE.SWAP_CONFIRMED, {
          gasUsd: routeSummary?.gasUsd,
          inputAmount: routeSummary?.parsedAmountIn,
          priceImpact: routeSummary?.priceImpact,
          outputAmountDescription,
          currentPrice,
        })

        return swapCallback(buildResult.data.routerAddress, buildResult.data.data)
      }
    }

    return undefined
  }, [buildResult, swapCallback, routeSummary, mixpanelHandler])

  const onDismissModal = useCallback(() => {
    setProcessingSwap(false)
  }, [setProcessingSwap])

  const renderButton = () => {
    if (isProcessingSwap) {
      return (
        <CustomPrimaryButton disabled $minimal={minimal}>
          <Dots>
            <Trans>Processing</Trans>
          </Dots>
        </CustomPrimaryButton>
      )
    }

    if (isDegenMode && isSolana && !encodeSolana) {
      return (
        <CustomPrimaryButton disabled $minimal={minimal}>
          <Dots>
            <Trans>Checking accounts</Trans>
          </Dots>
        </CustomPrimaryButton>
      )
    }

    if (showLoading) {
      return (
        <CustomPrimaryButton disabled $minimal={minimal}>
          <Dots>
            <Trans>Calculating</Trans>
          </Dots>
        </CustomPrimaryButton>
      )
    }

    const shouldDisableByPriceImpact = !isDegenMode && (priceImpactResult.isVeryHigh || priceImpactResult.isInvalid)
    const shouldDisable = !routeSummary || !isApproved || shouldDisableByPriceImpact

    if ((priceImpactResult.isVeryHigh || priceImpactResult.isInvalid) && isDegenMode) {
      return (
        <CustomPrimaryButton
          onClick={handleClickSwapButton}
          disabled={shouldDisable}
          $minimal={minimal}
          style={shouldDisable ? undefined : { background: theme.red }}
        >
          <Trans>Swap Anyway</Trans>
        </CustomPrimaryButton>
      )
    }

    return (
      <CustomPrimaryButton
        disabled={shouldDisable}
        onClick={handleClickSwapButton}
        $minimal={minimal}
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        {shouldDisableByPriceImpact ? (
          <MouseoverTooltip
            text={
              <Trans>
                To ensure you dont lose funds due to very high price impact (≥10%), swap has been disabled for this
                trade. If you still wish to continue, you can turn on Degen Mode from Settings
              </Trans>
            }
          >
            <Info size={14} />
          </MouseoverTooltip>
        ) : !routeSummary ? (
          <MouseoverTooltip
            text={
              <Trans>
                There was an issue while trying to find a price for these tokens. Please try again. Otherwise, you may
                select some other tokens to swap
              </Trans>
            }
          >
            <Info size={14} />
          </MouseoverTooltip>
        ) : null}
        <Text>
          <Trans>{shouldDisable ? 'Swap Disabled' : 'Swap'}</Trans>
        </Text>
      </CustomPrimaryButton>
    )
  }

  return (
    <>
      {renderButton()}
      <SwapModal
        isOpen={isProcessingSwap}
        tokenAddToMetaMask={currencyOut}
        buildResult={buildResult}
        isBuildingRoute={isBuildingRoute}
        onDismiss={onDismissModal}
        swapCallback={swapCallbackForModal}
      />
    </>
  )
}

export default SwapOnlyButton
