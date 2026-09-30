import { TestID } from '@universe/test'
import { TokenCategoryClass, type TokenCategoryTopToken } from 'uniswap/src/features/tokenCategories/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import {
  CategoryDefinitionCard,
  type CategoryDefinitionCardLayout,
} from '~/components/CategoryDefinitionCard/CategoryDefinitionCard'
import { fireEvent, render, screen } from '~/test-utils/render'

function makeToken(symbol: string): TokenCategoryTopToken {
  return { chainId: 1, address: `0x${symbol}`, symbol, logoUrl: `https://logos.test/${symbol}.png` }
}

const stocks = tokenCategory({
  id: 'stocks',
  name: 'Stocks',
  description: 'Tokenized stocks from known issuers',
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
})

const noop = (): void => {}

describe.each<CategoryDefinitionCardLayout>(['popover', 'sheet'])('CategoryDefinitionCard (%s)', (layout) => {
  it('renders name, 24H change, description and the top-token logo pile', () => {
    render(<CategoryDefinitionCard category={stocks} layout={layout} onPress={noop} />)
    expect(screen.getByText('Stocks')).toBeInTheDocument()
    expect(screen.getByText('Tokenized stocks from known issuers')).toBeInTheDocument()
    expect(screen.getByText('4.07%')).toBeInTheDocument()
    expect(screen.getAllByTestId(TestID.TokenLogo)).toHaveLength(3)
  })

  it('omits the 24H change and logo pile when the category has no stats or top tokens', () => {
    const bare = tokenCategory({ id: 'gaming', name: 'Gaming', description: 'Games', topTokens: [] })
    render(<CategoryDefinitionCard category={bare} layout={layout} onPress={noop} />)
    expect(screen.getByText('Gaming')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.PortfolioRelativeChange)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenLogo)).not.toBeInTheDocument()
  })

  it('shows "Learn more" only for categories with a help article', () => {
    const { unmount } = render(
      <CategoryDefinitionCard category={tokenCategory({ id: 'gaming' })} layout={layout} onPress={noop} />,
    )
    expect(screen.queryByText('Learn more')).not.toBeInTheDocument()
    unmount()

    render(<CategoryDefinitionCard category={stocks} layout={layout} onPress={noop} />)
    expect(screen.getByText('Learn more')).toBeInTheDocument()
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
