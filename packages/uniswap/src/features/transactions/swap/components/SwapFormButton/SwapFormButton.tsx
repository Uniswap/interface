import { memo } from 'react'
import { Button, Flex, useIsShortMobileDevice } from 'ui/src'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import {
  useIsShowingWebFORNudge,
  useIsWebFORNudgeEnabled,
  useSetIsShowingWebFORNudge,
} from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useGeoRestrictionModalStore } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/useGeoRestrictionModalStore'
import { useIsBlockedByPermissionedPool } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockedByPermissionedPool'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'
import { useSwapFormButtonColors } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonColors'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonText'
import { SwapFormButtonTrace } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/SwapFormButtonTrace'
import { useSwapFormWarningStoreActions } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore'
import { useNeedsGeoAcknowledgment } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'

export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

// TODO(SWAP-573): Co-locate button action/color/text logic instead of separating the very-coupled UI state
export const SwapFormButton = memo(function SwapFormButton({ tokenColor }: { tokenColor?: string }): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const indicative = useIsTradeIndicative()
  const { handleOnReviewPress } = useOnReviewPress()
  const disabled = useIsSwapButtonDisabled()
  // Route the press to the in-app verify-identity sheet whenever the swap is blocked by a
  // permissioned-pool warning. Per Figma, all platforms (web Dialog, extension, mobile
  // BottomSheet) share this path so the user lands on the same registration flow.
  const shouldOpenVerifyIdentityModal = useIsBlockedByPermissionedPool()
  const buttonText = useSwapFormButtonText()
  const { swapRedirectCallback } = useTransactionModalContext()
  const { handleShowVerifyIdentityModal } = useSwapFormWarningStoreActions()
  const {
    backgroundColor: buttonBackgroundColor,
    variant: buttonVariant,
    emphasis: buttonEmphasis,
    buttonTextColor,
  } = useSwapFormButtonColors(tokenColor)
  const isShowingWebFORNudge = useIsShowingWebFORNudge()
  const setIsShowingWebFORNudge = useSetIsShowingWebFORNudge()
  const promptWebFORNudge = useIsWebFORNudgeEnabled() && !swapRedirectCallback && !isShowingWebFORNudge
  // Only show loading state if the trade is `indicative` and we're not on the landing page.
  // This is so that the `Get Started` button is always enabled/clickable.
  const shouldShowLoading = !!indicative && !swapRedirectCallback

  // preload cex transfer providers to avoid flickering when showing web for nudge
  useCexTransferProviders({ isDisabled: !promptWebFORNudge })

  const setIsShowingWebFORNudgeHandler: () => void = useEvent(() => {
    setIsShowingWebFORNudge(true)
  })

  const needsGeoAcknowledgment = useNeedsGeoAcknowledgment()
  const openGeoRestrictionModal = useGeoRestrictionModalStore((s) => s.open)

  // Priority: permissioned-pool verify-identity > geo acknowledgement > web FOR-nudge > standard review.
  const onPress = useEvent(() => {
    if (shouldOpenVerifyIdentityModal) {
      handleShowVerifyIdentityModal()
      return
    }
    if (needsGeoAcknowledgment) {
      openGeoRestrictionModal()
      return
    }
    if (promptWebFORNudge) {
      setIsShowingWebFORNudgeHandler()
      return
    }
    handleOnReviewPress()
  })

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <SwapFormButtonTrace>
        <Flex row alignSelf="stretch">
          <Button
            variant={buttonVariant}
            emphasis={buttonEmphasis}
            // TODO(WALL-7186): make loading state more representative of the trade state
            loading={shouldShowLoading}
            disabled={disabled}
            backgroundColor={buttonBackgroundColor}
            size={isShortMobileDevice ? 'medium' : 'large'}
            testID={TestID.ReviewSwap}
            animation="simple"
            onPress={onPress}
          >
            {buttonTextColor ? <Button.Text color={buttonTextColor}>{buttonText}</Button.Text> : buttonText}
          </Button>
        </Flex>
      </SwapFormButtonTrace>
    </Flex>
  )
})
