import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, DeprecatedButton, Flex, SpinningLoader, Text, isWeb, useIsShortMobileDevice } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { iconSizes } from 'ui/src/theme'
import { Warning, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SWAP_BUTTON_TEXT_VARIANT } from 'uniswap/src/features/transactions/swap/form/SwapFormButton'
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
  const size = isShortMobileDevice ? 'small' : 'large'

  switch (true) {
    case indicative: {
      return (
        <DeprecatedButton
          fill
          isDisabled
          backgroundColor="$surface2"
          pressStyle={{ scale: 0.98 }}
          icon={<SpinningLoader color="$neutral2" size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />}
          opacity={1} // For indicative loading UI, opacity should be full despite disabled state
          size={size}
        >
          <Text color="$neutral2" flex={1} textAlign="center" variant={SWAP_BUTTON_TEXT_VARIANT}>
            {t('swap.finalizingQuote')}
          </Text>
        </DeprecatedButton>
      )
    }
    case showUniswapXSubmittingUI: {
      return (
        <DeprecatedButton
          fill
          isDisabled
          backgroundColor="$accent2"
          color="$accent1"
          pressStyle={{ scale: 0.98 }}
          hoverStyle={{ opacity: 1 }}
          icon={<SpinningLoader color="$accent1" size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />}
          opacity={1} // For UniswapX submitting UI, opacity should be full despite disabled state
          size={size}
        >
          <UniswapXSubmittingText />
        </DeprecatedButton>
      )
    }
    case isInterface && isSubmitting: {
      return (
        <DeprecatedButton
          fill
          isDisabled
          backgroundColor="$surface2"
          color="$neutral2"
          pressStyle={{ scale: 0.98 }}
          hoverStyle={{ opacity: 1 }}
          icon={<SpinningLoader color="$neutral2" size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />}
          opacity={1} // For UniswapX submitting UI, opacity should be full despite disabled state
          size={size}
        >
          <ConfirmInWalletText />
        </DeprecatedButton>
      )
    }
    case warning?.severity === WarningSeverity.High: {
      return (
        <DeprecatedButton
          fill
          backgroundColor="$statusCritical"
          color="$accent1"
          isDisabled={disabled}
          pressStyle={{ scale: 0.98 }}
          hoverStyle={{ opacity: 1, backgroundColor: '$statusCritical' }}
          opacity={disabled ? 0.5 : 0.9}
          icon={renderBiometricsIcon?.({ color: 'white' })}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmit}
        >
          <Text color="$white" variant={SWAP_BUTTON_TEXT_VARIANT}>
            {actionText}
          </Text>
        </DeprecatedButton>
      )
    }
    default: {
      const backgroundColor = disabled ? '$surface2' : '$accent1'
      const textColor = disabled ? '$neutral2' : '$white'
      const biometricIcon = renderBiometricsIcon?.({ color: disabled ? '$neutral2' : '$white' })

      return (
        <DeprecatedButton
          fill
          backgroundColor={backgroundColor}
          isDisabled={disabled}
          pressStyle={{ scale: 0.98 }}
          hoverStyle={{ opacity: 1 }}
          opacity={0.9}
          icon={biometricIcon}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmit}
        >
          <Text color={textColor} variant={SWAP_BUTTON_TEXT_VARIANT}>
            {actionText}
          </Text>
        </DeprecatedButton>
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
        <Text color="$accent1" flex={1} textAlign="center" variant={SWAP_BUTTON_TEXT_VARIANT}>
          {showKeepOpenMessage ? t('swap.button.submitting.keep.open') : t('swap.button.submitting')}
        </Text>
      </Flex>
    </AnimatePresence>
  )
}

function ConfirmInWalletText(): JSX.Element {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Text color="$neutral2" flex={1} textAlign="center" variant={SWAP_BUTTON_TEXT_VARIANT}>
          {t('common.confirmWallet')}
        </Text>
      </Flex>
    </AnimatePresence>
  )
}
