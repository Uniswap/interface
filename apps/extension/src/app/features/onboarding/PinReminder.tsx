import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Pin, X } from 'ui/src/components/icons'
import { zIndexes } from 'ui/src/theme'

const POPUP_WIDTH = 240
const POPUP_OFFSET = 4
const POPUP_ARROW_SIZE = 12
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
    <>
      <Flex
        row
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth="$spacing1"
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
            <Pin color="$accent1" size="$icon.16" />
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
      <PinReminderArrow />
    </>
  )
}

function PinReminderArrow(): JSX.Element {
  return (
    <Flex
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderLeftWidth={1}
      borderTopLeftRadius="$rounded4"
      borderTopWidth={1}
      content=""
      height={POPUP_ARROW_SIZE}
      position="absolute"
      right={POPUP_OFFSET + 24}
      rotate="45deg"
      top={POPUP_OFFSET - 6}
      width={POPUP_ARROW_SIZE}
      zIndex={zIndexes.popover + 1}
    />
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
    zIndex: zIndexes.popover,
  },
}
