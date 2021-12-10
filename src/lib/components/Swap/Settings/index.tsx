import { Trans } from '@lingui/macro'
import { useResetAtom } from 'jotai/utils'
import { Settings as SettingsIcon } from 'lib/icons'
import { ThemedText } from 'lib/theme'
import { useState } from 'react'

import { IconButton, TextButton } from '../../Button'
import Column from '../../Column'
import Dialog, { Header } from '../../Dialog'
import { BoundaryProvider } from '../../Popover'
import { settingsAtom } from '../state'
import MaxSlippageSelect from './MaxSlippageSelect'
import TransactionTtlInput from './TransactionTtlInput'

export function SettingsDialog() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const resetSettings = useResetAtom(settingsAtom)
  return (
    <>
      <Header title={<Trans>Settings</Trans>} ruled>
        <TextButton onClick={resetSettings}>
          <ThemedText.Subhead2>
            <Trans>Reset</Trans>
          </ThemedText.Subhead2>
        </TextButton>
      </Header>
      <Column gap={1} style={{ paddingTop: '1em' }} ref={setBoundary} padded scrollable={{ current: boundary }}>
        <BoundaryProvider value={boundary}>
          <MaxSlippageSelect />
          <TransactionTtlInput />
        </BoundaryProvider>
      </Column>
    </>
  )
}

export default function Settings({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton disabled={disabled} onClick={() => setOpen(true)}>
        <SettingsIcon />
      </IconButton>
      {open && (
        <Dialog color="module" onClose={() => setOpen(false)}>
          <SettingsDialog />
        </Dialog>
      )}
    </>
  )
}
