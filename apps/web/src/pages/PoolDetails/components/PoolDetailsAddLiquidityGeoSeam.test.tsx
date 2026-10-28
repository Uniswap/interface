import '~/test-utils/tokens/mocks'
import { fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import type { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useAccount } from '~/hooks/useAccount'
import { PoolDetailsStatsButtons } from '~/pages/PoolDetails/components/PoolDetailsStatsButtons'
import { USE_DISCONNECTED_ACCOUNT } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { mockUseWalletPositions } from '~/test-utils/pools/feePositionFixtures'
import { validParsedPoolToken0, validParsedPoolToken1 } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/positions/hooks/useWalletPositions')
vi.mock('~/hooks/useAccount')
vi.mock('uniswap/src/contexts/UniswapContext')
vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext')
vi.mock('~/pages/Swap', () => ({ Swap: () => <div>Swap Component</div> }))
vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))

const BANNER_TOKEN_HEADING = 'USDC isn’t available for liquidity provision in your region'
const BANNER_GENERIC_HEADING = 'This token isn’t available for liquidity provision in your region'

const PROPS = {
  chainId: UniverseChainId.Mainnet,
  poolIdOrAddress: '0xpool',
  token0: validParsedPoolToken0,
  token1: validParsedPoolToken1,
  feeTier: 500,
  protocolVersion: ProtocolVersion.V3,
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
 * Seam E: the PDP's "Add liquidity" CTA. It only navigates, so it stays visible for a restricted pair
 * (block the action, not the product): the add flow it lands in opens the region modal and keeps its
 * CTA disabled. The banner here states the restriction up front.
 */
describe('PoolDetailsStatsButtons geo gate (pool details CTA seam)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/explore/pools/ethereum/0xpool')
    mocked(useAccount).mockReturnValue(USE_DISCONNECTED_ACCOUNT)
    mockUseWalletPositions([])
    mocked(useUniswapContext).mockReturnValue({
      navigateToFiatOnRamp: () => {},
      navigateToSwapFlow: () => {},
      navigateToSendFlow: () => {},
      navigateToReceive: () => {},
      handleShareToken: () => {},
      navigateToTokenDetails: () => {},
      navigateToPoolDetails: () => {},
      navigateToExternalProfile: () => {},
      navigateToNftDetails: () => {},
      navigateToAdvancedSettings: () => {},
      onSwapChainsChanged: () => {},
      isSwapTokenSelectorOpen: false,
      setSwapOutputChainId: () => {},
      setIsSwapTokenSelectorOpen: () => {},
      signer: undefined,
      useProviderHook: () => undefined,
      useWalletDisplayName: () => undefined,
      useAccountsStoreContextHook: () => ({}) as AccountsStore,
    })
  })

  it('navigates into the add-liquidity flow when the pair is confirmed clean', () => {
    mockGeoRestriction({})
    render(<PoolDetailsStatsButtons {...PROPS} />)

    fireEvent.click(screen.getByTestId(TestID.PoolDetailsAddLiquidityButton))

    expect(globalThis.window.location.pathname).toBe('/positions/add/ethereum/0xpool')
    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
  })

  it('keeps the CTA and explains the region block when the pair is restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'USDC' })
    render(<PoolDetailsStatsButtons {...PROPS} />)

    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(BANNER_TOKEN_HEADING)).toBeInTheDocument()

    // Still navigates: the add flow, not this button, is where the restriction blocks the action.
    fireEvent.click(screen.getByTestId(TestID.PoolDetailsAddLiquidityButton))
    expect(globalThis.window.location.pathname).toBe('/positions/add/ethereum/0xpool')
  })

  it('falls back to the generic banner heading when the restricted token has no symbol', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: undefined })
    render(<PoolDetailsStatsButtons {...PROPS} />)

    expect(screen.getByText(BANNER_GENERIC_HEADING)).toBeInTheDocument()
  })

  // The geo block is specific to liquidity provision; swap has its own gate and its own remedy, so
  // blocking one must not silently disable the other.
  it('leaves the swap CTA usable when liquidity is region-blocked', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'USDC' })
    render(<PoolDetailsStatsButtons {...PROPS} />)

    fireEvent.click(screen.getByTestId(TestID.PoolDetailsSwapButton))
    expect(screen.getByTestId('pool-details-swap-modal')).toBeVisible()
  })

  // The buttons size themselves from the row, so whatever the gate leaves behind has to be a whole
  // flex item. An earlier version wrapped the CTA to disable it and left the two halves uneven.
  describe('row layout', () => {
    function rowChildren() {
      const row = screen.getByTestId(TestID.PoolDetailsSwapButton).parentElement
      if (!row) {
        throw new Error('swap CTA is not in a row')
      }
      return Array.from(row.children)
    }

    it.each([
      ['clean', {}],
      ['restricted', { isGeoRestricted: true, restrictedTokenSymbol: 'USDC' }],
    ])('hands both CTAs straight to the row when the pair is %s', (_, geoRestriction) => {
      mockGeoRestriction(geoRestriction)
      render(<PoolDetailsStatsButtons {...PROPS} />)

      const swap = screen.getByTestId(TestID.PoolDetailsSwapButton)
      const cta = screen.getByTestId(TestID.PoolDetailsAddLiquidityButton)
      expect(cta).toHaveTextContent('Add liquidity')
      // No wrapper between row and Button: each Button is its own flex item and sizes itself.
      expect(rowChildren()).toEqual([swap, cta])
    })
  })
})
