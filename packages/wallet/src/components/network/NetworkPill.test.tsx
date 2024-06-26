import { UniverseChainId } from 'uniswap/src/types/chains'
import { InlineNetworkPill, NetworkPill } from 'wallet/src/components/network/NetworkPill'
import { render } from 'wallet/src/test/test-utils'

describe(NetworkPill, () => {
  it('renders a NetworkPill without image', () => {
    const tree = render(<NetworkPill chainId={UniverseChainId.Goerli} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkPill with border', () => {
    const tree = render(<NetworkPill chainId={UniverseChainId.Goerli} showBorder={true} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders an InlineNetworkPill', () => {
    const tree = render(<InlineNetworkPill chainId={UniverseChainId.Goerli} />)
    expect(tree).toMatchSnapshot()
  })
})
