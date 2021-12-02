import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import { useUpdateAtom } from 'jotai/utils'
import styled, { icon, ThemedText } from 'lib/theme'
import { pickAtom } from 'lib/utils/atoms'
import { ReactNode } from 'react'
import { Book } from 'react-feather'

import { TextButton } from '../Button'
import Column from '../Column'
import Row from '../Row'
import { inputAtom, State, stateAtom } from './state'
import TokenInput from './TokenInput'

const BookIcon = icon(Book, { color: 'currentColor' })

const InputColumn = styled(Column)`
  padding: 0.75em;
  position: relative;
`

export default function Input({ children }: { children: ReactNode }) {
  const input = useAtomValue(inputAtom)
  const setValue = useUpdateAtom(pickAtom(inputAtom, 'value'))
  const setToken = useUpdateAtom(pickAtom(inputAtom, 'token'))
  const state = useAtomValue(stateAtom)
  const balance = 123.45

  return (
    <InputColumn gap={0.5}>
      <Row>
        <ThemedText.Subhead2 color="secondary">
          <Trans>Trading</Trans>
        </ThemedText.Subhead2>
      </Row>
      <TokenInput
        input={input}
        disabled={state === State.TOKEN_APPROVAL}
        onChangeInput={setValue}
        onChangeToken={setToken}
      >
        <ThemedText.Body2 color="secondary">
          <Row>
            {input.usdc ? `~ $${input.usdc.toLocaleString('en')}` : '-'}
            {balance && (
              <Row gap={0.5}>
                <Row gap={0.25} color={state === State.BALANCE_INSUFFICIENT ? 'error' : undefined}>
                  <BookIcon />
                  {balance}
                </Row>
                <TextButton onClick={() => setValue(balance)} disabled={!balance}>
                  <Trans>Max</Trans>
                </TextButton>
              </Row>
            )}
          </Row>
        </ThemedText.Body2>
      </TokenInput>
      <Row />
      {children}
    </InputColumn>
  )
}
