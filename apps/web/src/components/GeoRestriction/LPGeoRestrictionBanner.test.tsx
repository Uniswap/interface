import { fireEvent } from '@testing-library/react'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { openUri } from 'uniswap/src/utils/linking'
import { LPGeoRestrictionBanner } from '~/components/GeoRestriction/LPGeoRestrictionBanner'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/utils/linking', () => ({
  openUri: vi.fn(),
}))

describe('LPGeoRestrictionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('names the token and the liquidity-provision restriction', () => {
    render(<LPGeoRestrictionBanner tokenSymbol="AAPLX" />)

    expect(screen.getByText('AAPLX isn’t available for liquidity provision in your region')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Providing liquidity with this token isn’t available to persons located in your region. Bypassing this restriction is prohibited.',
      ),
    ).toBeInTheDocument()
  })

  it('falls back to the generic heading when no symbol is known', () => {
    render(<LPGeoRestrictionBanner />)

    expect(screen.getByText('This token isn’t available for liquidity provision in your region')).toBeInTheDocument()
  })

  // There is no attestation or verification path out of a region block, unlike permissioned pools,
  // so the banner must never imply one.
  it('offers no identity-verification path', () => {
    render(<LPGeoRestrictionBanner tokenSymbol="AAPLX" />)

    expect(screen.queryByText(/verify/i)).toBeNull()
    expect(screen.queryByText(/identity/i)).toBeNull()
  })

  it('opens the geo-restriction help article on press', () => {
    render(<LPGeoRestrictionBanner tokenSymbol="AAPLX" />)

    fireEvent.click(screen.getByTestId(TestID.LPGeoRestrictionBanner))
    expect(openUri).toHaveBeenCalledWith({ uri: UniswapHelpUrls.articles.geoRestriction })
  })
})
