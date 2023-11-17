import { render } from 'test-utils/render'

import Bag from './Bag'

describe('Bag.tsx', () => {
  it('matches base snapshot', () => {
    // todo: remove once zustand usage has been update such that `shallow` is no longer used
    jest.spyOn(console, 'warn').mockImplementation(jest.fn)
    const { asFragment } = render(<Bag />)
    expect(asFragment()).toMatchSnapshot()
  })
})
