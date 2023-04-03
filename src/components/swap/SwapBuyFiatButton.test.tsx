import { render } from 'test-utils'

import SwapBuyFiatButton from './SwapBuyFiatButton'

describe('SwapBuyFiatButton.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(<SwapBuyFiatButton />)
    expect(asFragment()).toMatchSnapshot()
  })
})
