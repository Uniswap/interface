import { ETH } from 'lib/mocks'
import styled from 'lib/theme'
import TYPE from 'lib/theme/type'
import { Token } from 'lib/types'
import { ReactNode, useState } from 'react'

import Column from '../Column'
import Row from '../Row'
import TokenInput from './TokenInput'

const InputColumn = styled(Column)`
  padding: 0.75em;
  position: relative;
`

export default function SwapInput({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<Token | undefined>(ETH)
  return (
    <InputColumn gap={0.75}>
      <Row>
        <TYPE.subhead3 color="secondary">Trading</TYPE.subhead3>
      </Row>
      <TokenInput value={undefined} token={token} onChangeValue={() => void 0} onChangeToken={setToken} showMax />
      <Row />
      {children}
    </InputColumn>
  )
}
