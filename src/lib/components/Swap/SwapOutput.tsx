import TYPE from 'lib/theme/type'
import { Token } from 'lib/token/types'
import { useState } from 'react'

import Row from '../Row'
import TokenInput from './TokenInput'

export default function SwapOutput() {
  const [token, setToken] = useState<Token | undefined>(undefined)
  return (
    <>
      <Row>
        <TYPE.subhead3>For</TYPE.subhead3>
      </Row>
      <TokenInput value={undefined} token={token} onChangeValue={() => void 0} onChangeToken={setToken} />
    </>
  )
}
