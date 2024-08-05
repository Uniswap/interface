import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Trans } from 'uniswap/src/i18n'

export const hideSpamAtom = atomWithStorage<boolean>('hideSpamBalances', true)

export function SpamToggle() {
  const [hideSpam, updateHideSpam] = useAtom(hideSpamAtom)

  return (
    <SettingsToggle
      title={<Trans i18nKey="account.drawer.spamToggle" />}
      isActive={hideSpam}
      toggle={() => void updateHideSpam((value) => !value)}
    />
  )
}
