import { type ButtonProps, type ColorTokens, useColorsFromTokenColor } from 'ui/src'
import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { useIsShowingWebFORNudge, useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsBlockingWithCustomMessage } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockingWithCustomMessage'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled'
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

  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const platform = chainIdToPlatform(chainId)
  const activeAccount = useActiveAccount(platform)

  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const isShowingWebFORNudge = useIsShowingWebFORNudge()
  const { validTokenColor, lightTokenColor } = useColorsFromTokenColor(tokenColor)
  const { swapRedirectCallback } = useTransactionModalContext()
  const promptWebFORNudge = useIsWebFORNudgeEnabled() && !swapRedirectCallback && !isShowingWebFORNudge

  const isBlockingOrDisabledWithoutSwapRedirect = (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
  const isInactiveAccountOrSubmitting = !activeAccount || isSubmitting

  // If disabled, use defaults for background color
  // Checks if web for nudge is enabled and uses accent2 if it is
  // Otherwise, we'll try and use the color from the token (i.e. swapping on Web > TDP)
  const buttonBackgroundColor = ((): ColorTokens | undefined => {
    if (disabled) {
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

  const buttonVariant: ButtonProps['variant'] =
    !activeAccount || promptWebFORNudge ? 'branded' : isBlockingOrDisabledWithoutSwapRedirect ? 'default' : 'branded'
  const buttonEmphasis: ButtonProps['emphasis'] =
    isInactiveAccountOrSubmitting || isBlockingOrDisabledWithoutSwapRedirect ? 'secondary' : 'primary'

  const buttonTextColor = ((): ColorTokens | undefined => {
    if (promptWebFORNudge) {
      return '$accent1'
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
