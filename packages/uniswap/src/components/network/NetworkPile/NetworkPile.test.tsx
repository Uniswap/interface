import { NetworkPile } from 'uniswap/src/components/network/NetworkPile/NetworkPile'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { render } from 'uniswap/src/test/test-utils'

describe(NetworkPile, () => {
  describe('default size', () => {
    it('renders empty when no chainIds provided', () => {
      const tree = render(<NetworkPile chainIds={[]} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders single logo', () => {
      const tree = render(<NetworkPile chainIds={[UniverseChainId.Mainnet]} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders double logos', () => {
      const tree = render(<NetworkPile chainIds={[UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne]} />)
      expect(tree).toMatchSnapshot()
    })

    it('renders triple logos', () => {
      const tree = render(
        <NetworkPile chainIds={[UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne, UniverseChainId.Optimism]} />,
      )
      expect(tree).toMatchSnapshot()
    })

    it('renders quad logos', () => {
      const tree = render(
        <NetworkPile
          chainIds={[
            UniverseChainId.Mainnet,
            UniverseChainId.ArbitrumOne,
            UniverseChainId.Optimism,
            UniverseChainId.Base,
          ]}
        />,
      )
      expect(tree).toMatchSnapshot()
    })

    it('caps at 4 logos when more than 4 chainIds provided', () => {
      const tree = render(
        <NetworkPile
          chainIds={[
            UniverseChainId.Mainnet,
            UniverseChainId.ArbitrumOne,
            UniverseChainId.Optimism,
            UniverseChainId.Base,
            UniverseChainId.Polygon, // 5th - should be ignored
            UniverseChainId.Bnb, // 6th - should be ignored
          ]}
        />,
      )
      expect(tree).toMatchSnapshot()
    })
  })

  describe('small size', () => {
    it('renders single logo', () => {
      const tree = render(<NetworkPile chainIds={[UniverseChainId.Mainnet]} size="small" />)
      expect(tree).toMatchSnapshot()
    })

    it('renders double logos', () => {
      const tree = render(
        <NetworkPile chainIds={[UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne]} size="small" />,
      )
      expect(tree).toMatchSnapshot()
    })

    it('renders triple logos', () => {
      const tree = render(
        <NetworkPile
          chainIds={[UniverseChainId.Mainnet, UniverseChainId.ArbitrumOne, UniverseChainId.Optimism]}
          size="small"
        />,
      )
      expect(tree).toMatchSnapshot()
    })

    it('renders quad logos', () => {
      const tree = render(
        <NetworkPile
          chainIds={[
            UniverseChainId.Mainnet,
            UniverseChainId.ArbitrumOne,
            UniverseChainId.Optimism,
            UniverseChainId.Base,
          ]}
          size="small"
        />,
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
