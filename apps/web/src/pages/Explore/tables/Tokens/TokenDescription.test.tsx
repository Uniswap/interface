import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { TokenDescription } from '~/pages/Explore/tables/Tokens/TokenDescription'
import { render, screen, within } from '~/test-utils/render'

const USDC_OPTIMISM = '0x0b2c639c533813f4aa9d7837caf62653d097ff85'
const SHORTENED_USDC_OPTIMISM = '0x0b2C...Ff85'
const MULTICHAIN_CHAIN_IDS = [UniverseChainId.Optimism, UniverseChainId.Mainnet, UniverseChainId.Base]

const stocks = tokenCategory({ id: 'stocks', name: 'Stocks', categoryClass: TokenCategoryClass.Asset })
const defi = tokenCategory({ id: 'defi', name: 'DeFi', categoryClass: TokenCategoryClass.Sector })
/** Canonical (ListCategories) order: defi before stocks, so a row that shows Stocks first is following categoryIds. */
const knownCategories = new Map([defi, stocks].map((category) => [category.id, category]))

vi.mock('uniswap/src/features/rwa/useRWAIssuerLogoUrl', () => ({
  useRWAIssuerLogoUrl: () => undefined,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useResolveTokenCategories', () => ({
  useResolveTokenCategories: ({ categoryIds }: { categoryIds?: string[] }) => ({
    categories: [...knownCategories.values()].filter((category) => categoryIds?.includes(category.id)),
    isLoading: false,
  }),
}))

/** The hover content's NetworkIconList uses the same testIDs, so badge queries must be scoped to the logo. */
function queryNetworkBadge(chainId: UniverseChainId): HTMLElement | null {
  return within(screen.getByTestId('token-logo')).queryByTestId(`network-logo-${chainId}`)
}

describe('TokenDescription', () => {
  it('hides the network badge and offers the networks hover for a multichain token on the unfiltered page', () => {
    render(
      <TokenDescription
        name="USD Coin"
        symbol="USDC"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        chainIdsByVolume={MULTICHAIN_CHAIN_IDS}
      />,
    )

    expect(queryNetworkBadge(UniverseChainId.Optimism)).toBeNull()
    expect(screen.getByText('3 networks')).toBeInTheDocument()
    expect(screen.queryByText(SHORTENED_USDC_OPTIMISM)).toBeNull()
  })

  it('shows the filtered chain badge and the copy-address hover for a multichain token when filtered by chain', () => {
    render(
      <TokenDescription
        name="USD Coin"
        symbol="USDC"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        chainIdsByVolume={MULTICHAIN_CHAIN_IDS}
        chainFilterId={UniverseChainId.Optimism}
      />,
    )

    expect(queryNetworkBadge(UniverseChainId.Optimism)).toBeInTheDocument()
    expect(screen.getByText(SHORTENED_USDC_OPTIMISM)).toBeInTheDocument()
    expect(screen.queryByText('3 networks')).toBeNull()
  })

  it('keeps the network badge and copy-address hover for a single-network token', () => {
    render(
      <TokenDescription
        name="USD Coin"
        symbol="USDC"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        chainIdsByVolume={[UniverseChainId.Optimism]}
      />,
    )

    expect(queryNetworkBadge(UniverseChainId.Optimism)).toBeInTheDocument()
    expect(screen.getByText(SHORTENED_USDC_OPTIMISM)).toBeInTheDocument()
  })

  it('omits the address hover for a native token when filtered by chain', () => {
    render(
      <TokenDescription
        name="Ethereum"
        symbol="ETH"
        address={NATIVE_CHAIN_ID}
        chainId={UniverseChainId.Optimism}
        chainIdsByVolume={MULTICHAIN_CHAIN_IDS}
        chainFilterId={UniverseChainId.Optimism}
      />,
    )

    expect(queryNetworkBadge(UniverseChainId.Optimism)).toBeInTheDocument()
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.queryByText('3 networks')).toBeNull()
  })

  it('renders the first category tag next to the name on an unscoped table', () => {
    render(
      <TokenDescription
        name="Tesla"
        symbol="TSLAon"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        categoryIds={['stocks', 'defi']}
      />,
    )

    expect(screen.getByTestId(TestID.TokenRowCategoryTag)).toBeInTheDocument()
    expect(screen.getByText('Stocks')).toBeInTheDocument()
    expect(screen.queryByText('DeFi')).toBeNull()
  })

  it('suppresses the scoped category and falls through to the next one', () => {
    render(
      <TokenDescription
        name="Tesla"
        symbol="TSLAon"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        categoryIds={['stocks', 'defi']}
        scopedCategoryId="stocks"
      />,
    )

    expect(screen.getByText('DeFi')).toBeInTheDocument()
    expect(screen.queryByText('Stocks')).toBeNull()
  })

  it('renders no tag when the scoped category is the only one', () => {
    render(
      <TokenDescription
        name="Tesla"
        symbol="TSLAon"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        categoryIds={['stocks']}
        scopedCategoryId="stocks"
      />,
    )

    expect(screen.queryByTestId(TestID.TokenRowCategoryTag)).toBeNull()
  })

  it('renders the issuer tag before the category tag', () => {
    render(
      <TokenDescription
        name="Tesla"
        symbol="TSLAon"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        categoryIds={['stocks']}
        issuer="ondo"
      />,
    )

    expect(screen.getByTestId(TestID.TokenName)).toHaveTextContent('Tesla')
    const issuerTag = screen.getByTestId(TestID.TokenRowIssuerTag)
    expect(issuerTag).toHaveTextContent('Ondo')
    expect(issuerTag.compareDocumentPosition(screen.getByTestId(TestID.TokenRowCategoryTag))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('renders no issuer tag for a token that is not an issuer token', () => {
    render(
      <TokenDescription
        name="USD Coin"
        symbol="USDC"
        address={USDC_OPTIMISM}
        chainId={UniverseChainId.Optimism}
        categoryIds={['stocks']}
      />,
    )

    expect(screen.queryByTestId(TestID.TokenRowIssuerTag)).toBeNull()
  })

  it('renders no tag for a token without categories', () => {
    render(
      <TokenDescription name="USD Coin" symbol="USDC" address={USDC_OPTIMISM} chainId={UniverseChainId.Optimism} />,
    )

    expect(screen.queryByTestId(TestID.TokenRowCategoryTag)).toBeNull()
  })
})
