import { TradingApi } from '@universe/api'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, styled, useIsShortMobileDevice } from 'ui/src'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { TransactionScreen, useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapConfirmationModal } from 'uniswap/src/features/transactions/swap/components/SwapConfirmationModal/SwapConfirmationModal'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'
import { useSwapFormButtonColors } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonColors'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonText'
import { SwapFormButtonTrace } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/SwapFormButtonTrace'
import { useSwapFormStoreDerivedSwapInfo, useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { usePrepareSwap } from 'uniswap/src/features/transactions/swap/services/hooks/usePrepareSwap'
import { useWarningService } from 'uniswap/src/features/transactions/swap/services/hooks/useWarningService'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import {
  ensureFreshSwapTxData,
  useSwapParams,
  useSwapTxAndGasInfoService,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/hooks'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { shouldShowFlashblocksUI } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { tryCatch } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { isWebApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

const WhiteButtonText = styled(Button.Text, {
  color: '#FFFFFF',
  '$group-item-hover': {
    color: '#FFFFFF',
  },
})

const GradientWrapper = styled(Flex, {
  borderRadius: 12,
  height: 60,
  py: 16,
  px: 0,
  '$platform-web': {
    background: 'linear-gradient(90.87deg, #2362DD -1.27%, #2C7FDD 47.58%, #AD81F1 99.78%)',
    boxShadow: '0px 0px 20px -5px rgba(35, 98, 221, 0.5)',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  hoverStyle: {
    opacity: 0.9,
  },
  pressStyle: {
    opacity: 0.8,
  },
})

// Global function to connect wallet - can be set by platform-specific code
// Type declaration for the global connect wallet function
declare global {
  // eslint-disable-next-line no-var
  var __uniswapConnectWallet: (() => void) | undefined
}

const getConnectWalletFunction = (): (() => void) | undefined => {
  // Check if we're on web platform and if a connect function is available
  if (typeof window !== 'undefined' && typeof window.__uniswapConnectWallet === 'function') {
    return window.__uniswapConnectWallet
  }
  return undefined
}

// TODO(SWAP-573): Co-locate button action/color/text logic instead of separating the very-coupled UI state
export function SwapFormButton({ tokenColor }: { tokenColor?: string }): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const indicative = useIsTradeIndicative()
  const { handleOnReviewPress } = useOnReviewPress()
  const disabled = useIsSwapButtonDisabled()
  const buttonText = useSwapFormButtonText()
  const { swapRedirectCallback, setScreen } = useTransactionModalContext()
  const {
    backgroundColor: buttonBackgroundColor,
    variant: buttonVariant,
    emphasis: buttonEmphasis,
    buttonTextColor,
  } = useSwapFormButtonColors(tokenColor)
  // Only show loading state if the trade is `indicative` and we're not on the landing page.
  // This is so that the `Get Started` button is always enabled/clickable.
  const shouldShowLoading = !!indicative && !swapRedirectCallback

  const [isSwapConfirmationModalOpen, setIsSwapConfirmationModalOpen] = useState(false)
  const derivedSwapInfo = useSwapFormStoreDerivedSwapInfo((s) => s)
  const isWebFORNudgeEnabled = useIsWebFORNudgeEnabled()
  const { t } = useTranslation()
  const swapTokensText = t('empty.swap.button.text')

  // Check connection status
  const { isDisconnected } = useConnectionStatus()
  const { chainId } = useSwapFormStoreDerivedSwapInfo((s) => ({
    chainId: s.chainId,
  }))
  const isMissingPlatformWallet = useIsMissingPlatformWallet(chainId)
  const connectWallet = getConnectWalletFunction()

  const handleButtonPress = useEvent(() => {
    // If wallet is disconnected or missing, try to connect
    if ((isDisconnected || isMissingPlatformWallet) && connectWallet) {
      connectWallet()
      return
    }

    // Show confirmation modal when button text is "Swap Tokens" (either from WebFORNudge or other conditions)
    // Check both the flag and the actual button text to be safe
    const shouldShowModal = (isWebFORNudgeEnabled || buttonText === swapTokensText) && !swapRedirectCallback

    if (shouldShowModal) {
      setIsSwapConfirmationModalOpen(true)
    } else {
      handleOnReviewPress()
    }
  })

  // Get dependencies for swap execution
  const getExecuteSwapService = useSwapDependenciesStore((s) => s.getExecuteSwapService)
  const swapTxAndGasInfoService = useSwapTxAndGasInfoService()
  const swapParams = useSwapParams()
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(derivedSwapInfo.chainId)
  const shouldShowConfirmedState =
    (isFlashblocksEnabled && shouldShowFlashblocksUI(derivedSwapInfo.trade.trade?.routing)) ||
    // show the confirmed state for bridges
    derivedSwapInfo.trade.trade?.routing === TradingApi.Routing.BRIDGE

  // Create callbacks for swap execution
  const onSuccess = useCallback(() => {
    // For Unichain networks, trigger confirmation and branch to stall+fetch logic (ie handle in component)
    if (isFlashblocksEnabled && shouldShowConfirmedState) {
      updateSwapForm({
        isConfirmed: true,
        isSubmitting: false,
        showPendingUI: false,
      })
      return
    }

    // On interface, the swap component stays mounted; after swap we reset the form to avoid showing the previous values.
    if (isWebApp) {
      updateSwapForm({
        exactAmountFiat: undefined,
        exactAmountToken: '',
        showPendingUI: false,
        isConfirmed: false,
        instantReceiptFetchTime: undefined,
        instantOutputAmountRaw: undefined,
        txHash: undefined,
        txHashReceivedTime: undefined,
      })
      setScreen(TransactionScreen.Form)
    }
  }, [setScreen, updateSwapForm, isFlashblocksEnabled, shouldShowConfirmedState, derivedSwapInfo])

  const onFailure = useCallback(
    (error?: Error) => {
      updateSwapForm({ isSubmitting: false, isConfirmed: false, showPendingUI: false })
    },
    [updateSwapForm],
  )

  const onPending = useCallback(() => {
    // Skip pending UI only for Unichain networks with flashblocks-compatible routes
    if (isFlashblocksEnabled && shouldShowConfirmedState) {
      return
    }
    updateSwapForm({ showPendingUI: true })
  }, [updateSwapForm, isFlashblocksEnabled, shouldShowConfirmedState])

  // Direct swap execution function
  const executeSwapDirectly = useEvent(async () => {
    try {
      if (!swapParams.trade) {
        const error = new Error('No `trade` found when calling `executeSwap`')
        onFailure(error)
        return
      }

      // Ensure we have fresh transaction data before executing the swap
      const { data: freshSwapTxData, error } = await tryCatch(
        ensureFreshSwapTxData(
          {
            trade: swapParams.trade,
            approvalTxInfo: swapParams.approvalTxInfo,
            derivedSwapInfo: swapParams.derivedSwapInfo,
          },
          swapTxAndGasInfoService,
        ),
      )

      if (error) {
        const wrappedError = new Error('Failed to ensure fresh transaction data when calling `executeSwap`', {
          cause: error,
        })

        logger.error(wrappedError, {
          tags: { file: 'SwapFormButton', function: 'executeSwapDirectly' },
        })

        onFailure(wrappedError)
        return
      }

      if (!freshSwapTxData) {
        const error = new Error('Empty swap transaction data returned')
        onFailure(error)
        return
      }

      if (!isValidSwapTxContext(freshSwapTxData)) {
        const error = new Error('Invalid swap transaction context')
        onFailure(error)
        return
      }

      const executeSwapService = getExecuteSwapService({
        onSuccess,
        onFailure,
        onPending,
        setCurrentStep: () => {},
        setSteps: () => {},
        getSwapTxContext: () => freshSwapTxData,
      })

      executeSwapService.executeSwap()
    } catch (error) {
      const swapError = error instanceof Error ? error : new Error(String(error))
      logger.error(swapError, {
        tags: { file: 'SwapFormButton', function: 'executeSwapDirectly' },
        extra: { stack: swapError.stack },
      })
      onFailure(swapError)
    }
  })

  // Create a prepareSwap that executes swap directly instead of showing review screen
  const warningService = useWarningService()
  const prepareSwapDirectly = usePrepareSwap({
    warningService,
    onExecuteSwapDirectly: () => {
      // Execute swap directly without showing review screen
      executeSwapDirectly()
    },
  })

  const handleConfirmSwap = useEvent(() => {
    setIsSwapConfirmationModalOpen(false)
    // Use prepareSwapDirectly which will execute swap directly if no warnings
    // If there are warnings, they will be shown, otherwise swap will execute
    prepareSwapDirectly()
  })

  const handleCloseModal = useEvent(() => {
    setIsSwapConfirmationModalOpen(false)
  })

  return (
    <>
      <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
        <SwapFormButtonTrace>
          <Flex row alignSelf="stretch">
            <GradientWrapper width="100%">
              <Button
                variant={buttonVariant}
                isDisabled={disabled}
                backgroundColor="transparent"
                size={isShortMobileDevice ? 'small' : 'large'}
                testID={TestID.ReviewSwap}
                width="100%"
                borderRadius={12}
                hoverStyle={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                }}
                pressStyle={{
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                }}
                onPress={handleButtonPress}
                emphasis={buttonEmphasis}
                // TODO(WALL-7186): make loading state more representative of the trade state
                loading={shouldShowLoading}
              >
                <WhiteButtonText>{buttonText}</WhiteButtonText>
              </Button>
            </GradientWrapper>
          </Flex>
        </SwapFormButtonTrace>
      </Flex>
      <SwapConfirmationModal
        isOpen={isSwapConfirmationModalOpen}
        derivedSwapInfo={derivedSwapInfo}
        onClose={handleCloseModal}
        onConfirm={handleConfirmSwap}
      />
    </>
  )
}
