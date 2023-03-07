import { render } from 'test-utils'

import Bag from './Bag'

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    useWeb3React: () => ({
      account: '0x52270d8234b864dcAC9947f510CE9275A8a116Db',
      isActive: true,
    }),
    ...web3React,
  }
})

describe('Bag.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(<Bag />)
    expect(asFragment()).toMatchSnapshot()
  })
})
