import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, useExtractedTokenColor, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { AnimatedTokenFlip } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/AnimatedTokenFlip'
import { GradientContainer } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/GradientContainer'
import { useActualCompletionTime } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useActualCompletionTime'
import { useActualSwapOutput } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useActualSwapOutput'
import { useBackgroundColor } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useBackgroundColor'
import { useClearFlashblocksSwapNotifications } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useClearFlashblocksSwapNotifications'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { UnichainPoweredMessage } from 'uniswap/src/features/transactions/TransactionDetails/UnichainPoweredMessage'
import { isWebApp, isWebAppDesktop, isWebPlatform } from 'utilities/src/platform'

export function UnichainInstantBalanceModal(): JSX.Element | null {
  const { t } = useTranslation()

  const { outputCurrencyInfo, lastSwapOutputBalance } = useActualSwapOutput()

  // Get currency info from the swap dependencies store
  const inputCurrencyInfo = useSwapDependenciesStore((s) => s.derivedSwapInfo.currencies.input)

  const backgroundColor = useBackgroundColor()
  const {
    accent1: { val: accent1 },
  } = useSporeColors()
  const { tokenColor: toTokenColor } = useExtractedTokenColor({
    imageUrl: outputCurrencyInfo?.logoUrl,
    tokenName: outputCurrencyInfo?.currency.name,
    backgroundColor,
    // default to uni pink
    defaultColor: accent1,
  })

  const { setScreen, onClose, screen } = useTransactionModalContext()

  // Clear swap-related notifications when the instant balance screen is active
  useClearFlashblocksSwapNotifications(screen === TransactionScreen.UnichainInstantBalance)

  const confirmTimeSeconds = useActualCompletionTime()

  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const handleClose = useCallback(() => {
    updateSwapForm({
      exactAmountFiat: undefined,
      exactAmountToken: '',
      isSubmitting: false,
      showPendingUI: false,
      isConfirmed: false,
      instantOutputAmountRaw: undefined,
      instantReceiptFetchTime: undefined,
      txHash: undefined,
      txHashReceivedTime: undefined,
    })

    // Close the entire swap flow
    if (isWebPlatform) {
      setScreen(TransactionScreen.Form)
    }
    onClose()
  }, [onClose, updateSwapForm, setScreen])

  const isModalOpen = !!(
    inputCurrencyInfo &&
    outputCurrencyInfo &&
    lastSwapOutputBalance &&
    confirmTimeSeconds &&
    screen === TransactionScreen.UnichainInstantBalance
  )

  if (!inputCurrencyInfo || !outputCurrencyInfo) {
    return null
  }

  return (
    <Modal
      // currency null guard ensures this is only shown when a Unichain swap is completed
      hideHandlebar
      forceRoundedCorners
      renderBehindTopInset
      renderBehindBottomInset
      isModalOpen={isModalOpen}
      name={ModalName.UnichainInstantBalanceModal}
      alignment={isWebApp ? 'center' : 'top'}
      padding="$none"
      zIndex={zIndexes.popover}
      onClose={handleClose}
    >
      <GradientContainer toTokenColor={toTokenColor ?? backgroundColor}>
        <Flex alignItems="center" p="$padding8" pt="$padding12">
          {/* TOP-RIGHT CLOSE BUTTON */}
          {isWebPlatform && (
            <Flex
              alignItems="center"
              width="100%"
              height="$spacing32"
              flexDirection="row-reverse"
              px="$padding12"
              pt={isWebAppDesktop ? '$padding20' : '$none'}
            >
              <ModalCloseIcon onClose={handleClose} />
            </Flex>
          )}

          <Flex width="100%" p="$spacing24" content="center" alignItems="center">
            {/* TOKEN LOGO */}
            <AnimatedTokenFlip
              size={80}
              inputCurrencyInfo={inputCurrencyInfo}
              outputCurrencyInfo={outputCurrencyInfo}
            />

            {/* TEXT CONTENT */}
            <Flex
              gap="$gap8"
              alignItems="center"
              animation="200msDelayed200ms"
              enterStyle={{
                opacity: 0,
                y: 20,
              }}
            >
              <Text variant="subheading1" color="$neutral1">
                {t('swap.details.completed')}
              </Text>
              <Text variant={isWebAppDesktop ? 'heading2' : 'heading3'} color="$neutral1">
                {`${lastSwapOutputBalance} ${outputCurrencyInfo.currency.symbol}`}
              </Text>
              <UnichainPoweredMessage swappedInTime={confirmTimeSeconds} />
            </Flex>
          </Flex>

          {/* PRIMARY CLOSE BUTTON */}
          <Flex row width="100%" px={isWebPlatform ? '$none' : '$gap16'} mb={isWebPlatform ? '$none' : '$gap16'}>
            <Button emphasis="tertiary" size="large" borderColor="$surface3" onPress={handleClose}>
              {t('common.button.close')}
            </Button>
          </Flex>
        </Flex>
      </GradientContainer>
    </Modal>
  )
}
