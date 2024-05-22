import { ChainId } from 'wallet/src/constants/chains'
import { render } from 'wallet/src/test/test-utils'
import { InlineNetworkPill, NetworkPill } from './NetworkPill'

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
