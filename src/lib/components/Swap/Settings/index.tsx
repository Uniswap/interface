import { Trans } from '@lingui/macro'
import { useResetAtom } from 'jotai/utils'
import { Settings as SettingsIcon } from 'lib/icons'
import styled, { ThemedText, useScrollbar } from 'lib/theme'
import React, { useState } from 'react'

import { IconButton, TextButton } from '../../Button'
import Column from '../../Column'
import Dialog, { Header } from '../../Dialog'
import { BoundaryProvider } from '../../Popover'
import { settingsAtom } from '../state'
import MaxSlippageSelect from './MaxSlippageSelect'
import TransactionTtlInput from './TransactionTtlInput'

export function SettingsDialog() {
  const [boundary, setBoundary] = useState<HTMLDivElement | null>(null)
  const scrollbar = useScrollbar(boundary, { padded: true })
  const resetSettings = useResetAtom(settingsAtom)
  return (
    <>
      <Header title={<Trans>Settings</Trans>} ruled>
        <TextButton onClick={resetSettings}>
          <ThemedText.ButtonSmall>
            <Trans>Reset</Trans>
          </ThemedText.ButtonSmall>
        </TextButton>
      </Header>
      <Column gap={1} style={{ paddingTop: '1em' }} ref={setBoundary} padded css={scrollbar}>
        <BoundaryProvider value={boundary}>
          <MaxSlippageSelect />
          <TransactionTtlInput />
        </BoundaryProvider>
      </Column>
    </>
  )
}

const SettingsButton = styled(IconButton)`
  ${SettingsIcon} {
    transition: transform 0.25s ease;

    :hover {
      transform: rotate(45deg);
    }
  }
`

export default function Settings({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <SettingsButton disabled={disabled} onClick={() => setOpen(true)} icon={SettingsIcon} />
      {open && (
        <Dialog color="module" onClose={() => setOpen(false)}>
          <SettingsDialog />
        </Dialog>
      )}
    </>
  )
}
