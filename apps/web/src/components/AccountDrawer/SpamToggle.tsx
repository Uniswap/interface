import { Trans } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

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
