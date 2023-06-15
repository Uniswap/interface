import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

import Landing from '.'

jest.mock('hooks/useDisableNFTRoutes')

describe('disable nft on landing page', () => {
  it('renders nft information and card', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(false)
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('NFTs')
  })
  it('does not render nft information and card', () => {
    mocked(useDisableNFTRoutes).mockReturnValue(true)
    const { container } = render(<Landing />)
    expect(container).toMatchSnapshot()
  })
})
