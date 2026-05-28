import { ReactNode } from 'react'
import { ColorTokens } from 'tamagui'
import { TransitionItem } from 'ui/src/animations/components/AnimatePresencePager'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { CopySheets } from 'ui/src/components/icons/CopySheets'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { iconSizes } from 'ui/src/theme'

interface AnimatedCopyLabelProps {
  isCopied: boolean
  label: ReactNode
  copiedLabel: ReactNode
  iconSize?: number
  iconColor?: ColorTokens
}

/**
 * Inline copy feedback that transitions both the label and the icon together
 * inside a single animation, keeping them perfectly in sync.
 *
 * Default state: label + CopySheets icon
 * Copied state: copiedLabel (green) + CheckmarkCircle icon
 */
export function AnimatedCopyLabel({
  isCopied,
  label,
  copiedLabel,
  iconSize = iconSizes.icon16,
  iconColor = '$neutral2',
}: AnimatedCopyLabelProps): JSX.Element {
  return (
    <Flex shrink overflow="hidden">
      <TransitionItem
        animation="fast"
        animationType={isCopied ? 'up' : 'down'}
        childKey={isCopied ? 'copied' : 'default'}
        distance={5}
      >
        <Flex row alignItems="center" gap="$spacing8">
          {isCopied ? (
            <>
              <Text color="$statusSuccess" variant="body3">
                {copiedLabel}
              </Text>
              <Flex centered $md={{ backgroundColor: '$statusSuccess2', borderRadius: '$rounded12', p: '$spacing8' }}>
                <CheckmarkCircle color="$statusSuccess" size={iconSize} />
              </Flex>
            </>
          ) : (
            <>
              <Text color="$neutral2" variant="body3">
                {label}
              </Text>
              <Flex centered $md={{ backgroundColor: '$surface3', borderRadius: '$rounded12', p: '$spacing8' }}>
                <CopySheets color={iconColor} size={iconSize} />
              </Flex>
            </>
          )}
        </Flex>
      </TransitionItem>
    </Flex>
  )
}
