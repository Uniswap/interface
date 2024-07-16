import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Pin, X } from 'ui/src/components/icons'
import { iconSizes, zIndices } from 'ui/src/theme'

const POPUP_WIDTH = 240
const POPUP_OFFSET = 4
const POPUP_SHADOW_RADIUS = 8

export function PinReminder({
  onClose,
  style = 'popup',
}: {
  onClose?: () => void
  style?: 'inline' | 'popup'
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      row
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth={1}
      gap="$spacing12"
      p="$spacing12"
      shadowColor="$shadowColor"
      shadowOpacity={0.6}
      shadowRadius={POPUP_SHADOW_RADIUS}
      style={{ ...styles[style] }}
      width={POPUP_WIDTH}
    >
      <Flex shrink gap="$spacing4">
        <Flex row shrink alignItems="center" gap="$spacing4">
          <Pin color="$accent1" size={iconSizes.icon16} />
          <Text variant="body3">{t('onboarding.complete.pin.title')}</Text>
        </Flex>
        <Text color="$neutral2" variant="body4">
          {t('onboarding.complete.pin.description')}
        </Text>
      </Flex>
      {onClose && (
        <Flex cursor="pointer" position="absolute" right="$spacing12" top="$spacing12" onPress={onClose}>
          <X color="$neutral3" size="$icon.16" />
        </Flex>
      )}
    </Flex>
  )
}

const styles = {
  inline: {
    position: 'relative' as const,
    width: '100%',
  },
  popup: {
    position: 'absolute' as const,
    right: POPUP_OFFSET,
    top: POPUP_OFFSET,
    width: POPUP_WIDTH,
    zIndex: zIndices.popover,
  },
}
