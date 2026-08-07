import '~/test-utils/tokens/mocks'
import { fireEvent } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useAccount } from '~/hooks/useAccount'
import { PoolDetailsStatsButtons } from '~/pages/PoolDetails/components/PoolDetailsStatsButtons'
import { useMultiChainPositions } from '~/pages/PoolDetails/Pools/hooks/useMultiChainPositions'
import { USE_DISCONNECTED_ACCOUNT } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { useMultiChainPositionsReturnValue, validBEPoolToken0, validBEPoolToken1 } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/PoolDetails/Pools/hooks/useMultiChainPositions')
vi.mock('~/hooks/useAccount')
vi.mock('uniswap/src/contexts/UniswapContext')
vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext')
vi.mock('~/pages/Swap', () => ({ Swap: () => <div>Swap Component</div> }))
vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))

// `useMedia().md` is the desktop/mobile split, so the viewport is pinned rather than inherited from
// jsdom. Kept out of the sibling desktop file because mocking it stops the swap modal mounting there.
vi.mock('tamagui', async () => ({
  ...(await vi.importActual<typeof import('tamagui')>('tamagui')),
  useMedia: vi.fn(),
}))

const BANNER_TOKEN_HEADING = 'USDC isn’t available for liquidity provision in your region'

const PROPS = {
  chainId: UniverseChainId.Mainnet,
  token0: validBEPoolToken0,
  token1: validBEPoolToken1,
  feeTier: 500,
  protocolVersion: GraphQLApi.ProtocolVersion.V3,
} as const

function mockGeoRestriction(overrides: Partial<ReturnType<typeof useLPGeoRestriction>>): void {
  mocked(useLPGeoRestriction).mockReturnValue({
    isGeoRestricted: false,
    restrictedTokenSymbol: undefined,
    unavailableLabel: 'Not available in your region',
    ...overrides,
  })
}

/**
 * Seam E on touch. The gate itself is viewport-independent — the CTA is dropped and the banner
 * explains why on every size — but mobile swaps the buttons row for `MobileBottomBar`, a fixed strip
 * that translates away on scroll, so this file pins where the banner lands relative to it.
 */
describe('PoolDetailsStatsButtons geo gate on mobile (pool details CTA seam)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaSize('md')
    window.history.pushState({}, '', '/explore/pools/ethereum/0xpool')
    mocked(useAccount).mockReturnValue(USE_DISCONNECTED_ACCOUNT)
    mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
  })

  it('drops the CTA and banners the region block when the pair is restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'USDC' })
    render(<PoolDetailsStatsButtons {...PROPS} />)

    expect(screen.queryByTestId(TestID.PoolDetailsAddLiquidityButton)).toBeNull()
    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(BANNER_TOKEN_HEADING)).toBeInTheDocument()
  })

  it('keeps the banner out of the bottom bar, which scrolls out of view', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'USDC' })
    render(<PoolDetailsStatsButtons {...PROPS} />)

    const banner = screen.getByTestId(TestID.LPGeoRestrictionBanner)
    const bar = screen.getByTestId(TestID.PoolDetailsSwapButton).parentElement?.parentElement
    expect(bar).toBeDefined()
    expect(bar).not.toContainElement(banner)
  })

  it('navigates with no banner when the pair is confirmed clean', () => {
    mockGeoRestriction({})
    render(<PoolDetailsStatsButtons {...PROPS} />)

    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()

    fireEvent.click(screen.getByTestId(TestID.PoolDetailsAddLiquidityButton))
    expect(globalThis.window.location.pathname).toBe('/positions/create/v3')
  })
})
