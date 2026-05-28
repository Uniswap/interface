import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/useDeadlineSettings'

export function DeadlineControl(): JSX.Element {
  const { t } = useTranslation()
  const { currentDeadline } = useDeadlineSettings()

  return (
    <Text color="$neutral2" variant="subheading2">
      {t('common.minutes.withCount', { count: currentDeadline })}
    </Text>
  )
}
