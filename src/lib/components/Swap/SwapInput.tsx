import TYPE from 'lib/theme/type'
import { ETH } from 'lib/token/mocks'
import { Token } from 'lib/token/types'
import { useState } from 'react'

import Row from '../Row'
import TokenInput from './TokenInput'

export default function SwapInput() {
  const [token, setToken] = useState<Token | undefined>(ETH)
  return (
    <>
      <Row>
        <TYPE.subhead3 color="secondary">Trading</TYPE.subhead3>
      </Row>
      <TokenInput value={undefined} token={token} onChangeValue={() => void 0} onChangeToken={setToken} showMax />
      <Row />
    </>
  )
}
