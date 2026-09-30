import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { mapRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/rankedRwaTestHelpers'
import type { ChainToken, IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { ExpandableIssuerIdentity } from 'uniswap/src/features/expandableAsset/ExpandableIssuerIdentity'
import { render } from 'uniswap/src/test/test-utils'

const { mockUseIsTokenCategoriesEnabled } = vi.hoisted(() => ({ mockUseIsTokenCategoriesEnabled: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useIsTokenCategoriesEnabled: mockUseIsTokenCategoriesEnabled,
}))

beforeEach(() => {
  mockUseIsTokenCategoriesEnabled.mockReturnValue(false)
})

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

// Single-issuer Rwa whose sole issuer spans the given chains (non-mainnet, so assertions don't depend on the
// mainnet-badge flag).
function rwaWithIssuerChains(
  chainTokens: ChainToken[],
  issuerOverrides?: Partial<Pick<IssuerToken, 'name' | 'issuer' | 'symbol'>>,
): Rwa {
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
          ...issuerOverrides,
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

  it('uses issuer token name as primary text for flat single-issuer table rows', () => {
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }], {
      name: 'Nvidia Ondo',
      issuer: 'ondo',
    })
    const issuer = rwa.issuerTokens[0]!
    const { getByText, queryByText } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={issuer}
        enabledChainIds={ENABLED_CHAINS}
        variant="table"
        useIssuerNameAsPrimary
      />,
    )
    expect(getByText(issuer.name)).toBeTruthy()
    expect(queryByText(rwa.name)).toBeNull()
  })

  it('strips the issuer brand suffix from the primary text of flat single-issuer table rows', () => {
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }], {
      symbol: 'NVDAR',
      name: 'NVIDIA • Robinhood Token',
      issuer: 'robinhood',
    })
    const { getByText, queryByText } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="table"
        useIssuerNameAsPrimary
      />,
    )
    expect(getByText('NVIDIA')).toBeTruthy()
    expect(getByText('Robinhood')).toBeTruthy()
    expect(queryByText('NVIDIA • Robinhood Token')).toBeNull()
  })

  it('shows the issuer token name unmodified on flat rows when token categories are on', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }], {
      name: 'NVIDIA • Robinhood Token',
      issuer: 'robinhood',
    })
    const { getByText, queryByText } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="table"
        useIssuerNameAsPrimary
      />,
    )
    expect(getByText('NVIDIA • Robinhood Token')).toBeTruthy()
    expect(queryByText('NVIDIA')).toBeNull()
    expect(queryByText(rwa.name)).toBeNull()
  })

  it('shows the issuer token name instead of the group name on expanded rows when token categories are on', () => {
    mockUseIsTokenCategoriesEnabled.mockReturnValue(true)
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }], {
      name: 'Tesla (Ondo)',
      issuer: 'ondo',
    })
    const { getByText, queryByText } = render(
      <ExpandableIssuerIdentity asset={rwa} issuer={rwa.issuerTokens[0]!} enabledChainIds={ENABLED_CHAINS} />,
    )
    expect(getByText('Tesla (Ondo)')).toBeTruthy()
    expect(queryByText(rwa.name)).toBeNull()
  })

  it('prefers the BE issuer display name over the formatted slug when served', () => {
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }], { issuer: 'xstocks' })
    const issuer = { ...rwa.issuerTokens[0]!, issuerDisplayName: 'xStocks (Backed Finance)' }
    const { getByText, queryByText } = render(
      <ExpandableIssuerIdentity asset={rwa} issuer={issuer} enabledChainIds={ENABLED_CHAINS} />,
    )
    expect(getByText('xStocks (Backed Finance)')).toBeTruthy()
    expect(queryByText('xStocks')).toBeNull()
  })

  it('keeps the grouped asset name when the issuer name is not primary', () => {
    const rwa = rwaWithIssuerChains([{ chainId: UniverseChainId.Base, address: '0xbase' }], {
      name: 'NVIDIA • Robinhood Token',
      issuer: 'robinhood',
    })
    const { getByText, queryByText } = render(
      <ExpandableIssuerIdentity asset={rwa} issuer={rwa.issuerTokens[0]!} enabledChainIds={ENABLED_CHAINS} />,
    )
    expect(getByText(rwa.name)).toBeTruthy()
    expect(queryByText('NVIDIA')).toBeNull()
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
        chainFilter={UniverseChainId.Base}
      />,
    )
    // Filtered-chain badge on the thumbnail plus NetworkIconList in the hover subline.
    expect(queryAllByTestId(`network-logo-${UniverseChainId.Base}`)).toHaveLength(2)
    expect(queryAllByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`)).toHaveLength(1)
  })

  it('badges the filtered chain rather than the mainnet-first chain when a network filter is active', () => {
    const rwa = rwaWithIssuerChains([
      { chainId: UniverseChainId.Mainnet, address: '0xeth' },
      { chainId: UniverseChainId.Base, address: '0xbase' },
    ])
    const { queryAllByTestId } = render(
      <ExpandableIssuerIdentity
        asset={rwa}
        issuer={rwa.issuerTokens[0]!}
        enabledChainIds={ENABLED_CHAINS}
        variant="table"
        chainFilter={UniverseChainId.Base}
      />,
    )
    expect(queryAllByTestId(`network-logo-${UniverseChainId.Base}`)).toHaveLength(2)
    expect(queryAllByTestId(`network-logo-${UniverseChainId.Mainnet}`)).toHaveLength(1)
  })

  it('shows the filtered-chain badge for a multi-network issuer in search when a network filter is active', () => {
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
        chainFilter={UniverseChainId.ArbitrumOne}
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`)).not.toBeNull()
    expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).toBeNull()
  })

  it('keeps the multi-network badge hidden when the filtered chain has no deployment for this issuer', () => {
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
        chainFilter={UniverseChainId.Mainnet}
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.Mainnet}`)).toBeNull()
    expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).toBeNull()
    expect(queryByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`)).toBeNull()
  })
})
