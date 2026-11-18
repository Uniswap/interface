import { Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

export interface DeadlineSettingValueProps {
  /** The deadline in effect, in minutes. */
  minutes: number
}

/**
 * The value of the native Swap deadline settings row, e.g. `30 minutes`. Pressing the row
 * opens DeadlineScreen; on web the row's value is the DeadlineInlineInput editor instead.
 *
 * Replaces DeadlineControl.native.
 */
export function DeadlineSettingValue({ minutes }: DeadlineSettingValueProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Text color="$neutral2" variant="subheading2">
      {t('common.minutes.withCount', { count: minutes })}
    </Text>
  )
}
