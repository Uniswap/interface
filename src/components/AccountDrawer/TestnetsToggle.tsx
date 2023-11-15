import { msg } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { SettingsToggle } from './SettingsToggle'

export const showTestnetsAtom = atomWithStorage<boolean>('showTestnets', false)

export function TestnetsToggle() {
  const { _ } = useLingui()
  const [showTestnets, updateShowTestnets] = useAtom(showTestnetsAtom)

  return (
    <SettingsToggle
      title={_(msg`Show testnets`)}
      dataid="testnets-toggle"
      isActive={showTestnets}
      toggle={() => void updateShowTestnets((value) => !value)}
    />
  )
}
