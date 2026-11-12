import { Button, Flex, useIsShortMobileDevice } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { useCexTransferProviders } from 'uniswap/src/features/fiatOnRamp/useCexTransferProviders'
import {
  useSetIsShowingWebFORNudge,
  useWebFORNudgeAddFundsPress,
} from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useGeoRestrictionModalStore } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/useGeoRestrictionModalStore'
import { getSwapFormButtonAction } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/getSwapFormButtonAction'
import { useIsBlockedByPermissionedPool } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockedByPermissionedPool'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'
import { usePromptWebFORNudge } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/usePromptWebFORNudge'
import { useScreenActiveAddressOnPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useScreenActiveAddressOnPress'
import { useSwapFormButtonColors } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonColors'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonText'
import { SwapFormButtonTrace } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/SwapFormButtonTrace'
import { useSwapFormWarningStoreActions } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore'
import { useNeedsGeoAcknowledgment } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment'
import { useReviewGateContext } from 'uniswap/src/features/transactions/swap/services/hooks/usePrepareSwap'
import { getReviewGateActionType } from 'uniswap/src/features/transactions/swap/services/prepareSwapService'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { SwapFormButtonAction } from 'uniswap/src/features/transactions/swap/types/swapFormButtonAction'
import { CurrencyField } from 'uniswap/src/types/currency'
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
  const screenActiveAddress = useScreenActiveAddressOnPress()
  const {
    backgroundColor: buttonBackgroundColor,
    variant: buttonVariant,
    emphasis: buttonEmphasis,
    buttonTextColor,
  } = useSwapFormButtonColors(tokenColor)
  const setIsShowingWebFORNudge = useSetIsShowingWebFORNudge()
  const onAddFundsPress = useWebFORNudgeAddFundsPress()
  const promptWebFORNudge = usePromptWebFORNudge()
  // Only show loading state if the trade is `indicative` and we're not on the landing page.
  // This is so that the `Get Started` button is always enabled/clickable.
  const shouldShowLoading = !!indicative && !swapRedirectCallback && !promptWebFORNudge

  // preload cex transfer providers to avoid flickering when showing web for nudge
  useCexTransferProviders({ isDisabled: !promptWebFORNudge })

  const setIsShowingWebFORNudgeHandler: () => void = useEvent(() => {
    setIsShowingWebFORNudge(true)
  })

  const needsGeoAcknowledgment = useNeedsGeoAcknowledgment()
  const openGeoRestrictionModal = useGeoRestrictionModalStore((s) => s.open)

  const reviewGateContext = useReviewGateContext()
  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const inputCurrencyId = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currencyId)
  // Kept in sync with token input by useSyncFiatAndTokenAmountUpdater, so this covers both input modes.
  // Fiat, not a token amount: when the provider doesn't sell the input token, /buy selects a different token
  // and would read a token amount in that token's units.
  const fiatAmount = useSwapFormStore((s) => s.exactAmountFiat)
  const isMissingPlatformWallet = useIsMissingPlatformWallet(chainId)
  const action = getSwapFormButtonAction({
    shouldOpenVerifyIdentityModal,
    needsGeoAcknowledgment,
    promptWebFORNudge,
    reviewGateActionType: getReviewGateActionType(reviewGateContext),
    isMissingPlatformWallet,
  })

  const onPress = useEvent(() => {
    switch (action) {
      case SwapFormButtonAction.VerifyIdentity:
        // Screened here too: this branch returns before `handleOnReviewPress`, so it is
        // the one press that never reaches `useOnReviewPress`.
        screenActiveAddress(handleShowVerifyIdentityModal)
        return
      case SwapFormButtonAction.GeoAcknowledgment:
        openGeoRestrictionModal()
        return
      case SwapFormButtonAction.AddFunds:
        if (onAddFundsPress) {
          onAddFundsPress({ currencyId: inputCurrencyId, fiatAmount })
        } else {
          setIsShowingWebFORNudgeHandler()
        }
        return
      default:
        handleOnReviewPress()
    }
  })

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <SwapFormButtonTrace action={action}>
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
            onPress={onPress}
          >
            {buttonTextColor ? <Button.Text color={buttonTextColor}>{buttonText}</Button.Text> : buttonText}
          </Button>
        </Flex>
      </SwapFormButtonTrace>
    </Flex>
  )
})
