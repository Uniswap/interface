import { TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { render } from 'test-utils/render'

import GasEstimateBadge from './GasEstimateBadge'

describe('GasEstimateBadge.tsx', () => {
  it('renders a trade', () => {
    const { asFragment } = render(<GasEstimateBadge trade={TEST_TRADE_EXACT_INPUT} loading={false} />)
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders loading state', () => {
    const { asFragment } = render(<GasEstimateBadge trade={undefined} loading />)
    expect(asFragment()).toMatchSnapshot()
  })
})
