import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import { ReactNode, useState } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput from './TokenInput'

const OutputColumn = styled(Column)`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => theme.borderRadius - 0.25}em;
  padding: 0.75em;
  position: relative;
`

export default function SwapOutput({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<Token | undefined>(undefined)
  return (
    <OutputColumn gap={0.75}>
      <Row>
        <TYPE.subhead3>For</TYPE.subhead3>
      </Row>
      <TokenInput value={undefined} token={token} onChangeValue={() => void 0} onChangeToken={setToken} />
      {children}
    </OutputColumn>
  )
}
