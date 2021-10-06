import { useState } from 'react'
import { Settings as SettingsIcon, X } from 'react-feather'

import { ThemedButton, themedIcon } from '../../themed/components'
import Modal from '../Modal'
import ModalHeader from '../Modal/Header'

const ThemedSettingsIcon = themedIcon(SettingsIcon)
const ThemedXIcon = themedIcon(X)

export default function Settings() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ThemedButton onClick={() => setOpen(true)}>
        <ThemedSettingsIcon />
      </ThemedButton>
      {open && (
        <Modal>
          <ModalHeader title="Transaction Settings" Icon={ThemedXIcon} onClick={() => setOpen(false)}></ModalHeader>
          {/* TODO: Settings Panel */}
        </Modal>
      )}
    </>
  )
}
