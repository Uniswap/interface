import type { ColorTokens } from '@universe/mycelium'
import { Flex } from '@universe/mycelium'
import { Text } from '@universe/mycelium'
import { TransitionItem } from '@universe/mycelium/animate-presence-pager'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { CopySheets } from '@universe/mycelium/icons/CopySheets'
import { iconSizes } from '@universe/mycelium/tokens'
import { ReactNode } from 'react'

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
        curve="fast"
        animationType={isCopied ? 'up' : 'down'}
        childKey={isCopied ? 'copied' : 'default'}
        distance={5}
      >
        <Flex row alignItems="center" gap="$spacing8">
          {isCopied ? (
            <>
              <Text color="$statusSuccess" flexShrink={1} numberOfLines={1} variant="body3">
                {copiedLabel}
              </Text>
              <Flex
                centered
                flexShrink={0}
                $md={{ backgroundColor: '$statusSuccess2', borderRadius: '$rounded12', p: '$spacing8' }}
              >
                <CheckmarkCircle color="$statusSuccess" size={iconSize} />
              </Flex>
            </>
          ) : (
            <>
              <Text color="$neutral2" flexShrink={1} numberOfLines={1} variant="body3">
                {label}
              </Text>
              <Flex
                centered
                flexShrink={0}
                $md={{ backgroundColor: '$surface3', borderRadius: '$rounded12', p: '$spacing8' }}
              >
                <CopySheets color={iconColor} size={iconSize} />
              </Flex>
            </>
          )}
        </Flex>
      </TransitionItem>
    </Flex>
  )
}
