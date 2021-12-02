import styled, { ThemedText } from 'lib/theme'
import { Token } from 'lib/types'
import { ReactNode } from 'react'

import Column from '../Column'
import { DecimalInput } from '../Input'
import Row from '../Row'
import TokenSelect from '../TokenSelect'
import { Input } from './state'

const TokenInputRow = styled(Row)`
  grid-template-columns: 1fr;
`

interface TokenInputProps {
  input: Input
  disabled?: boolean
  onChangeInput: (input: number | undefined) => void
  onChangeToken: (token: Token) => void
  children: ReactNode
}

export default function TokenInput({
  input: { value, token },
  disabled,
  onChangeInput,
  onChangeToken,
  children,
}: TokenInputProps) {
  return (
    <Column gap={0.375}>
      <TokenInputRow>
        <ThemedText.H2>
          <DecimalInput value={value} onChange={onChangeInput} placeholder="0.0"></DecimalInput>
        </ThemedText.H2>
        <TokenSelect value={token} disabled={disabled} onSelect={onChangeToken} />
      </TokenInputRow>
      {children}
    </Column>
  )
}
