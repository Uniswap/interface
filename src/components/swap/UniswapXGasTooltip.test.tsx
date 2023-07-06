import { TEST_DUTCH_TRADE } from 'test-utils/constants'
import { render } from 'test-utils/render'

import UniswapXGasTooltip from './UniswapXGasTooltip'

describe('UniswapXGasTooltip', () => {
  it('should render the expected gas estimate', () => {
    const result = render(<UniswapXGasTooltip trade={TEST_DUTCH_TRADE} />)
    expect(TEST_DUTCH_TRADE.classicGasUseEstimateUSD).toEqual(7.87)
    expect(result.getByText(`$${TEST_DUTCH_TRADE.classicGasUseEstimateUSD}`)).toBeInTheDocument()
  })
})
