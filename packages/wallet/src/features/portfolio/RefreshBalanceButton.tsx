import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TouchableArea } from 'ui/src'
import { RotateRight } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'

/**
 * A button component that allows users to refresh their balance with a visual indicator
 * and keyboard shortcut support.
 *
 * @component
 * @example
 * ```tsx
 * <RefreshBalanceButton
 *   onPress={() => refetchBalance()}
 *   isLoading={isRefetchingBalancing}
 * />
 * ```
 *
 * @param {Object} props - Component props
 * @param {() => void} props.onPress - Callback function to execute when the refresh button is pressed
 * @param {boolean} props.isLoading - Indicates whether a refresh operation is in progress
 *
 * @returns {JSX.Element} A button with refresh icon and tooltip showing keyboard shortcut
 */
export function RefreshBalanceButton({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }): JSX.Element {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement
      const isTypingInField = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable

      if (['r', 'R'].includes(e.key) && !isTypingInField) {
        onPress()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPress])

  return (
    <Tooltip delay={0} restMs={0} placement="bottom">
      <Tooltip.Trigger>
        <TouchableArea
          group
          $group-hover={{ opacity: 1 }}
          opacity={0}
          flex={1}
          alignItems="center"
          justifyContent="center"
          // manually set disabled state using props, so we don't break hover state
          cursor={isLoading ? 'auto' : 'pointer'}
          onPress={isLoading ? undefined : onPress}
        >
          <RotateRight
            color="$neutral3"
            $group-hover={{ color: isLoading ? '$neutral3' : '$neutral3Hovered' }}
            size="$icon.16"
          />
        </TouchableArea>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <Flex row gap="$gap8">
          <Text variant="body4">{t('common.refresh')}</Text>
          <Flex
            centered
            width="$spacing16"
            height="$spacing16"
            p="$spacing2"
            borderRadius="$rounded4"
            borderWidth="$spacing1"
            borderColor="$neutral3"
            shadowColor="$neutral3"
            shadowOffset={{ height: 1, width: 0 }}
          >
            <Text variant="body4" color="$neutral2">
              R
            </Text>
          </Flex>
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}
