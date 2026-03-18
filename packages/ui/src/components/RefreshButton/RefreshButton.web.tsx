import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src/components/layout'
import type { RefreshButtonProps } from 'ui/src/components/RefreshButton/RefreshButton'
import { RefreshButtonIcon } from 'ui/src/components/RefreshButton/RefreshButtonIcon'
import { Text } from 'ui/src/components/text'
import { Tooltip } from 'ui/src/components/tooltip/Tooltip'
import { zIndexes } from 'ui/src/theme'
import { isWebPlatform } from 'utilities/src/platform'

/**
 * A button component that allows users to refresh their balance with a visual indicator
 * and keyboard shortcut support.
 *
 * @component
 * @example
 * ```tsx
 * <Flex group>
 *   <RefreshButton
 *     onPress={() => refetchBalance()}
 *     isLoading={isRefetchingBalancing}
 *   />
 * </Flex>
 * ```
 *
 * @param {() => void} onPress - Callback function to execute when the refresh button is pressed
 * @param {boolean} isLoading - Indicates whether a refresh operation is in progress
 *
 * @returns {JSX.Element} A button with refresh icon and tooltip showing keyboard shortcut
 */
export function RefreshButton({ onPress, isLoading }: RefreshButtonProps): JSX.Element {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (!isWebPlatform) {
        return
      }
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
        <RefreshButtonIcon isLoading={isLoading} onPress={onPress} />
      </Tooltip.Trigger>
      <Tooltip.Content zIndex={zIndexes.overlay}>
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
