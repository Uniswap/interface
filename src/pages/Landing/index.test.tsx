import { useShouldDisableNFTRoutes } from 'hooks/useShouldDisableNFTRoutes'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import Landing from '.'

jest.mock('hooks/useShouldDisableNFTRoutes')

describe('disable nft on landing page', () => {
  it('renders nft information and card', () => {
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('NFTs')
  })
  it('does not render nft information and card', () => {
    mocked(useShouldDisableNFTRoutes).mockReturnValue(true)
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
  })
})
