import { useColorsFromTokenColor, type ButtonProps, type ColorTokens } from 'ui/src'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useIsBlockingWithCustomMessage } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsBlockingWithCustomMessage'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsSwapButtonDisabled'

type ButtonColors = Pick<ButtonProps, 'backgroundColor' | 'variant' | 'emphasis'> & {
  buttonTextColor?: ColorTokens
}

export const useSwapFormButtonColors = (tokenColor?: string): ButtonColors => {
  const disabled = useIsSwapButtonDisabled()
  const isBlockingWithCustomMessage = useIsBlockingWithCustomMessage()
  const activeAccount = useAccountMeta()
  const { isSubmitting } = useSwapFormContext()
  const { validTokenColor, lightTokenColor } = useColorsFromTokenColor(tokenColor)
  const { swapRedirectCallback } = useTransactionModalContext()

  const isBlockingOrDisabledWithoutSwapRedirect = (isBlockingWithCustomMessage || disabled) && !swapRedirectCallback
  const isInactiveAccountOrSubmitting = !activeAccount || isSubmitting

  // If disabled, use defaults for background color
  // Otherwise, we'll try and use the color from the token (i.e. swapping on Web > TDP)
  const buttonBackgroundColor = disabled ? undefined : isInactiveAccountOrSubmitting ? lightTokenColor : validTokenColor

  const buttonVariant: ButtonProps['variant'] = !activeAccount
    ? 'branded'
    : isBlockingOrDisabledWithoutSwapRedirect
      ? 'default'
      : 'branded'
  const buttonEmphasis: ButtonProps['emphasis'] =
    isInactiveAccountOrSubmitting || isBlockingOrDisabledWithoutSwapRedirect ? 'secondary' : 'primary'

  const buttonTextColor = !activeAccount ? validTokenColor : undefined

  return {
    backgroundColor: buttonBackgroundColor,
    variant: buttonVariant,
    emphasis: buttonEmphasis,
    buttonTextColor,
  }
}
