import { useResetAtom } from 'jotai/utils'
import styled from 'lib/theme'
import { StyledButton, styledIcon } from 'lib/theme/components'
import TYPE from 'lib/theme/type'
import { useState } from 'react'
import { Settings as SettingsIcon } from 'react-feather'

import Column from '../../Column'
import Dialog, { DialogBody, DialogHeader } from '../../Dialog'
import { BoundaryProvider } from '../../Popover'
import { settingsAtom } from '../state'
import GasPriceSelect from './GasPriceSelect'
import MaxSlippageSelect from './MaxSlippageSelect'
import SimplifyUiToggle from './SimplifyUiToggle'
import TransactionTtlInput from './TransactionTtlInput'

const Wrapper = styled.div`
  background-color: ${({ theme }) => theme.module};
  height: 100%;
`

export const StyledSettingsIcon = styledIcon(SettingsIcon)

const ResetButton = styled(StyledButton)`
  color: ${({ theme }) => theme.accent};
`

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const resetSettings = useResetAtom(settingsAtom)
  return (
    <Wrapper>
      <DialogHeader title="Settings" onClose={onClose}>
        <TYPE.subhead2>
          <ResetButton color="active" onClick={resetSettings}>
            Reset
          </ResetButton>
        </TYPE.subhead2>
      </DialogHeader>
      <DialogBody ref={setBoundary}>
        <Column gap="1em">
          <BoundaryProvider value={boundary}>
            <GasPriceSelect />
            <MaxSlippageSelect />
            <TransactionTtlInput />
            <SimplifyUiToggle />
          </BoundaryProvider>
        </Column>
      </DialogBody>
    </Wrapper>
  )
}

export default function Settings() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <StyledButton onClick={() => setOpen(true)}>
        <StyledSettingsIcon />
      </StyledButton>
      {open && (
        <Dialog>
          <SettingsDialog onClose={() => setOpen(false)} />
        </Dialog>
      )}
    </>
  )
}
