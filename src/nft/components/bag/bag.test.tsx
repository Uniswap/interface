import { render } from 'test-utils/render'

import Bag from './Bag'

describe('Bag.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(<Bag />)
    expect(asFragment()).toMatchSnapshot()
  })
})
