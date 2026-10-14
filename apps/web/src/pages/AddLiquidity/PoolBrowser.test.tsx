import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Currency } from '@uniswap/sdk-core'
import { Ether, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useQueryStates } from 'nuqs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { PoolBrowser } from '~/pages/AddLiquidity/PoolBrowser'
import { useResolvedBrowserSelection } from '~/pages/AddLiquidity/useCreatePoolHrefFromSelection'

// The modal is the only way `handleCurrencySelect` is reachable, so the mock keeps its last props
// for the test to fire the selection through.
const searchModal = vi.hoisted(() => ({
  props: undefined as { isOpen: boolean; onCurrencySelect: (currency: Currency) => void } | undefined,
}))

vi.mock('nuqs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('nuqs')>()
  return { ...actual, useQueryStates: vi.fn() }
})

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return { ...actual, useLocation: () => ({ state: null }), useNavigate: () => vi.fn(), useParams: () => ({}) }
})

// Only the derivation and the handler are under test; everything the page renders around them is
// stubbed so the assertions can't be perturbed by the table, the filters or currency resolution.
vi.mock('~/pages/AddLiquidity/useCreatePoolHrefFromSelection', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/pages/AddLiquidity/useCreatePoolHrefFromSelection')>()
  return { ...actual, useResolvedBrowserSelection: vi.fn(), useCreatePoolHrefFromSelection: () => '/positions/add/new' }
})

vi.mock('~/pages/Explore/hooks/useV2ListPools', () => ({
  useV2ListPools: () => ({
    pools: [],
    isLoading: false,
    isError: false,
    loadMore: vi.fn(),
    hasNextPage: false,
    chainId: undefined,
  }),
}))

vi.mock('~/pages/Explore/tables/Pools/PoolTable', () => ({ PoolsTable: () => null }))
vi.mock('~/pages/Explore/tables/Pools/poolTableStore', () => ({
  usePoolTableStore: (selector: (state: { sortMethod: string; sortAscending: boolean }) => unknown) =>
    selector({ sortMethod: 'TVL', sortAscending: false }),
}))
vi.mock('~/components/ExpandableSearchInput/ExpandableSearchInput', () => ({ ExpandableSearchInput: () => null }))
vi.mock('~/features/Liquidity/PoolsFilter/PoolsFilter', () => ({ PoolsFilter: () => null }))
vi.mock('~/features/Liquidity/PoolsFilter/aprRange', () => ({ usePoolsAprRange: () => undefined }))

vi.mock('~/features/Liquidity/CurrencySelector', () => ({
  CurrencySelector: ({ onPress, index }: { onPress: () => void; index?: number }) => (
    <button onClick={onPress}>{`select-${index}`}</button>
  ),
}))

vi.mock('~/components/SearchModal/CurrencySearchModal', () => ({
  CurrencySearchModal: (props: { isOpen: boolean; onCurrencySelect: (currency: Currency) => void }) => {
    searchModal.props = props
    return null
  },
}))

const useQueryStatesMock = vi.mocked(useQueryStates)
const useResolvedBrowserSelectionMock = vi.mocked(useResolvedBrowserSelection)

const USDC_MAINNET = new Token(UniverseChainId.Mainnet, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')
const USDC_BASE = new Token(UniverseChainId.Base, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC')
const ETH_BASE = Ether.onChain(UniverseChainId.Base)

/**
 * Sets up the page with one token already selected on `filterTokenChain`. The opposite side is the
 * `NATIVE` sentinel on purpose: it is chain-agnostic, so it resolves on *whatever* chain the shared
 * hint names — the case that can't be caught downstream by failing to resolve.
 */
function setup(state: { filterCurrencyA?: string; filterCurrencyB?: string; filterTokenChain: UniverseChainId }) {
  const setBrowserUrlState = vi.fn()
  useQueryStatesMock.mockReturnValue([
    {
      filterCurrencyA: '',
      filterCurrencyB: '',
      filterChain: state.filterTokenChain,
      poolsFilter: {},
      ...state,
    },
    setBrowserUrlState,
  ] as unknown as ReturnType<typeof useQueryStates>)
  useResolvedBrowserSelectionMock.mockReturnValue({
    currencyAInfo: undefined,
    currencyBInfo: undefined,
    chainId: state.filterTokenChain,
  })

  render(<PoolBrowser />)
  return { setBrowserUrlState }
}

function selectIn(slot: 0 | 1, currency: Currency): void {
  fireEvent.click(screen.getByRole('button', { name: `select-${slot}` }))
  act(() => searchModal.props?.onCurrencySelect(currency))
}

describe('PoolBrowser handleCurrencySelect', () => {
  beforeEach(() => {
    searchModal.props = undefined
  })

  // Both slots are resolved against one shared chain hint, so repointing the chain without clearing
  // the other slot re-resolves its raw address on the new chain instead of dropping it.
  it('clears the opposite token when the newly selected token is on another chain', () => {
    const { setBrowserUrlState } = setup({
      filterCurrencyB: NATIVE_CHAIN_ID,
      filterTokenChain: UniverseChainId.Base,
    })

    selectIn(0, USDC_MAINNET)

    expect(setBrowserUrlState).toHaveBeenCalledTimes(1)
    expect(setBrowserUrlState).toHaveBeenCalledWith({
      filterCurrencyA: USDC_MAINNET.address,
      filterCurrencyB: '',
      filterChain: UniverseChainId.Mainnet,
      filterTokenChain: UniverseChainId.Mainnet,
    })
  })

  it('clears the first token when the second is picked on another chain', () => {
    const { setBrowserUrlState } = setup({
      filterCurrencyA: NATIVE_CHAIN_ID,
      filterTokenChain: UniverseChainId.Base,
    })

    selectIn(1, USDC_MAINNET)

    expect(setBrowserUrlState).toHaveBeenCalledTimes(1)
    expect(setBrowserUrlState).toHaveBeenCalledWith({
      filterCurrencyA: '',
      filterCurrencyB: USDC_MAINNET.address,
      filterChain: UniverseChainId.Mainnet,
      filterTokenChain: UniverseChainId.Mainnet,
    })
  })

  it('keeps the opposite token when the new token is on the same chain', () => {
    const { setBrowserUrlState } = setup({
      filterCurrencyB: NATIVE_CHAIN_ID,
      filterTokenChain: UniverseChainId.Base,
    })

    selectIn(0, USDC_BASE)

    expect(setBrowserUrlState).toHaveBeenCalledTimes(1)
    expect(setBrowserUrlState).toHaveBeenCalledWith({
      filterCurrencyA: USDC_BASE.address,
      filterChain: UniverseChainId.Base,
      filterTokenChain: UniverseChainId.Base,
    })
  })

  it('writes the native sentinel for a native selection', () => {
    const { setBrowserUrlState } = setup({ filterTokenChain: UniverseChainId.Base })

    selectIn(0, ETH_BASE)

    expect(setBrowserUrlState).toHaveBeenCalledWith({
      filterCurrencyA: NATIVE_CHAIN_ID,
      filterChain: UniverseChainId.Base,
      filterTokenChain: UniverseChainId.Base,
    })
  })
})
