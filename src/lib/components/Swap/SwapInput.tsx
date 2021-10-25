import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
import { ReactNode } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput, { TokenInputProps } from './TokenInput'

const InputColumn = styled(Column)`
  padding: 0.75em;
  position: relative;
`

export default function SwapInput({ children, ...props }: { children: ReactNode } & TokenInputProps) {
  return (
    <InputColumn gap={0.75}>
      <Row>
        <TYPE.subhead3 color="secondary">Trading</TYPE.subhead3>
      </Row>
      <TokenInput {...props} showMax />
      <Row />
      {children}
    </InputColumn>
  )
}
