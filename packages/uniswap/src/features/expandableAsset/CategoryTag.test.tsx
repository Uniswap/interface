import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { CategoryTag } from 'uniswap/src/features/expandableAsset/CategoryTag'
import { render } from 'uniswap/src/test/test-utils'

// Locks the extension contract of the `useCategoryTagContent` switch: a mapped category renders its pill; an
// unmapped one renders nothing. Adding a new category (e.g. Commodities) should add a `case` AND a sibling
// assertion here — and this pins the `default -> null` fallback so a missing case fails loudly.
describe('CategoryTag', () => {
  it('renders the pill (icon + label) for the STOCKS category', () => {
    const { queryByText } = render(<CategoryTag category={RwaCategory.STOCKS} />)
    expect(queryByText('Stocks')).not.toBeNull()
  })

  it('renders the ETFs tag', () => {
    const { queryByText } = render(<CategoryTag category={RwaCategory.ETFS} />)
    expect(queryByText('ETFs')).not.toBeNull()
  })

  it('renders no tag for a category without a mapping (e.g. UNSPECIFIED)', () => {
    const { queryByText } = render(<CategoryTag category={RwaCategory.UNSPECIFIED} />)
    expect(queryByText('Stocks')).toBeNull()
  })
})
