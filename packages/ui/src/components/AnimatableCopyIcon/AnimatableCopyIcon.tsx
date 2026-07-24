import { isWebApp } from '@universe/environment'
import { ColorTokens } from 'tamagui'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Flex } from 'ui/src/components/layout'

export interface CopyIconProps {
  isAnimated?: boolean
  isCopied: boolean
  size: number
  // hideIcon technically only applies to the CopySheets icon, because we should allow the CheckmarkCircle icon to animate out on its own
  hideIcon?: boolean
  textColor?: ColorTokens
  dataTestId?: string
}

const iconProps = {
  position: 'absolute',
  top: 0,
  left: 0,
  animateOnly: ['opacity', 'transform'] as string[],
} as const

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
  if (!isAnimated) {
    return (
      <Flex position="relative" width={size} height={size}>
        {!hideIcon && <CopySheets color={textColor} size={size} data-testid={dataTestId} />}
      </Flex>
    )
  }

  return (
    <Flex position="relative" width={size} height={size}>
      {!hideIcon && (
        <Flex opacity={isCopied ? 0 : 1} animation={isCopied ? '200ms' : '200msDelayed200ms'} {...iconProps}>
          <CopySheets color={textColor} size={size} data-testid={dataTestId} />
        </Flex>
      )}
      <Flex
        opacity={isCopied ? 1 : 0}
        y={isCopied ? 0 : 5}
        animation={isCopied ? '200msDelayed200ms' : '200ms'}
        {...iconProps}
      >
        <CheckmarkCircle color="$statusSuccess" size={size} />
      </Flex>
    </Flex>
  )
}
