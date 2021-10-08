import { useState } from 'react'
import { Settings as SettingsIcon } from 'react-feather'

import themed, { TYPE } from '../../../themed'
import { ThemedButton, themedIcon } from '../../../themed/components'
import Modal, { Body as ModalBody, Header as ModalHeader } from '../../Modal'
import { useResetSettings } from '../state/hooks'
import ExpertModeToggle from './ExpertModeToggle'
import GasPriceSelect from './GasPriceSelect'
import MaxSlippageSelect from './MaxSlippageSelect'
import MultiHopToggle from './MultiHopToggle'
import TransactionDeadlineInput from './TransactionDeadlineInput'

const ThemedSettingsIcon = themedIcon(SettingsIcon)

const ThemedReset = themed(TYPE.header.action)`
  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

function Title() {
  return (
    <>
      <ThemedSettingsIcon />
      <span style={{ width: 8 }} />
      <TYPE.header.title>Settings</TYPE.header.title>
    </>
  )
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const resetSettings = useResetSettings()
  return (
    <Modal>
      <ModalHeader title={<Title />} onClose={onClose}>
        <ThemedReset onClick={resetSettings}>Reset</ThemedReset>
      </ModalHeader>
      <ModalBody>
        <GasPriceSelect />
        <MaxSlippageSelect />
        <TransactionDeadlineInput />
        <ExpertModeToggle />
        <MultiHopToggle />
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
