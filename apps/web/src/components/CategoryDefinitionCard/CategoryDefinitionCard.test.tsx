import { TestID } from '@universe/test'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import {
  TokenCategoryClass,
  type TokenCategoryTopGroup,
  type TokenCategoryTopToken,
} from 'uniswap/src/features/tokenCategories/types'
import { poolCategory, poolCategoryTopPool } from 'uniswap/src/test/fixtures/poolCategory'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { noop } from 'utilities/src/react/noop'
import {
  CategoryDefinitionCard,
  type CategoryDefinitionCardLayout,
} from '~/components/CategoryDefinitionCard/CategoryDefinitionCard'
import { fireEvent, render, screen } from '~/test-utils/render'

function makeToken(symbol: string): TokenCategoryTopToken {
  return { chainId: 1, address: `0x${symbol}`, symbol, logoUrl: `https://logos.test/${symbol}.png` }
}

/** No logo url, so the pile renders the ticker as fallback text the test can find. */
function makeGroup(ticker: string): TokenCategoryTopGroup {
  return { id: ticker.toLowerCase(), displayName: ticker, ticker, logoUrl: '' }
}

const stocks = tokenCategory({
  id: 'stocks',
  name: 'Stocks',
  description: 'Tokenized stocks from known issuers',
  kind: 'token',
  categoryClass: TokenCategoryClass.Asset,
  grouped: false,
  stats: {
    tokenCount: 42,
    priceChange24hPct: 4.07,
    volume1h: 0,
    volume1d: 0,
    volume1w: 0,
    volume1m: 0,
    volume1y: 0,
  },
  topTokens: [makeToken('TSLA'), makeToken('AAPL'), makeToken('NVDA')],
  topGroups: [],
})

describe.each<CategoryDefinitionCardLayout>(['popover', 'sheet'])('CategoryDefinitionCard (%s)', (layout) => {
  it('renders name, 24H change, description and the top-token logo pile', () => {
    render(<CategoryDefinitionCard category={stocks} layout={layout} onPress={noop} />)
    expect(screen.getByText('Stocks')).toBeInTheDocument()
    expect(screen.getByText('Tokenized stocks from known issuers')).toBeInTheDocument()
    expect(screen.getByText('4.07%')).toBeInTheDocument()
    expect(screen.getAllByTestId(TestID.TokenLogo)).toHaveLength(3)
  })

  it('piles the top groups over the top tokens when the backend serves them', () => {
    const etfs = tokenCategory({
      ...stocks,
      id: 'etfs',
      grouped: true,
      topGroups: [makeGroup('SPY'), makeGroup('GLD'), makeGroup('QQQ')],
    })
    render(<CategoryDefinitionCard category={etfs} layout={layout} onPress={noop} />)
    expect(screen.getAllByTestId(TestID.TokenLogo)).toHaveLength(3)
    expect(screen.getByText('SPY')).toBeInTheDocument()
    expect(screen.queryByText('TSLA')).not.toBeInTheDocument()
  })

  it('omits the 24H change and logo pile when the category has no stats or top tokens', () => {
    const bare = tokenCategory({ id: 'gaming', name: 'Gaming', description: 'Games', topTokens: [] })
    render(<CategoryDefinitionCard category={bare} layout={layout} onPress={noop} />)
    expect(screen.getByText('Gaming')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioRelativeChange)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenLogo)).not.toBeInTheDocument()
  })

  it('shows 1D volume and the top-pool pair pile for a pool category, with no price change', () => {
    const correlated = poolCategory({
      id: 'correlated',
      name: 'Correlated',
      description: 'Pairs that move together',
      stats: {
        poolCount: 180,
        tvl: 0,
        volume1d: 2_230_000_000,
        volume1w: 0,
        volume1m: 0,
        fees1d: 0,
        tvlChange24hPct: 0.5,
      },
      topPools: [
        poolCategoryTopPool({ token0Symbol: 'wstETH', token1Symbol: 'ETH', token0LogoUrl: '', token1LogoUrl: '' }),
      ],
    })
    render(<CategoryDefinitionCard category={correlated} layout={layout} onPress={noop} />)
    expect(screen.getByText('Correlated')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.CategoryDefinitionVolume)).toHaveTextContent('$2.2B 1D vol')
    expect(screen.queryByTestId(TestID.PortfolioRelativeChange)).not.toBeInTheDocument()
    expect(screen.getByTestId('input-currency-logo-container')).toBeInTheDocument()
  })

  it('links "Learn more" to the category definitions article', () => {
    render(<CategoryDefinitionCard category={tokenCategory({ id: 'gaming' })} layout={layout} onPress={noop} />)
    expect(screen.getByText('Learn more').closest('a')).toHaveAttribute(
      'href',
      UniswapHelpUrls.articles.tokenCategoryDefinitions,
    )
  })

  it('does not press the card when "Learn more" is clicked', () => {
    const onPress = vi.fn()
    render(<CategoryDefinitionCard category={stocks} layout={layout} onPress={onPress} />)
    fireEvent.click(screen.getByText('Learn more'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('fires onPress for a click on the card body', () => {
    const onPress = vi.fn()
    render(
      <CategoryDefinitionCard
        category={stocks}
        layout={layout}
        testID={TestID.CategoryDefinitionCard}
        onPress={onPress}
      />,
    )
    fireEvent.click(screen.getByTestId(TestID.CategoryDefinitionCard))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
