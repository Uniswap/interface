import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
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
  onChangeInput: (input: number | undefined) => void
  onChangeToken: (token: Token) => void
  children: ReactNode
}

export default function TokenInput({
  input: { value, token },
  onChangeInput,
  onChangeToken,
  children,
}: TokenInputProps) {
  return (
    <Column gap={0.25}>
      <TokenInputRow>
        <TYPE.h2>
          <DecimalInput value={value} onChange={onChangeInput} placeholder="0.0"></DecimalInput>
        </TYPE.h2>
        <TokenSelect value={token} onChange={onChangeToken} />
      </TokenInputRow>
      {children}
    </Column>
  )
}
