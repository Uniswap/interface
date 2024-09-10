import { useTranslation } from 'react-i18next'
import { Popover, Text } from 'ui/src'

const POPOVER_OFFSET_X = 31
const POPOVER_OFFSET_Y = 18
const POPOVER_WIDTH = 200

export function OffRampPopover({ triggerContent }: { triggerContent: JSX.Element }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Popover defaultOpen offset={{ mainAxis: POPOVER_OFFSET_Y, crossAxis: POPOVER_OFFSET_X }} placement="bottom">
      <Popover.Trigger>{triggerContent}</Popover.Trigger>
      <Popover.Content
        animation={[
          'quick',
          {
            opacity: {
              overshootClamping: true,
            },
          },
        ]}
        borderColor="$surface3"
        borderRadius="$rounded12"
        borderWidth="$spacing1"
        enterStyle={{ y: -10, opacity: 0 }}
        exitStyle={{ y: -10, opacity: 0 }}
        p="$spacing12"
        shadowColor="$shadowColor"
        shadowOpacity={0.06}
        shadowRadius={6}
        width={POPOVER_WIDTH}
      >
        <Popover.Arrow
          borderColor="$surface3"
          borderWidth="$spacing1"
          shadowColor="$shadowColor"
          shadowOpacity={0.06}
          shadowRadius={6}
          size="$spacing16"
        />
        <Text variant="body4">{t('fiatOffRamp.welcome.tooltip')}</Text>
      </Popover.Content>
    </Popover>
  )
}
