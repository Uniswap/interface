import '~/test-utils/tokens/mocks'
import { fireEvent } from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import type { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { useAccount } from '~/hooks/useAccount'
import { PoolDetailsStatsButtons } from '~/pages/PoolDetails/components/PoolDetailsStatsButtons'
import { useMultiChainPositions } from '~/pages/PoolDetails/Pools/hooks/useMultiChainPositions'
import { USE_DISCONNECTED_ACCOUNT } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { useMultiChainPositionsReturnValue, validBEPoolToken0, validBEPoolToken1 } from '~/test-utils/pools/fixtures'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/PoolDetails/Pools/hooks/useMultiChainPositions')
vi.mock('~/hooks/useAccount')
vi.mock('uniswap/src/contexts/UniswapContext')
vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext')
vi.mock('~/pages/Swap', () => ({ Swap: () => <div>Swap Component</div> }))
vi.mock('~/features/Liquidity/useLPGeoRestriction', () => ({ useLPGeoRestriction: vi.fn() }))

const BANNER_TOKEN_HEADING = 'USDC isn’t available for liquidity provision in your region'
const BANNER_GENERIC_HEADING = 'This token isn’t available for liquidity provision in your region'

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
 * Seam E: the PDP's "Add liquidity" CTA. It navigates rather than signing, so a restricted user who
 * gets through lands in the create flow with the pair already committed — the block has to happen
 * here as well as downstream.
 */
describe('PoolDetailsStatsButtons geo gate (pool details CTA seam)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.pushState({}, '', '/explore/pools/ethereum/0xpool')
    mocked(useAccount).mockReturnValue(USE_DISCONNECTED_ACCOUNT)
    mocked(useMultiChainPositions).mockReturnValue(useMultiChainPositionsReturnValue)
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

    expect(globalThis.window.location.pathname).toBe('/positions/create/v3')
    expect(screen.queryByTestId(TestID.LPGeoRestrictionBanner)).toBeNull()
  })

  it('drops the CTA and explains the region block when the pair is restricted', () => {
    mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'USDC' })
    render(<PoolDetailsStatsButtons {...PROPS} />)

    // Gone rather than disabled: a dead half of the row says nothing the banner does not.
    expect(screen.queryByTestId(TestID.PoolDetailsAddLiquidityButton)).toBeNull()
    expect(screen.getByTestId(TestID.LPGeoRestrictionBanner)).toBeVisible()
    expect(screen.getByText(BANNER_TOKEN_HEADING)).toBeInTheDocument()
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

    it('leaves Swap alone in the row when the pair is restricted', () => {
      mockGeoRestriction({ isGeoRestricted: true, restrictedTokenSymbol: 'USDC' })
      render(<PoolDetailsStatsButtons {...PROPS} />)

      const swap = screen.getByTestId(TestID.PoolDetailsSwapButton)
      expect(swap).toHaveTextContent('Swap')
      expect(rowChildren()).toEqual([swap])
    })

    it('hands both CTAs straight to the row when the pair is clean', () => {
      mockGeoRestriction({})
      render(<PoolDetailsStatsButtons {...PROPS} />)

      const swap = screen.getByTestId(TestID.PoolDetailsSwapButton)
      const cta = screen.getByTestId(TestID.PoolDetailsAddLiquidityButton)
      expect(cta).toHaveTextContent('Add liquidity')
      // No wrapper between row and Button: each Button is its own flex item and sizes itself.
      expect(rowChildren()).toEqual([swap, cta])
    })
  })
})
