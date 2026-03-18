import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

describe(NetworkIconList, () => {
  it('renders empty when no chainIds provided', () => {
    const tree = render(<NetworkIconList chainIds={[]} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders single network logo', () => {
    const tree = render(<NetworkIconList chainIds={[UniverseChainId.Mainnet]} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders stacked network logos', () => {
    const tree = render(
      <NetworkIconList chainIds={[UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne, UniverseChainId.Optimism]} />,
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders multiple network logos in list', () => {
    const tree = render(<NetworkIconList chainIds={[UniverseChainId.Mainnet, UniverseChainId.Polygon]} />)
    expect(tree).toMatchSnapshot()
  })
})
