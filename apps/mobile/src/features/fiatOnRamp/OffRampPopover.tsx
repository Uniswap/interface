import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Popover, Text } from 'ui/src'
import { isAndroid } from 'utilities/src/platform'
import { selectHasViewedOffRampTooltip } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasViewedOffRampTooltip } from 'wallet/src/features/behaviorHistory/slice'

const POPOVER_OFFSET_X = 31
const POPOVER_OFFSET_Y = isAndroid ? 42 : 18
const POPOVER_WIDTH = 200
const POPOVER_DELAY_MS = 1500

export function OffRampPopover({ triggerContent }: { triggerContent: JSX.Element }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [delayedOpen, setDelayedOpen] = useState(false)
  const hasViewedOffRampTooltip = useSelector(selectHasViewedOffRampTooltip)

  useEffect(() => {
    setTimeout(() => {
      setDelayedOpen(true)
    }, POPOVER_DELAY_MS)
  }, [])

  function onOpenChange(open: boolean): void {
    if (!open) {
      dispatch(setHasViewedOffRampTooltip(true))
    }
  }

  return (
    <Popover
      offset={{ mainAxis: POPOVER_OFFSET_Y, crossAxis: POPOVER_OFFSET_X }}
      open={delayedOpen && !hasViewedOffRampTooltip}
      placement="bottom"
      onOpenChange={onOpenChange}
    >
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
