import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { render } from 'uniswap/src/test/test-utils'

import ReactDOM from 'react-dom'

ReactDOM.createPortal = jest.fn((element) => {
  return element as React.ReactPortal
})

describe(NetworkFilter, () => {
  it('renders a NetworkFilter', () => {
    const tree = render(<NetworkFilter selectedChain={null} onPressChain={() => null} />)
    expect(tree).toMatchSnapshot()
  })
})
