/* eslint-disable complexity */
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Button, Flex, SpinningLoader, Text, isWeb, useIsShortMobileDevice } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SwapScreen, useSwapScreenContext } from 'uniswap/src/features/transactions/swap/contexts/SwapScreenContext'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedTransactionWarnings'
import { ViewOnlyModal } from 'wallet/src/features/transactions/swap/modals/ViewOnlyModal'
import { isWrapAction } from 'wallet/src/features/transactions/swap/utils'
import { createTransactionId } from 'wallet/src/features/transactions/utils'

const KEEP_OPEN_MSG_DELAY = 3 * ONE_SECOND_MS
export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

export function SwapFormButton(): JSX.Element {
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const activeAccount = useAccountMeta()
  const { walletNeedsRestore } = useTransactionModalContext()
  const { setScreen } = useSwapScreenContext()
  const { derivedSwapInfo, isSubmitting, updateSwapForm } = useSwapFormContext()
  const { blockingWarning } = useParsedSwapWarnings()

  const [showViewOnlyModal, setShowViewOnlyModal] = useState(false)

  const { wrapType, trade } = derivedSwapInfo

  const { isBlocked, isBlockedLoading } = useIsBlocked(activeAccount?.address)

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade

  const reviewButtonDisabled =
    noValidSwap || !!blockingWarning || isBlocked || isBlockedLoading || walletNeedsRestore || isSubmitting

  const isViewOnlyWallet = activeAccount?.type === AccountType.Readonly

  const onReview = useCallback(
    (nextScreen: SwapScreen) => {
      updateSwapForm({ txId: createTransactionId() })
      setScreen(nextScreen)
    },
    [setScreen, updateSwapForm],
  )

  const onReviewPress = useCallback(() => {
    if (isViewOnlyWallet) {
      setShowViewOnlyModal(true)
    } else {
      onReview(SwapScreen.SwapReview)
    }
  }, [onReview, isViewOnlyWallet])

  const hasButtonWarning = !!blockingWarning?.buttonText
  const buttonText = blockingWarning?.buttonText ?? t('swap.button.review')
  const buttonTextColor = hasButtonWarning ? '$neutral2' : '$white'
  const buttonBgColor = hasButtonWarning ? '$surface3' : isSubmitting ? '$accent2' : '$accent1'
  const buttonOpacity = isViewOnlyWallet ? 0.4 : isSubmitting ? 1 : undefined

  const showUniswapXSubmittingUI = trade.trade && isUniswapX(trade?.trade) && isSubmitting

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <Trace logPress element={ElementName.SwapReview}>
        <Button
          hapticFeedback
          backgroundColor={buttonBgColor}
          disabled={reviewButtonDisabled && !isViewOnlyWallet}
          icon={showUniswapXSubmittingUI ? <SpinningLoader color="$accent1" size={iconSizes.icon24} /> : undefined}
          // Override opacity only for view-only wallets
          opacity={buttonOpacity}
          size={isShortMobileDevice ? 'small' : isWeb ? 'medium' : 'large'}
          testID={TestID.ReviewSwap}
          width="100%"
          onPress={onReviewPress}
        >
          {showUniswapXSubmittingUI ? (
            <SubmittingText />
          ) : (
            <Text color={buttonTextColor} variant={SWAP_BUTTON_TEXT_VARIANT}>
              {buttonText}
            </Text>
          )}
        </Button>
      </Trace>

      <ViewOnlyModal isOpen={showViewOnlyModal} onDismiss={(): void => setShowViewOnlyModal(false)} />
    </Flex>
  )
}

export function SubmittingText(): JSX.Element {
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
