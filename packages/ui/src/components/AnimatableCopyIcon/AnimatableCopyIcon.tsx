import { ColorTokens } from 'tamagui'
import { TransitionItem } from 'ui/src/animations/components/AnimatePresencePager'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Flex } from 'ui/src/components/layout'
import { isWebApp } from 'utilities/src/platform'

export interface CopyIconProps {
  isAnimated?: boolean
  isCopied: boolean
  size: number
  // hideIcon technically only applies to the CopySheets icon, because we should allow the CheckmarkCircle icon to animate out on its own
  hideIcon?: boolean
  textColor?: ColorTokens
  dataTestId?: string
}

/**
 * CopySheets icon that animates to a checkmark when copied
 * @param isAnimated whether to animate the icon - by default mobile/extension are not animated because they show a "copied" popup
 * @param isCopied whether the icon is copied (handled externally)
 * @param size the size of the icon
 * @param textColor the color of the icon
 *
 * @dev extension/wallet animation are not animated by default because they show a "copied" popup
 *
 * @returns Animatable Copy Icon component
 */
export function AnimatableCopyIcon({
  isAnimated = isWebApp,
  isCopied,
  size,
  textColor = '$neutral2',
  hideIcon,
  dataTestId,
}: CopyIconProps): JSX.Element {
  return (
    <Flex position="relative" width={size} height={size}>
      {isAnimated && (
        <TransitionItem animation="300ms" animationType={isCopied ? 'up' : 'down'} distance={5}>
          {isCopied && <CheckmarkCircle position="absolute" top={0} left={0} color="$statusSuccess" size={size} />}
        </TransitionItem>
      )}
      {!hideIcon && (
        <Flex position="absolute" top={0} left={0}>
          <TransitionItem animation="300ms" animationType="fade">
            {(!isAnimated || !isCopied) && <CopySheets color={textColor} size={size} data-testid={dataTestId} />}
          </TransitionItem>
        </Flex>
      )}
    </Flex>
  )
}
