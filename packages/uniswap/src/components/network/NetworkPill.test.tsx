import { InlineNetworkPill, NetworkPill } from 'uniswap/src/components/network/NetworkPill'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

describe(NetworkPill, () => {
  it('renders a NetworkPill without image', () => {
    const tree = render(<NetworkPill chainId={UniverseChainId.Mainnet} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders a NetworkPill with border', () => {
    const tree = render(<NetworkPill chainId={UniverseChainId.Mainnet} showBorder={true} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders an InlineNetworkPill', () => {
    const tree = render(<InlineNetworkPill chainId={UniverseChainId.Mainnet} />)
    expect(tree).toMatchSnapshot()
  })
})
