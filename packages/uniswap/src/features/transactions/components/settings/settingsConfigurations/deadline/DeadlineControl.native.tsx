import { DeadlineSettingValue } from '@universe/transactions-ui'
import { useDeadlineSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/deadline/useDeadlineSettings'

export function DeadlineControl(): JSX.Element {
  const { currentDeadline } = useDeadlineSettings()

  return <DeadlineSettingValue minutes={currentDeadline} />
}
