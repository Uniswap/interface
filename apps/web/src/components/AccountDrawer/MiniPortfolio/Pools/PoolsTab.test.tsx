import Pools from 'components/AccountDrawer/MiniPortfolio/Pools/PoolsTab'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { mocked } from 'test-utils/mocked'
import { owner, useMultiChainPositionsReturnValue } from 'test-utils/pools/fixtures'
import { render } from 'test-utils/render'

jest.mock('./useMultiChainPositions')

jest.spyOn(console, 'warn').mockImplementation()

beforeEach(() => {
  mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
})
test('Pools should render LP positions', () => {
  const props = { account: owner }
  const { container } = render(<Pools {...props} />)
  expect(container).not.toBeEmptyDOMElement()
})
