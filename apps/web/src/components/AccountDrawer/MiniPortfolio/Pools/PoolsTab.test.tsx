import Pools from 'components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { mocked } from 'test-utils/mocked'
import { owner, useMultiChainPositionsReturnValue } from 'test-utils/pools/fixtures'
import { renderWithUniswapContext } from 'test-utils/render'

vi.mock('./useMultiChainPositions')

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
