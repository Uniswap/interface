import themed, { TYPE } from 'lib/themed'
import { ThemedButton, themedIcon } from 'lib/themed/components'
import { useState } from 'react'
import { Settings as SettingsIcon } from 'react-feather'

import Modal, { Body, Header } from '../../Modal'
import { BoundaryProvider } from '../../Popover'
import { useResetSettings } from '../state/hooks'
import ExpertModeToggle from './ExpertModeToggle'
import GasPriceSelect from './GasPriceSelect'
import MaxSlippageSelect from './MaxSlippageSelect'
import MultihopToggle from './MultihopToggle'
import TransactionTtlInput from './TransactionTtlInput'

export const ThemedSettingsIcon = themedIcon(SettingsIcon)

const ThemedReset = themed(TYPE.text)`
  padding-right: 12px;

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const resetSettings = useResetSettings()
  return (
    <Modal>
      <Header title={<TYPE.title>Settings</TYPE.title>} onClose={onClose}>
        <ThemedReset color="action" onClick={resetSettings}>
          Reset
        </ThemedReset>
      </Header>
      <Body ref={setContainer}>
        <BoundaryProvider value={container}>
          <GasPriceSelect />
          <MaxSlippageSelect />
          <TransactionTtlInput />
          <ExpertModeToggle />
          <MultihopToggle />
        </BoundaryProvider>
      </Body>
    </Modal>
  )
}

export default function Settings() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ThemedButton onClick={() => setOpen(true)}>
        <ThemedSettingsIcon />
      </ThemedButton>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  )
}
