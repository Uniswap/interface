import { Button, Flex, useIsShortMobileDevice } from 'ui/src'
import { SwapFormButtonTrace } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/SwapFormButtonTrace'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsSwapButtonDisabled'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsTradeIndicative'
import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useOnReviewPress'
import { useSwapFormButtonColors } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useSwapFormButtonColors'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useSwapFormButtonText'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export const SWAP_BUTTON_TEXT_VARIANT = 'buttonLabel1'

export function SwapFormButton({ tokenColor }: { tokenColor?: string }): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const indicative = useIsTradeIndicative()
  const { handleOnReviewPress } = useOnReviewPress()
  const disabled = useIsSwapButtonDisabled()
  const buttonText = useSwapFormButtonText()
  const {
    backgroundColor: buttonBackgroundColor,
    variant: buttonVariant,
    emphasis: buttonEmphasis,
    buttonTextColor,
  } = useSwapFormButtonColors(tokenColor)

  return (
    <Flex alignItems="center" gap={isShortMobileDevice ? '$spacing8' : '$spacing16'}>
      <SwapFormButtonTrace>
        <Flex row alignSelf="stretch">
          <Button
            variant={buttonVariant}
            emphasis={buttonEmphasis}
            loading={!!indicative}
            isDisabled={disabled}
            backgroundColor={buttonBackgroundColor}
            size={isShortMobileDevice ? 'small' : 'large'}
            testID={TestID.ReviewSwap}
            onPress={handleOnReviewPress}
          >
            {buttonTextColor ? <Button.Text color={buttonTextColor}>{buttonText}</Button.Text> : buttonText}
          </Button>
        </Flex>
      </SwapFormButtonTrace>
    </Flex>
  )
}
