import TYPE from 'lib/theme/type'

import Row from '../Row'
import Rule from '../Rule'

export default function SwapToolbar() {
  return (
    <>
      <Rule />
      <Row grow>
        <TYPE.caption>Uniswap V3</TYPE.caption>
      </Row>
    </>
  )
}
