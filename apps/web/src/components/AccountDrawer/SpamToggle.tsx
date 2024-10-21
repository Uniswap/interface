import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useDispatch } from 'react-redux'
import { useEnabledChains, useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSpamTokens } from 'uniswap/src/features/settings/slice'
import { Trans } from 'uniswap/src/i18n'

export function SpamToggle() {
  const hideSpamTokens = useHideSpamTokensSetting()
  const dispatch = useDispatch()
  const { isTestnetModeEnabled } = useEnabledChains()

  const onToggle = () => {
    dispatch(setHideSpamTokens(!hideSpamTokens))
  }

  return (
    <SettingsToggle
      title={<Trans i18nKey="account.drawer.spamToggle" />}
      isActive={hideSpamTokens && !isTestnetModeEnabled}
      toggle={onToggle}
      disabled={isTestnetModeEnabled}
    />
  )
}
