import TYPE from 'lib/theme/type'

import Row from '../Row'
import TokenInput from './TokenInput'

export default function SwapOutput() {
  return (
    <>
      <Row>
        <TYPE.subhead3>For</TYPE.subhead3>
      </Row>
      <TokenInput value={undefined} onChange={() => void 0} />
    </>
  )
}
