import TYPE from 'lib/theme/type'

import Row from '../Row'
import TokenInput from './TokenInput'

export default function SwapInput() {
  return (
    <>
      <Row>
        <TYPE.subhead3 color="secondary">Trading</TYPE.subhead3>
      </Row>
      <TokenInput
        value={undefined}
        token={{
          address: 'ether',
          symbol: 'ETH',
          logoUri: 'https://raw.githubusercontent.com/Uniswap/interface/main/src/assets/images/ethereum-logo.png',
        }}
        onChange={() => void 0}
        onMax={() => void 0}
      />
      <Row />
    </>
  )
}
