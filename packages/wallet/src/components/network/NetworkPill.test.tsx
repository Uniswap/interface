import { ChainId } from 'uniswap/src/types/chains'
import { InlineNetworkPill, NetworkPill } from 'wallet/src/components/network/NetworkPill'
import { render } from 'wallet/src/test/test-utils'

describe(NetworkPill, () => {
  it('renders a NetworkPill without image', () => {
    const tree = render(<NetworkPill chainId={ChainId.Goerli} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkPill with border', () => {
    const tree = render(<NetworkPill chainId={ChainId.Goerli} showBorder={true} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders an InlineNetworkPill', () => {
    const tree = render(<InlineNetworkPill chainId={ChainId.Goerli} />)
    expect(tree).toMatchSnapshot()
  })
})
