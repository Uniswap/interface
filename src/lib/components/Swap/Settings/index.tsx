import { useState } from 'react'
import { Settings as SettingsIcon } from 'react-feather'

import themed, { TYPE } from '../../../themed'
import { ThemedButton, themedIcon } from '../../../themed/components'
import Modal, { Body as ModalBody, Header as ModalHeader } from '../../Modal'
import { useResetSettings } from '../state/hooks'
import ExpertModeToggle from './ExpertModeToggle'
import GasPriceSelect from './GasPriceSelect'
import MaxSlippageSelect from './MaxSlippageSelect'
import MultihopToggle from './MultihopToggle'
import TransactionDeadlineInput from './TransactionDeadlineInput'

export const ThemedSettingsIcon = themedIcon(SettingsIcon)

const ThemedReset = themed(TYPE.text)`
  padding-right: 12px;

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const resetSettings = useResetSettings()
  return (
    <Modal>
      <ModalHeader title={<TYPE.title>Settings</TYPE.title>} onClose={onClose}>
        <ThemedReset color="action" onClick={resetSettings}>
          Reset
        </ThemedReset>
      </ModalHeader>
      <ModalBody>
        <GasPriceSelect />
        <MaxSlippageSelect />
        <TransactionDeadlineInput />
        <ExpertModeToggle />
        <MultihopToggle />
      </ModalBody>
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
