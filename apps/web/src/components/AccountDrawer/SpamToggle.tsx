import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const hideSpamAtom = atomWithStorage<boolean>('hideSmallBalances', true)

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
