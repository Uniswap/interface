import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSpamTokens } from 'uniswap/src/features/settings/slice'

export function SpamTokensToggle() {
  const { t } = useTranslation()
  const hideSpamTokens = useHideSpamTokensSetting()
  const dispatch = useDispatch()

  const onToggle = () => {
    dispatch(setHideSpamTokens(!hideSpamTokens))
  }

  return (
    <SettingsToggle
      title={t('settings.setting.unknownTokens.title')}
      description={t('settings.setting.unknownTokens.subtitle')}
      isActive={hideSpamTokens}
      toggle={onToggle}
    />
  )
}
