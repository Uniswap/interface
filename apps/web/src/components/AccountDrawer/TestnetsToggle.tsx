import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useDispatch } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { t } from 'uniswap/src/i18n'

export function TestnetsToggle() {
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()

  return (
    <SettingsToggle
      title={t('settings.setting.wallet.testnetMode.title')}
      dataid="testnets-toggle"
      isActive={isTestnetModeEnabled}
      toggle={() => {
        dispatch(setIsTestnetModeEnabled(!isTestnetModeEnabled))
      }}
    />
  )
}
