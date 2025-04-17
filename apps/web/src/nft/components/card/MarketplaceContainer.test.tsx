import { MarketplaceContainer } from 'nft/components/card/icons'
import { Markets } from 'nft/types'
import { act, render } from 'test-utils/render'

describe('MarketplaceContainer', () => {
  it('should render with list price', () => {
    const result = render(<MarketplaceContainer isSelected={false} listedPrice="10" />)
    expect(result.queryByText('10 ETH')).toBeTruthy()
    expect(result.container).toMatchSnapshot()
  })

  it('should render null without list price or marketplace', () => {
    const result = render(<MarketplaceContainer isSelected={false} listedPrice="10" hidePrice={true} />)
    expect(result.queryByText('10 ETH')).toBeFalsy()
    expect(result.container.children.length).toEqual(1)
    expect(result.container).toMatchSnapshot()
  })

  it('should render with marketplace', async () => {
    const result = await act(() => {
      return render(<MarketplaceContainer isSelected={false} marketplace={Markets.Opensea} />)
    })
    expect(result.container).toMatchSnapshot()
  })
})
