import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { act, render } from 'uniswap/src/test/test-utils'

import ReactDOM from 'react-dom'
import { SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/chains/types'

ReactDOM.createPortal = jest.fn((element) => {
  return element as React.ReactPortal
})

describe(NetworkFilter, () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders a NetworkFilter', () => {
    const tree = render(<NetworkFilter chainIds={SUPPORTED_CHAIN_IDS} selectedChain={null} onPressChain={() => null} />)
    act(async () => {
      jest.runAllTimers()
    })
    expect(tree).toMatchSnapshot()
  })
})
