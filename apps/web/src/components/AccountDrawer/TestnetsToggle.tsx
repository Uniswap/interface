import { SettingsToggle } from 'components/AccountDrawer/SettingsToggle'
import { t } from 'i18n'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

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
