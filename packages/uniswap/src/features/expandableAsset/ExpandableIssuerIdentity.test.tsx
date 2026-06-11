import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import type { ChainToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ExpandableIssuerIdentity } from 'uniswap/src/features/expandableAsset/ExpandableIssuerIdentity'
import { render } from 'uniswap/src/test/test-utils'

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

// Single-issuer Rwa whose sole issuer spans the given chains (non-mainnet, so assertions don't depend on the
// mainnet-badge flag).
function rwaWithIssuerChains(chainTokens: ChainToken[]): Rwa {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({
      issuerTokens: [
        {
          symbol: 'TSLAX',
          name: 'Tesla (xStocks)',
          logoUrl: '',
          issuer: 'xstocks',
          priceUsd: 1,
          volume24hUsd: 1,
          marketCapUsd: 1,
          chainTokens,
        },
      ],
    }),
    category: RwaCategory.STOCKS,
  })
  if (!rwa) {
    throw new Error('failed to build Rwa test fixture')
  }
  return rwa
}

describe('ExpandableIssuerIdentity network badge', () => {
  it('hides the network badge for a multi-network issuer in search (the "N networks" subtitle stands alone)', () => {
    const rwa = rwaWithIssuerChains([
      { chainId: UniverseChainId.Base, address: '0xbase' },
      { chainId: UniverseChainId.ArbitrumOne, address: '0xarb' },
    ])
    const { queryByTestId } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="search"
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).toBeNull()
    expect(queryByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`)).toBeNull()
  })

  it('shows the network badge for a single-network issuer in search', () => {
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }])
    const { queryByTestId } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="search"
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).not.toBeNull()
  })

  // A single-chain table row renders no NetworkIconList, so the only network-logo present is the badge.
  it('keeps the network badge in the Explore table for a single-network issuer', () => {
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }])
    const { queryByTestId } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="table"
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).not.toBeNull()
  })

  // A multi-network table row always renders NetworkIconList (hover slide content), so each chain's
  // logo appears exactly once from the list; a thumbnail badge would add a second instance.
  it('hides the network badge for a multi-network issuer in the Explore table when no network filter is active', () => {
    const rwa = rwaWithIssuerChains([
      { chainId: UniverseChainId.Base, address: '0xbase' },
      { chainId: UniverseChainId.ArbitrumOne, address: '0xarb' },
    ])
    const { queryAllByTestId } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="table"
      />,
    )
    expect(queryAllByTestId(`network-logo-${UniverseChainId.Base}`)).toHaveLength(1)
    expect(queryAllByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`)).toHaveLength(1)
  })

  it('shows the network badge for a multi-network issuer in the Explore table when a network filter is active', () => {
    const rwa = rwaWithIssuerChains([
      { chainId: UniverseChainId.Base, address: '0xbase' },
      { chainId: UniverseChainId.ArbitrumOne, address: '0xarb' },
    ])
    const { queryAllByTestId } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="table"
        hasNetworkFilter
      />,
    )
    // Primary-chain badge on the thumbnail plus NetworkIconList in the hover subline.
    expect(queryAllByTestId(`network-logo-${UniverseChainId.Base}`)).toHaveLength(2)
    expect(queryAllByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`)).toHaveLength(1)
  })
})
