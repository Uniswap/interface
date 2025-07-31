import noop from 'lodash/noop'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useUpdateOnChainBalancePreconfirmation } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useUpdateOnChainBalancePreconfirmation'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const INSTANT_BALANCE_TIMEOUT = 2 * ONE_SECOND_MS

export function FlashblocksConfirmButton(): JSX.Element {
  const { t } = useTranslation()
  const { setScreen, screen } = useTransactionModalContext()
  const colors = useSporeColors()

  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const isConfirmed = useSwapFormStore((s) => s.isConfirmed)
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(chainId)

  const isShortMobileDevice = useIsShortMobileDevice()
  const size = isShortMobileDevice ? 'medium' : 'large'

  // Check if this is a bridge transaction - don't show modal for bridges
  const isBridgeTransaction = useSwapDependenciesStore(
    (s) => s.derivedSwapInfo.trade.trade && isBridge(s.derivedSwapInfo.trade.trade),
  )

  // handles navigation
  useUpdateOnChainBalancePreconfirmation()
  useEffect(() => {
    if (!isConfirmed || !isFlashblocksEnabled) {
      return noop
    }

    // short circuit logic since we're in the instant balance screen
    if (screen === TransactionScreen.UnichainInstantBalance) {
      return noop
    }

    // if we're still on this screen after INSTANT_BALANCE_TIMEOUT, revert to existing behavior (ie return to form screen)
    const timeout = setTimeout(
      () => {
        setScreen(TransactionScreen.Form)
        updateSwapForm({
          exactAmountFiat: undefined,
          exactAmountToken: '',
          isSubmitting: false,
          showPendingUI: false,
          isConfirmed: false,
          preSwapDataPreserved: undefined,
          preSwapNativeAssetAmountRaw: undefined,
          postSwapDataPreserved: undefined,
        })
      },
      isBridgeTransaction ? 0 : INSTANT_BALANCE_TIMEOUT,
    )

    return () => clearTimeout(timeout)
  }, [isConfirmed, isFlashblocksEnabled, screen, setScreen, updateSwapForm, isBridgeTransaction])
  return (
    <Button
      isDisabled
      backgroundColor="$statusSuccess2"
      variant="branded"
      emphasis="primary"
      size={size}
      hoverStyle={{ backgroundColor: '$statusSuccess2', filter: 'none' }}
      pressStyle={{ backgroundColor: '$statusSuccess2', filter: 'none' }}
      animation="200msDelayed160ms"
    >
      <Flex row gap="$gap8" alignItems="center" enterStyle={{ y: 10, opacity: 0 }} animation="200msDelayed160ms">
        <Check strokeWidth={4} size="$icon.24" color={colors.statusSuccess.val} />
        <Text variant="buttonLabel1" color="$statusSuccess">
          {t('common.confirmed')}
        </Text>
      </Flex>
    </Button>
  )
}
