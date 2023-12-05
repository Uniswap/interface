import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

export const hideSpamAtom = atomWithStorage<boolean>('hideSmallBalances', true)

export function SpamToggle() {
  const [hideSpam, updateHideSpam] = useAtom(hideSpamAtom)

  return (
    <SettingsToggle
      title={<Trans>Hide unknown tokens & NFTs</Trans>}
      isActive={hideSpam}
      toggle={() => void updateHideSpam((value) => !value)}
    />
  )
}
