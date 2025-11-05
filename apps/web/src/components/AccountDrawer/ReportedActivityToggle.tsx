import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHideReportedActivitySetting } from 'uniswap/src/features/settings/hooks'
import { setHideReportedActivity } from 'uniswap/src/features/settings/slice'

export function ReportedActivityToggle() {
  const { t } = useTranslation()
  const hideReportedActivity = useHideReportedActivitySetting()
  const dispatch = useDispatch()

  const onToggle = () => {
    dispatch(setHideReportedActivity(!hideReportedActivity))
  }

  return (
    <SettingsToggle
      title={t('settings.setting.reportedActivity.title')}
      description={t('settings.setting.reportedActivity.subtitle')}
      isActive={hideReportedActivity}
      toggle={onToggle}
    />
  )
}
