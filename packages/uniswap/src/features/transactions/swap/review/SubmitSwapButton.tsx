import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, useIsShortMobileDevice } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { Warning, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isInterface } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const KEEP_OPEN_MSG_DELAY = 3 * ONE_SECOND_MS

interface SubmitSwapButtonProps {
  disabled: boolean
  onSubmit: () => void
  showUniswapXSubmittingUI: boolean
  warning?: Warning
}

export function SubmitSwapButton({
  disabled,
  onSubmit,
  showUniswapXSubmittingUI,
  warning,
}: SubmitSwapButtonProps): JSX.Element {
  const { t } = useTranslation()
  const { renderBiometricsIcon } = useTransactionModalContext()

  const { isSubmitting, derivedSwapInfo } = useSwapFormContext()
  const {
    wrapType,
    trade: { trade, indicativeTrade },
  } = derivedSwapInfo
  const indicative = Boolean(!trade && indicativeTrade)

  const swapTxContext = useSwapTxContext()
  const actionText = getActionName(t, wrapType, swapTxContext)

  const isShortMobileDevice = useIsShortMobileDevice()
  const size = isShortMobileDevice ? 'medium' : 'large'

  switch (true) {
    case indicative: {
      return (
        <Button loading variant="default" emphasis="secondary" size={size}>
          {t('swap.finalizingQuote')}
        </Button>
      )
    }
    case showUniswapXSubmittingUI: {
      return (
        <Button loading variant="branded" emphasis="primary" size={size}>
          <UniswapXSubmittingText />
        </Button>
      )
    }
    case isInterface && isSubmitting: {
      return (
        <Button loading shouldAnimateBetweenLoadingStates={false} size={size}>
          <ConfirmInWalletText />
        </Button>
      )
    }
    case warning?.severity === WarningSeverity.High: {
      return (
        <Button
          variant="critical"
          emphasis="primary"
          isDisabled={disabled}
          icon={renderBiometricsIcon?.({})}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmit}
        >
          {actionText}
        </Button>
      )
    }
    default: {
      const biometricIcon = renderBiometricsIcon?.({})

      return (
        <Button
          variant={disabled ? 'default' : 'branded'}
          emphasis={disabled ? 'secondary' : 'primary'}
          isDisabled={disabled}
          icon={biometricIcon}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmit}
        >
          {actionText}
        </Button>
      )
    }
  }
}

export const getActionName = (
  t: AppTFunction,
  wrapType: WrapType,
  swapTxContext?: SwapTxAndGasInfo,
  warning?: Warning,
): string => {
  switch (true) {
    case wrapType === WrapType.Wrap:
      return t('swap.button.wrap')
    case wrapType === WrapType.Unwrap:
      return t('swap.button.unwrap')
    case isInterface && Boolean(swapTxContext?.approveTxRequest):
      return t('swap.approveAndSwap')
    case isInterface && swapTxContext && isClassic(swapTxContext) && swapTxContext.unsigned:
      return t('swap.signAndSwap')
    case warning?.severity === WarningSeverity.High:
      return t('swap.button.swapAnyways')
    default:
      return t('swap.button.swap')
  }
}

function UniswapXSubmittingText(): JSX.Element {
  const { t } = useTranslation()
  const [showKeepOpenMessage, setShowKeepOpenMessage] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowKeepOpenMessage(true), KEEP_OPEN_MSG_DELAY)
    return () => clearTimeout(timeout)
  }, [])

  // Use different key to re-trigger animation when message changes
  const key = showKeepOpenMessage ? 'submitting-text-msg1' : 'submitting-text-msg2'

  return (
    <AnimatePresence key={key}>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Button.Text>
          {showKeepOpenMessage ? t('swap.button.submitting.keep.open') : t('swap.button.submitting')}
        </Button.Text>
      </Flex>
    </AnimatePresence>
  )
}

function ConfirmInWalletText(): JSX.Element {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Button.Text>{t('common.confirmWallet')}</Button.Text>
      </Flex>
    </AnimatePresence>
  )
}
