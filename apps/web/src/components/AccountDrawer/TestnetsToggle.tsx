import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { t } from 'uniswap/src/i18n'

export const showTestnetsAtom = atomWithStorage<boolean>('showTestnets', false)

export function TestnetsToggle() {
  const [showTestnets, updateShowTestnets] = useAtom(showTestnetsAtom)

  return (
    <SettingsToggle
      title={t('settings.showTestNets')}
      dataid="testnets-toggle"
      isActive={showTestnets}
      toggle={() => void updateShowTestnets((value) => !value)}
    />
  )
}
