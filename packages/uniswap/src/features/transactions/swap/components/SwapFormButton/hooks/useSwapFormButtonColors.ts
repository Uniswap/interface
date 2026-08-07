import { type ButtonProps, type ColorTokens, useColorsFromTokenColor } from 'ui/src'
import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { useIsShowingWebFORNudge, useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsBlockedByPermissionedPool } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockedByPermissionedPool'
import { useIsBlockingWithCustomMessage } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockingWithCustomMessage'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled'
import { useNeedsGeoAcknowledgment } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionAcknowledgment'
import { useGeoRestrictionMode } from 'uniswap/src/features/transactions/swap/hooks/useGeoRestrictionMode'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

type ButtonColors = Pick<ButtonProps, 'backgroundColor' | 'variant' | 'emphasis'> & {
  buttonTextColor?: ColorTokens
}

export const useSwapFormButtonColors = (tokenColor?: string): ButtonColors => {
  const disabled = useIsSwapButtonDisabled()
  const isBlockingWithCustomMessage = useIsBlockingWithCustomMessage()
  const needsGeoAcknowledgment = useNeedsGeoAcknowledgment()
  // A region hard block renders a disabled CTA in the neutral blocked style, even when no wallet is connected.
  const isGeoRestricted = useGeoRestrictionMode() === 'restricted'
  const isPermissionedBlocking = useIsBlockedByPermissionedPool()

  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const platform = chainIdToPlatform(chainId)
  const activeAccount = useActiveAccount(platform)

  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const isShowingWebFORNudge = useIsShowingWebFORNudge()
  const { validTokenColor, lightTokenColor } = useColorsFromTokenColor(tokenColor)
  const { swapRedirectCallback } = useTransactionModalContext()
  const promptWebFORNudge = useIsWebFORNudgeEnabled() && !swapRedirectCallback && !isShowingWebFORNudge

  // Geo acknowledgement keeps the button an active "Review" CTA (it opens the attestation
  // modal), so it should not adopt the blocked/disabled styling.
  const isBlockingOrDisabledWithoutSwapRedirect =
    !needsGeoAcknowledgment && (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
  const isInactiveAccountOrSubmitting = !activeAccount || isSubmitting

  // If disabled, use defaults for background color
  // Checks if web for nudge is enabled and uses accent2 if it is
  // Otherwise, we'll try and use the color from the token (i.e. swapping on Web > TDP)
  const buttonBackgroundColor = ((): ColorTokens | undefined => {
    if (disabled || isPermissionedBlocking) {
      return undefined
    }

    if (isInactiveAccountOrSubmitting) {
      return lightTokenColor
    }

    if (promptWebFORNudge) {
      return '$accent2'
    }

    return validTokenColor
  })()

  const buttonVariant: ButtonProps['variant'] = ((): ButtonProps['variant'] => {
    if (isGeoRestricted || isPermissionedBlocking) {
      return 'default'
    }
    if (!activeAccount || promptWebFORNudge) {
      return 'branded'
    }
    if (isBlockingOrDisabledWithoutSwapRedirect) {
      return 'default'
    }
    return 'branded'
  })()

  const buttonEmphasis: ButtonProps['emphasis'] = ((): ButtonProps['emphasis'] => {
    if (isPermissionedBlocking) {
      return 'primary'
    }
    if (isInactiveAccountOrSubmitting || isBlockingOrDisabledWithoutSwapRedirect) {
      return 'secondary'
    }
    return 'primary'
  })()

  const buttonTextColor = ((): ColorTokens | undefined => {
    if (promptWebFORNudge) {
      return '$accent1'
    }

    // Neutral blocked style: don't adopt the branded token color used for the connect-wallet CTA.
    if (isGeoRestricted) {
      return undefined
    }

    if (!activeAccount) {
      return validTokenColor
    }

    return undefined
  })()

  return {
    backgroundColor: buttonBackgroundColor,
    variant: buttonVariant,
    emphasis: buttonEmphasis,
    buttonTextColor,
  }
}
