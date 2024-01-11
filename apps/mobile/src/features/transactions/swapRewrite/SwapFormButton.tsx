import React, { useCallback, useMemo } from 'react'
import { TFunction, useTranslation } from 'react-i18next'
import { useAppSelector as useMobileAppSelector } from 'src/app/hooks'
import Trace from 'src/components/Trace/Trace'
import {
  selectHasSubmittedHoldToSwap,
  selectHasViewedReviewScreen,
} from 'src/features/behaviorHistory/selectors'
import { ElementName } from 'src/features/telemetry/constants'
import { isWrapAction } from 'src/features/transactions/swap/utils'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import {
  HoldToSwapProgressCircle,
  PROGRESS_CIRCLE_SIZE,
} from 'src/features/transactions/swapRewrite/HoldToSwapProgressCircle'
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { Button, Flex, Icons, Text } from 'ui/src'
import { WrapType } from 'wallet/src/features/transactions/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export const HOLD_TO_SWAP_TIMEOUT = 3000

export function SwapFormButton(): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()

  const { screen, setScreen } = useSwapScreenContext()
  const { derivedSwapInfo, isSubmitting, updateSwapForm } = useSwapFormContext()
  const { blockingWarning } = useParsedSwapWarnings()

  const { wrapType, trade } = derivedSwapInfo

  const { walletNeedsRestore } = useWalletRestore()
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

  const hasViewedReviewScreen = useMobileAppSelector(selectHasViewedReviewScreen)
  const hasSubmittedHoldToSwap = useMobileAppSelector(selectHasSubmittedHoldToSwap)
  const showHoldToSwapTip =
    hasViewedReviewScreen && !hasSubmittedHoldToSwap && activeAccount.type !== AccountType.Readonly

  // Force users to view regular review screen before enabling hold to swap
  // Disable for view only because onSwap action will fail
  const enableHoldToSwap = hasViewedReviewScreen && activeAccount.type !== AccountType.Readonly

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

  return (
    <Flex alignItems="center" gap="$spacing16">
      {!isHoldToSwapPressed && showHoldToSwapTip && <HoldToInstantSwapRow />}

      <Trace logPress element={ElementName.SwapReview}>
        <Button
          hapticFeedback
          backgroundColor={isHoldToSwapPressed ? '$accent2' : '$accent1'}
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
            <Text color="$white" variant="buttonLabel1">
              {t('Review')}
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
        {t('Tip: Hold to instant swap')}
      </Text>
    </Flex>
  )
}

function getHoldButtonActionText(
  wrapType: WrapType,
  t: TFunction<'translation', undefined>
): string {
  switch (wrapType) {
    case WrapType.Wrap:
      return t('Hold to wrap')
    case WrapType.Unwrap:
      return t('Hold to unwrap')
    case WrapType.NotApplicable:
      return t('Hold to swap')
  }
}
