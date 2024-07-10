import { InlineNetworkPill, NetworkPill } from 'uniswap/src/components/network/NetworkPill'
import { render } from 'uniswap/src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/types/chains'

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
