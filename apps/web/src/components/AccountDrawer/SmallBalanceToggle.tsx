import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useDispatch } from 'react-redux'
import { useEnabledChains, useHideSmallBalancesSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSmallBalances } from 'uniswap/src/features/settings/slice'
import { t } from 'uniswap/src/i18n'

export function SmallBalanceToggle() {
  const hideSmallBalances = useHideSmallBalancesSetting()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()

  const onToggle = () => {
    dispatch(setHideSmallBalances(!hideSmallBalances))
  }

  return (
    <SettingsToggle
      title={t('settings.hideSmallBalances')}
      isActive={hideSmallBalances && !isTestnetModeEnabled}
      toggle={onToggle}
      disabled={isTestnetModeEnabled}
    />
  )
}
