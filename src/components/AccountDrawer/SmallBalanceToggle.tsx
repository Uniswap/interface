import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

export const hideSmallBalancesAtom = atomWithStorage<boolean>('hideSmallBalances', true)

export function SmallBalanceToggle() {
  const { _ } = useLingui()
  const [hideSmallBalances, updateHideSmallBalances] = useAtom(hideSmallBalancesAtom)

  return (
    <SettingsToggle
      title={_(msg`Hide small balances`)}
      isActive={hideSmallBalances}
      toggle={() => void updateHideSmallBalances((value) => !value)}
    />
  )
}
