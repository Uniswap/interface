import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { mapRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/rankedRwaTestHelpers'
import type { IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { ExpandableParentAssetIdentity } from 'uniswap/src/features/expandableAsset/ExpandableParentAssetIdentity'
import { render } from 'uniswap/src/test/test-utils'

const ENABLED_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

function makeMultiIssuerAsset(): Rwa {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({
      symbol: 'TSLA',
      name: 'Tesla',
      issuerTokens: [
        {
          symbol: 'TSLAON',
          name: 'Tesla (Ondo)',
          issuer: 'ondo',
          priceUsd: 248.42,
          volume24hUsd: 8_000_000,
          chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xondo1' }],
        },
        {
          symbol: 'TSLAb',
          name: 'Tesla (Backed)',
          issuer: 'backed',
          priceUsd: 247.9,
          volume24hUsd: 3_000_000,
          chainTokens: [{ chainId: UniverseChainId.Base, address: '0xbacked1' }],
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

// Multi-issuer RWA whose group ticker (`symbol`) differs from its display `name`, so we can assert the search
// group header shows the asset name + issuer count and never the ticker.
function teslaRwa(): Rwa {
  const issuer = (slug: string): IssuerToken => ({
    symbol: `T-${slug}`,
    name: `Tesla (${slug})`,
    logoUrl: '',
    issuer: slug,
    priceUsd: 1,
    volume24hUsd: 1,
    sparkline1d: { points: [] },
    chainTokens: [{ chainId: 1, address: `0x${slug}` }],
  })
  return {
    symbol: 'TSLA',
    name: 'Tesla',
    logoUrl: '',
    priceUsd: 1,
    volume24hUsd: 1,
    sparkline1d: { points: [] },
    issuerTokens: [issuer('ondo'), issuer('xstocks'), issuer('dinari')],
  }
}

describe('ExpandableParentAssetIdentity table subline', () => {
  it('shows token count on collapsed expandable rows without TradFi ticker subline', () => {
    const asset = makeMultiIssuerAsset()
    const { getByText, queryByText } = render(
      <ExpandableParentAssetIdentity
        asset={asset}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded={false}
        variant="table"
      />,
    )

    expect(getByText('Tesla')).toBeTruthy()
    expect(queryByText('TSLA')).toBeNull()
    expect(getByText('explore.rwa.issuerTokenCount')).toBeTruthy()
  })

  it('shows token count on expanded expandable rows without TradFi ticker subline', () => {
    const asset = makeMultiIssuerAsset()
    const { getByText, queryByText } = render(
      <ExpandableParentAssetIdentity
        asset={asset}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded
        variant="table"
      />,
    )

    expect(getByText('Tesla')).toBeTruthy()
    expect(queryByText('TSLA')).toBeNull()
    expect(getByText('explore.rwa.issuerTokenCount')).toBeTruthy()
  })

  it('shows token count for non-expandable table rows', () => {
    const asset = makeMultiIssuerAsset()
    const { queryByText, getByText } = render(
      <ExpandableParentAssetIdentity
        asset={asset}
        enabledChainIds={ENABLED_CHAINS}
        canExpand={false}
        variant="table"
      />,
    )

    expect(queryByText('TSLA')).toBeNull()
    expect(getByText('explore.rwa.issuerTokenCount')).toBeTruthy()
  })
})

describe('ExpandableParentAssetIdentity network badge', () => {
  it.each(['table', 'search'] as const)('shows no badge without a network filter (%s)', (variant) => {
    const { queryByTestId } = render(
      <ExpandableParentAssetIdentity
        asset={makeMultiIssuerAsset()}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded={false}
        variant={variant}
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.Mainnet}`)).toBeNull()
    expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).toBeNull()
  })

  it.each(['table', 'search'] as const)(
    'badges the filtered chain when an issuer is deployed there (%s)',
    (variant) => {
      const { queryByTestId } = render(
        <ExpandableParentAssetIdentity
          asset={makeMultiIssuerAsset()}
          enabledChainIds={ENABLED_CHAINS}
          canExpand
          isExpanded={false}
          variant={variant}
          chainFilter={UniverseChainId.Base}
        />,
      )
      expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).not.toBeNull()
      expect(queryByTestId(`network-logo-${UniverseChainId.Mainnet}`)).toBeNull()
    },
  )

  it('shows no badge when no issuer is deployed on the filtered chain', () => {
    const { queryByTestId } = render(
      <ExpandableParentAssetIdentity
        asset={makeMultiIssuerAsset()}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded={false}
        variant="search"
        chainFilter={UniverseChainId.ArbitrumOne}
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.ArbitrumOne}`)).toBeNull()
  })

  it('shows no badge when the filtered chain is not enabled', () => {
    const { queryByTestId } = render(
      <ExpandableParentAssetIdentity
        asset={makeMultiIssuerAsset()}
        enabledChainIds={[UniverseChainId.Mainnet]}
        canExpand
        isExpanded={false}
        variant="search"
        chainFilter={UniverseChainId.Base}
      />,
    )
    expect(queryByTestId(`network-logo-${UniverseChainId.Base}`)).toBeNull()
  })
})

// Guards the Figma behavior: the search group header subline carries the issuer count, never the group ticker.
// Reverting the subline to `asset.symbol` would surface "TSLA" here and fail. (The count itself renders via the
// `explore.rwa.issuerTokenCount` plural key, which the test i18n leaves unresolved — hence we assert on the
// name/ticker, which are stable across both states.)
describe('ExpandableParentAssetIdentity search group header', () => {
  it('shows the asset name and not the group ticker when collapsed', () => {
    const { queryByText } = render(
      <ExpandableParentAssetIdentity
        asset={teslaRwa()}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded={false}
        variant="search"
      />,
    )
    expect(queryByText('Tesla')).not.toBeNull()
    expect(queryByText('TSLA')).toBeNull()
  })

  it('shows the asset name and not the group ticker when expanded', () => {
    const { queryByText } = render(
      <ExpandableParentAssetIdentity
        asset={teslaRwa()}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded
        variant="search"
      />,
    )
    expect(queryByText('Tesla')).not.toBeNull()
    expect(queryByText('TSLA')).toBeNull()
  })

  it('renders the category tag beside the name and the issuer token count by default', () => {
    const { getByText, getByTestId, queryByText } = render(
      <ExpandableParentAssetIdentity
        asset={teslaRwa()}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded={false}
        variant="search"
        categoryTag={<Flex testID="category-tag" />}
      />,
    )
    expect(getByTestId('category-tag')).toBeTruthy()
    expect(getByText('explore.rwa.issuerTokenCount')).toBeTruthy()
    expect(queryByText('explore.tokens.table.networks')).toBeNull()
  })

  it('labels the subline with the distinct network count when showNetworkCount is set', () => {
    const { getByText, queryByText } = render(
      <ExpandableParentAssetIdentity
        asset={makeMultiIssuerAsset()}
        enabledChainIds={ENABLED_CHAINS}
        canExpand
        isExpanded={false}
        variant="search"
        showNetworkCount
      />,
    )
    expect(getByText('explore.tokens.table.networks')).toBeTruthy()
    expect(queryByText('explore.rwa.issuerTokenCount')).toBeNull()
  })
})
