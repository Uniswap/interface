import TYPE from 'lib/theme/type'

import Row from '../Row'
import CurrencyInput from './CurrencyInput'

export default function SwapInput() {
  return (
    <>
      <Row>
        <TYPE.subhead3 color="secondary">Trading</TYPE.subhead3>
      </Row>
      <CurrencyInput value={undefined} onChange={() => void 0} onMax={() => void 0} />
      <Row />
    </>
  )
}
