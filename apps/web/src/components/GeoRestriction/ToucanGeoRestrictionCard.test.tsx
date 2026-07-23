import { fireEvent } from '@testing-library/react'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'
import { ToucanGeoRestrictionCard } from '~/components/GeoRestriction/ToucanGeoRestrictionCard'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/utils/linking', () => ({
  openUri: vi.fn(),
}))

describe('ToucanGeoRestrictionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the symbol-interpolated description', () => {
    render(<ToucanGeoRestrictionCard tokenSymbol="KALSHI" />)
    expect(
      screen.getByText('KALSHI is not tradable in some regions. Bypassing this restriction is prohibited.'),
    ).toBeInTheDocument()
  })

  it('falls back to the generic description when no symbol', () => {
    render(<ToucanGeoRestrictionCard />)
    expect(
      screen.getByText('This token is not tradable in some regions. Bypassing this restriction is prohibited.'),
    ).toBeInTheDocument()
  })

  it('opens the geo-restriction help article on press', () => {
    render(<ToucanGeoRestrictionCard tokenSymbol="KALSHI" />)
    fireEvent.click(screen.getByTestId(TestID.ToucanGeoRestrictionCard))
    expect(openUri).toHaveBeenCalledWith({ uri: UniswapHelpUrls.articles.geoRestriction })
  })
})
