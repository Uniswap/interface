import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { Trans } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { setHideSpamTokens } from 'uniswap/src/features/settings/slice'

export function SpamToggle() {
  const hideSpamTokens = useHideSpamTokensSetting()
  const dispatch = useDispatch()

  const onToggle = () => {
    dispatch(setHideSpamTokens(!hideSpamTokens))
  }

  return (
    <SettingsToggle title={<Trans i18nKey="account.drawer.spamToggle" />} isActive={hideSpamTokens} toggle={onToggle} />
  )
}
