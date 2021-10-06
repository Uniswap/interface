import { useState } from 'react'
import { Settings as Icon } from 'react-feather'

import themed from '../../themed'
import Modal from '../Modal'

const ThemedIcon = themed(Icon)`
  height: 20px;
  width: 20px;

  > * {
    stroke: ${({ theme }) => theme.icon1};
  }
`

const ThemedButton = themed.button`
  border: none;
  background-color: transparent;
  padding: 0;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    opacity: 0.7;
  }
`

export default function Settings() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ThemedButton onClick={() => setOpen(true)}>
        <ThemedIcon />
      </ThemedButton>
      {open && <Modal>Modal</Modal>}
    </>
  )
}
