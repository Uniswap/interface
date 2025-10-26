import { EmptyPools } from 'components/AccountDrawer/MiniPortfolio/Pools/EmptyPools'
import { render } from 'test-utils/render'

describe('EmptyPoolsModule', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(<EmptyPools />)
    expect(asFragment()).toMatchSnapshot()
  })
})
