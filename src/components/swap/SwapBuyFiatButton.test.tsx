import { render } from 'test-utils'

import SwapBuyFiatButton from './SwapBuyFiatButton'

// TODO(lynnshaoyu): add detailed unit tests for critical flows of component.
describe('SwapBuyFiatButton.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(<SwapBuyFiatButton />)
    expect(asFragment()).toMatchSnapshot()
  })
})
