import TYPE from 'lib/theme/type'

import Row from '../Row'
import CurrencyInput from './CurrencyInput'

export default function SwapOutput() {
  return (
    <>
      <Row>
        <TYPE.subhead3>For</TYPE.subhead3>
      </Row>
      <CurrencyInput value={undefined} onChange={() => void 0} />
    </>
  )
}
