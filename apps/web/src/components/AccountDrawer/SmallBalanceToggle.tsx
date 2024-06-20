import { t } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

export const hideSmallBalancesAtom = atomWithStorage<boolean>('hideSmallBalances', false)

export function SmallBalanceToggle() {
  const [hideSmallBalances, updateHideSmallBalances] = useAtom(hideSmallBalancesAtom)

  return (
    <SettingsToggle
      title={t`Hide small balances`}
      isActive={hideSmallBalances}
      toggle={() => void updateHideSmallBalances((value) => !value)}
    />
  )
}
