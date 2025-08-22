import noop from 'lodash/noop'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useSporeColors } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import {
  FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT,
  NON_FLASHBLOCKS_INSTANT_BALANCE_BUTTON_DURATION,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { useInstantReceiptOutput } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useInstantReceiptOutput'
import { shouldShowFlashblocksUI } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/utils'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export function FlashblocksConfirmButton({ size }: { size: 'medium' | 'large' }): JSX.Element {
  const { t } = useTranslation()
  const { setScreen, screen, onClose } = useTransactionModalContext()
  const colors = useSporeColors()

  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const isConfirmed = useSwapFormStore((s) => s.isConfirmed)
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)

  const tradeRoute = useSwapDependenciesStore((s) => s.derivedSwapInfo.trade.trade?.routing)
  const isFlashblocksModalRoute = shouldShowFlashblocksUI(tradeRoute)

  // Trigger parsing of flashblock receipt and navigation
  useInstantReceiptOutput()
  useEffect(() => {
    if (!isConfirmed || !isFlashblocksEnabled) {
      return noop
    }

    // short circuit logic since we're in the instant balance screen
    if (screen === TransactionScreen.UnichainInstantBalance) {
      return noop
    }

    // if we're still on this screen after FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT, revert to existing behavior (ie return to form screen)
    const timeout = setTimeout(
      () => {
        setScreen(TransactionScreen.Form)
        updateSwapForm({
          exactAmountFiat: undefined,
          exactAmountToken: '',
          isSubmitting: false,
          showPendingUI: false,
          instantReceiptFetchTime: undefined,
          instantOutputAmountRaw: undefined,
          txHash: undefined,
          txHashReceivedTime: undefined,
        })

        // remove isConfirmed after 1 second to allow the user to see the success state before clearing
        setTimeout(() => {
          updateSwapForm({
            isConfirmed: false,
          })
        }, 1000)
        onClose()
      },
      // use a shorter timeout when we don't need to show the modal
      isFlashblocksModalRoute ? FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT : NON_FLASHBLOCKS_INSTANT_BALANCE_BUTTON_DURATION,
    )

    return () => clearTimeout(timeout)
  }, [isConfirmed, isFlashblocksEnabled, screen, setScreen, updateSwapForm, isFlashblocksModalRoute, onClose])

  return (
    <Button
      isDisabled
      backgroundColor="$statusSuccess2"
      variant="branded"
      emphasis="primary"
      size={size}
      hoverStyle={{ backgroundColor: '$statusSuccess2', filter: 'none' }}
      pressStyle={{ backgroundColor: '$statusSuccess2', filter: 'none' }}
      animation="200ms"
    >
      <Flex row alignItems="center" enterStyle={{ y: 10, opacity: 0 }} animation="200msDelayed160ms">
        <Check
          strokeWidth={4}
          size="$icon.24"
          color={colors.statusSuccess.val}
          position="absolute" // Manually position the icon so its height doesn't affect the button height
          top="50%"
          transform={[{ translateY: -12 }]} // Half of icon size ($icon.24 = 24px)
        />
        <Text variant="buttonLabel1" color="$statusSuccess" ml="$gap32">
          {t('common.confirmed')}
        </Text>
      </Flex>
    </Button>
  )
}
