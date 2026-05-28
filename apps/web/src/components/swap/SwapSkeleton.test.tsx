import { SwapSkeleton } from 'components/swap/SwapSkeleton'
import { render } from 'test-utils/render'

describe('SwapSkeleton.tsx', () => {
  it('renders a skeleton', () => {
    const { asFragment } = render(<SwapSkeleton />)
    expect(asFragment()).toMatchSnapshot()
  })
})
