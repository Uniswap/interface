import { render } from 'test-utils/render'

import { SwapSkeleton } from './SwapSkeleton'

describe('SwapSkeleton.tsx', () => {
  it('renders a skeleton', () => {
    const { asFragment } = render(<SwapSkeleton />)
    expect(asFragment()).toMatchSnapshot()
  })
})
