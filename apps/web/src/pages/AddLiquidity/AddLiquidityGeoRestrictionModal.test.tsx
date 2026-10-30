import { fireEvent } from '@testing-library/react'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { AddLiquidityGeoRestrictionModal } from '~/pages/AddLiquidity/AddLiquidityGeoRestrictionModal'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))
vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('uniswap/src/utils/linking', () => ({ openUri: vi.fn() }))

// The real Modal is a Radix dialog / bottom sheet; render straight through so open/closed and the
// telemetry name are observable.
vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children, isModalOpen, name }: { children: React.ReactNode; isModalOpen: boolean; name: string }) =>
    isModalOpen ? <div data-modal-name={name}>{children}</div> : null,
}))

const TOKEN0 = { symbol: 'TSLA' }
const TOKEN1 = { symbol: 'TSLAon' }

const TOKEN_TITLE = 'TSLA isn’t available for liquidity provision in your region'

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mocked(useLPGeoRestriction).mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

describe('AddLiquidityGeoRestrictionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useCreateLiquidityContext).mockReturnValue({
      currencies: { display: { TOKEN0, TOKEN1 } },
    } as unknown as ReturnType<typeof useCreateLiquidityContext>)
  })

  // Must be the pair the deposit CTA gates on, or the modal and the disabled CTA could disagree.
  it('checks the form pair', () => {
    mockGeoRestriction({})
    render(<AddLiquidityGeoRestrictionModal />)

    expect(useLPGeoRestriction).toHaveBeenCalledWith({ token0: TOKEN0, token1: TOKEN1 })
  })

  it('stays closed for a clean pair', () => {
    mockGeoRestriction({})
    render(<AddLiquidityGeoRestrictionModal />)

    expect(screen.queryByText(TOKEN_TITLE)).toBeNull()
  })

  it('states the liquidity-provision restriction on landing with a restricted pair', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'TSLA' })
    render(<AddLiquidityGeoRestrictionModal />)

    expect(screen.getByText(TOKEN_TITLE)).toBeInTheDocument()
    expect(
      screen.getByText(
        'Providing liquidity with this token isn’t available to persons located in your region. Bypassing this restriction is prohibited.',
      ),
    ).toBeInTheDocument()
  })

  // Swap's region modal logs as ModalName.GeoRestriction; a separate name keeps LP impressions countable.
  it('logs under its own LP modal name', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'TSLA' })
    const { container } = render(<AddLiquidityGeoRestrictionModal />)

    expect(container.querySelector(`[data-modal-name="${ModalName.LpGeoRestriction}"]`)).not.toBeNull()
  })

  it('falls back to the generic title when no symbol is known', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: undefined })
    render(<AddLiquidityGeoRestrictionModal />)

    expect(screen.getByText('This token isn’t available for liquidity provision in your region')).toBeInTheDocument()
  })

  // The hook fails open while the check is in flight, so the restriction can land after mount.
  it('opens once the restriction resolves after mount', () => {
    mockGeoRestriction({})
    const { rerender } = render(<AddLiquidityGeoRestrictionModal />)
    expect(screen.queryByText(TOKEN_TITLE)).toBeNull()

    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'TSLA' })
    rerender(<AddLiquidityGeoRestrictionModal />)

    expect(screen.getByText(TOKEN_TITLE)).toBeInTheDocument()
  })

  // A region block has no attestation path for LP, so the modal only informs and closes.
  it('offers Close and no way to continue, and stays closed once dismissed', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'TSLA' })
    const { rerender } = render(<AddLiquidityGeoRestrictionModal />)

    expect(screen.queryByText('Continue')).toBeNull()
    fireEvent.click(screen.getByText('Close'))
    rerender(<AddLiquidityGeoRestrictionModal />)

    expect(screen.queryByText(TOKEN_TITLE)).toBeNull()
  })

  it('opens the geo-restriction help article from Learn more', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'TSLA' })
    render(<AddLiquidityGeoRestrictionModal />)

    fireEvent.click(screen.getByText('Learn more'))
    expect(openUri).toHaveBeenCalledWith({ uri: UniswapHelpUrls.articles.geoRestriction })
  })
})
