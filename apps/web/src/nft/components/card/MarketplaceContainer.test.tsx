import { Markets } from 'nft/types'
import { render } from 'test-utils/render'

import { MarketplaceContainer } from './icons'

describe('MarketplaceContainer', () => {
  it('should render with list price', () => {
    const result = render(<MarketplaceContainer isSelected={false} listedPrice="10" />)
    expect(result.queryByText('10 ETH')).toBeTruthy()
    expect(result.container).toMatchSnapshot()
  })

  it('should render null without list price or marketplace', () => {
    const result = render(<MarketplaceContainer isSelected={false} listedPrice="10" hidePrice={true} />)
    expect(result.queryByText('10 ETH')).toBeFalsy()
    expect(result.container.children.length).toEqual(0)
    expect(result.container).toMatchSnapshot()
  })

  it('should render with marketplace', () => {
    const result = render(<MarketplaceContainer isSelected={false} marketplace={Markets.Opensea} />)
    expect(result.container).toMatchSnapshot()
  })
})
