import { t } from '@lingui/macro'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

export const hideSpamAtom = atomWithStorage<boolean>('hideSmallBalances', true)

export function HideSpamToggle() {
  const [hideSpam, updateHideSpam] = useAtom(hideSpamAtom)

  return (
    <SettingsToggle
      title={t`Hide unknown tokens & NFTs`}
      isActive={hideSpam}
      toggle={() => void updateHideSpam((value) => !value)}
    />
  )
}
