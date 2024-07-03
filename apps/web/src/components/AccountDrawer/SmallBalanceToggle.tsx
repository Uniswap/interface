import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { t } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const hideSmallBalancesAtom = atomWithStorage<boolean>('hideSmallBalances', true)

export function SmallBalanceToggle() {
  const [hideSmallBalances, updateHideSmallBalances] = useAtom(hideSmallBalancesAtom)

  return (
    <SettingsToggle
      title={t('settings.hideSmallBalances')}
      isActive={hideSmallBalances}
      toggle={() => void updateHideSmallBalances((value) => !value)}
    />
  )
}
