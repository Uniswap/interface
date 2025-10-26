import Pools from 'components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { mocked } from 'test-utils/mocked'
import { owner, useMultiChainPositionsReturnValue } from 'test-utils/pools/fixtures'
import { renderWithUniswapContext } from 'test-utils/render'

vi.mock('./useMultiChainPositions')

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(() => ({
    evmAddress: '0x0000000000000000000000000000000000000000',
    svmAddress: undefined,
  })),
  useConnectionStatus: vi.fn(() => ({ isConnected: true, isConnecting: false, isDisconnected: false })),
}))

vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
})

test('Pools should render LP positions', () => {
  const props = { account: owner }
  const { container } = renderWithUniswapContext(<Pools {...props} />)
  expect(container).not.toBeEmptyDOMElement()
})
