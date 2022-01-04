import { Trans } from '@lingui/macro'
import { useAtomValue } from 'jotai/utils'
import styled, { ThemedText } from 'lib/theme'
import { ReactNode } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenImg from '../TokenImg'
import { inputAtom, useUpdateInputToken, useUpdateInputValue } from './state'
import TokenInput from './TokenInput'

const mockBalance = 123.45

const InputColumn = styled(Column)<{ approved?: boolean }>`
  margin: 0.75em;
  position: relative;

  ${TokenImg} {
    filter: ${({ approved }) => (approved ? undefined : 'saturate(0) opacity(0.4)')};
    transition: filter 0.25s;
  }
`

interface InputProps {
  disabled?: boolean
  children: ReactNode
}

export default function Input({ disabled, children }: InputProps) {
  const input = useAtomValue(inputAtom)
  const setValue = useUpdateInputValue(inputAtom)
  const setToken = useUpdateInputToken(inputAtom)
  const balance = mockBalance

  return (
    <InputColumn gap={0.5} approved={input.approved !== false}>
      <Row>
        <ThemedText.Subhead2 color="secondary">
          <Trans>Trading</Trans>
        </ThemedText.Subhead2>
      </Row>
      <TokenInput
        input={input}
        disabled={disabled}
        onMax={balance ? () => setValue(balance) : undefined}
        onChangeInput={setValue}
        onChangeToken={setToken}
      >
        <ThemedText.Body2 color="secondary">
          <Row>
            {input.usdc ? `~ $${input.usdc.toLocaleString('en')}` : '-'}
            {balance && (
              <ThemedText.Body2 color={input.value && input.value > balance ? 'error' : undefined}>
                Balance: <span style={{ userSelect: 'text' }}>{balance}</span>
              </ThemedText.Body2>
            )}
          </Row>
        </ThemedText.Body2>
      </TokenInput>
      <Row />
      {children}
    </InputColumn>
  )
}
