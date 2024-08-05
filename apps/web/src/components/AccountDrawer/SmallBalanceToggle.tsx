import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { t } from 'uniswap/src/i18n'

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
