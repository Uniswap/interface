import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useDispatch } from 'react-redux'
import { useHideSmallBalancesSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSmallBalances } from 'uniswap/src/features/settings/slice'
import { t } from 'uniswap/src/i18n'

export function SmallBalanceToggle() {
  const hideSmallBalances = useHideSmallBalancesSetting()
  const dispatch = useDispatch()

  const onToggle = () => {
    dispatch(setHideSmallBalances(!hideSmallBalances))
  }

  return <SettingsToggle title={t('settings.hideSmallBalances')} isActive={hideSmallBalances} toggle={onToggle} />
}
