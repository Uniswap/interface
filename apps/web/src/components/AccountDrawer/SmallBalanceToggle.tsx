import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHideSmallBalancesSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSmallBalances } from 'uniswap/src/features/settings/slice'

export function SmallBalanceToggle() {
  const { t } = useTranslation()
  const hideSmallBalances = useHideSmallBalancesSetting()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()

  const onToggle = () => {
    dispatch(setHideSmallBalances(!hideSmallBalances))
  }

  return (
    <SettingsToggle
      title={t('settings.hideSmallBalances')}
      description={t('settings.hideSmallBalances.subtitle')}
      isActive={hideSmallBalances && !isTestnetModeEnabled}
      toggle={onToggle}
      disabled={isTestnetModeEnabled}
    />
  )
}
