/* eslint-disable complexity */
import { TFunction } from 'i18next'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Icons, Text, isWeb } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import {
  selectHasSubmittedHoldToSwap,
  selectHasViewedReviewScreen,
} from 'wallet/src/features/behaviorHistory/selectors'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'wallet/src/features/transactions/contexts/SwapScreenContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedSwapWarnings'
import {
  HoldToSwapProgressCircle,
  PROGRESS_CIRCLE_SIZE,
} from 'wallet/src/features/transactions/swap/HoldToSwapProgressCircle'
import { isWrapAction } from 'wallet/src/features/transactions/swap/utils'
import { WrapType } from 'wallet/src/features/transactions/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppSelector } from 'wallet/src/state'
import { ElementName } from 'wallet/src/telemetry/constants'

export const HOLD_TO_SWAP_TIMEOUT = 3000

export function SwapFormButton(): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()

  const { walletNeedsRestore } = useTransactionModalContext()
  const { screen, setScreen } = useSwapScreenContext()
  const { derivedSwapInfo, isSubmitting, updateSwapForm } = useSwapFormContext()
  const { blockingWarning } = useParsedSwapWarnings()

  const { wrapType, trade } = derivedSwapInfo

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade

  const isSwapDataLoading = !isWrapAction(wrapType) && trade.loading

  const reviewButtonDisabled =
    isSwapDataLoading ||
    noValidSwap ||
    !!blockingWarning ||
    isBlocked ||
    isBlockedLoading ||
    walletNeedsRestore

  const isHoldToSwapPressed = screen === SwapScreen.SwapReviewHoldingToSwap || isSubmitting

  const hasViewedReviewScreen = useAppSelector(selectHasViewedReviewScreen)
  const hasSubmittedHoldToSwap = useAppSelector(selectHasSubmittedHoldToSwap)
  const showHoldToSwapTip =
    hasViewedReviewScreen && !hasSubmittedHoldToSwap && activeAccount.type !== AccountType.Readonly

  // Force users to view regular review screen before enabling hold to swap
  // Disable for view only because onSwap action will fail
  const enableHoldToSwap =
    !isWeb && hasViewedReviewScreen && activeAccount.type !== AccountType.Readonly

  const onReview = useCallback(
    (nextScreen: SwapScreen) => {
      updateSwapForm({ txId: createTransactionId() })
      setScreen(nextScreen)
    },
    [setScreen, updateSwapForm]
  )

  const onPress = useCallback(() => {
    onReview(SwapScreen.SwapReview)
  }, [onReview])

  const onLongPressHoldToSwap = useCallback(() => {
    if (enableHoldToSwap) {
      onReview(SwapScreen.SwapReviewHoldingToSwap)
    }
  }, [enableHoldToSwap, onReview])

  const onReleaseHoldToSwap = useCallback(() => {
    if (isHoldToSwapPressed && !isSubmitting) {
      setScreen(SwapScreen.SwapForm)
    }
  }, [isHoldToSwapPressed, isSubmitting, setScreen])

  const holdButtonText = useMemo(() => getHoldButtonActionText(wrapType, t), [t, wrapType])

  const hasButtonWarning = !!blockingWarning?.buttonText
  const buttonText = blockingWarning?.buttonText ?? t('common.button.review')
  const buttonTextColor = hasButtonWarning ? '$neutral2' : '$white'
  const buttonBgColor = hasButtonWarning
    ? '$surface3'
    : isHoldToSwapPressed
    ? '$accent2'
    : '$accent1'

  return (
    <Flex alignItems="center" gap="$spacing16">
      {!isWeb && !isHoldToSwapPressed && showHoldToSwapTip && <HoldToInstantSwapRow />}

      <Trace logPress element={ElementName.SwapReview}>
        <Button
          hapticFeedback
          backgroundColor={buttonBgColor}
          disabled={reviewButtonDisabled && !isHoldToSwapPressed}
          size="large"
          testID={ElementName.ReviewSwap}
          width="100%"
          onLongPress={onLongPressHoldToSwap}
          onPress={onPress}
          onResponderRelease={onReleaseHoldToSwap}
          onResponderTerminate={onReleaseHoldToSwap}>
          {isHoldToSwapPressed ? (
            <Flex row gap="$spacing4" px="$spacing4">
              <HoldToSwapProgressCircle />

              <Text
                color="$accent1"
                flex={1}
                pr={PROGRESS_CIRCLE_SIZE}
                textAlign="center"
                variant="buttonLabel1">
                {holdButtonText}
              </Text>
            </Flex>
          ) : (
            <Text color={buttonTextColor} variant="buttonLabel1">
              {buttonText}
            </Text>
          )}
        </Button>
      </Trace>
    </Flex>
  )
}

function HoldToInstantSwapRow(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered row gap="$spacing4">
      <Icons.GraduationCap color="$neutral3" size="$icon.16" />
      <Text color="$neutral3" variant="body3">
        {t('swap.hold.tip')}
      </Text>
    </Flex>
  )
}

function getHoldButtonActionText(wrapType: WrapType, t: TFunction): string {
  switch (wrapType) {
    case WrapType.Wrap:
      return t('swap.hold.wrap')
    case WrapType.Unwrap:
      return t('swap.hold.unwrap')
    case WrapType.NotApplicable:
      return t('swap.hold.swap')
  }
}
