import { useResetAtom } from 'jotai/utils'
import styled, { icon } from 'lib/theme'
import TYPE from 'lib/theme/type'
import { useState } from 'react'
import { Settings as SettingsSvg } from 'react-feather'

import Button, { TextButton } from '../../Button'
import Column from '../../Column'
import Dialog, { DialogBody, DialogHeader } from '../../Dialog'
import { BoundaryProvider } from '../../Popover'
import { settingsAtom } from '../state'
import MaxSlippageSelect from './MaxSlippageSelect'
import MockToggle from './MockToggle'
import TransactionTtlInput from './TransactionTtlInput'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.module};
  border-radius: inherit;
  height: 100%;
`

const Body = styled(Column)`
  padding: 1em;
`

const SettingsIcon = icon(SettingsSvg)

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const resetSettings = useResetAtom(settingsAtom)
  return (
    <Wrapper>
      <DialogHeader title="Settings" onClose={onClose}>
        <TYPE.subhead2>
          <TextButton onClick={resetSettings}>Reset</TextButton>
        </TYPE.subhead2>
      </DialogHeader>
      <DialogBody ref={setBoundary}>
        <Body gap="1em">
          <BoundaryProvider value={boundary}>
            <MaxSlippageSelect />
            <TransactionTtlInput />
            <MockToggle />
          </BoundaryProvider>
        </Body>
      </DialogBody>
    </Wrapper>
  )
}

export default function Settings() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <SettingsIcon />
      </Button>
      {open && (
        <Dialog>
          <SettingsDialog onClose={() => setOpen(false)} />
        </Dialog>
      )}
    </>
  )
}
