import { renderHook } from '@testing-library/react'
import { Ether, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useQueryStates } from 'nuqs'
import { describe, expect, it, vi } from 'vitest'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCurrencyInfo } from '~/hooks/Tokens'
import {
  useCreatePoolHrefFromSelection,
  useResolvedBrowserSelection,
} from '~/pages/AddLiquidity/useCreatePoolHrefFromSelection'

vi.mock('nuqs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('nuqs')>()
  return { ...actual, useQueryStates: vi.fn() }
})

vi.mock('~/hooks/Tokens', () => ({ useCurrencyInfo: vi.fn(), useCurrencyWithLoading: vi.fn(), checkIsNative: vi.fn() }))

const useQueryStatesMock = vi.mocked(useQueryStates)
const useCurrencyInfoMock = vi.mocked(useCurrencyInfo)

const USDC_BASE = new Token(UniverseChainId.Base, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC')
const ETH_BASE = Ether.onChain(UniverseChainId.Base)
// What the real hook falls back to when handed no chain: the connected wallet's chain, else Mainnet.
const CONNECTED_CHAIN = UniverseChainId.Mainnet

/** Only the four params the hook reads matter; the rest of BROWSER_FILTER_PARSERS is inert here. */
function mockUrlState(state: {
  filterCurrencyA?: string
  filterCurrencyB?: string
  filterTokenChain?: UniverseChainId | null
  filterChain?: UniverseChainId | null
}) {
  useQueryStatesMock.mockReturnValue([
    {
      filterCurrencyA: '',
      filterCurrencyB: '',
      filterTokenChain: null,
      filterChain: null,
      poolsFilter: {},
      ...state,
    },
    vi.fn(),
  ] as unknown as ReturnType<typeof useQueryStates>)
}

/**
 * Stands in for `useCurrencyInfo`, modelling the three behaviours that decide what the href can
 * emit (`apps/web/src/hooks/Tokens.ts`):
 *
 * 1. An ERC20 address resolves only on the chain it actually exists on.
 * 2. An **absent** `chainId` does not fail to resolve. `useCurrencyPreprocessing` substitutes the
 *    connected chain (`chainId ?? connectedChainId`, then `?? Mainnet`), so the `NATIVE` sentinel
 *    comes back as that chain's native currency — not `undefined`. Modelling this the other way
 *    round is what previously hid the wrong-chain seed from this suite.
 * 3. `skip` short-circuits to `undefined` regardless of the rest, which is the only lever the hook
 *    has for refusing to resolve a selection whose chain it does not know.
 */
function mockCurrencyResolution() {
  useCurrencyInfoMock.mockImplementation((addressOrCurrency?: unknown, chainId?: UniverseChainId, skip?: boolean) => {
    if (!addressOrCurrency || skip) {
      return undefined
    }
    const resolvedChain = chainId ?? CONNECTED_CHAIN
    if (addressOrCurrency === NATIVE_CHAIN_ID) {
      return { currency: Ether.onChain(resolvedChain) } as ReturnType<typeof useCurrencyInfo>
    }
    if (addressOrCurrency === USDC_BASE.address && resolvedChain === UniverseChainId.Base) {
      return { currency: USDC_BASE } as ReturnType<typeof useCurrencyInfo>
    }
    return undefined
  })
}

describe('useCreatePoolHrefFromSelection', () => {
  // The regression the review caught: Network = "All" nulls `filterChain` but leaves both tokens
  // selected, and the href used to come out with no `chain` at all.
  it('still emits the chain when the network filter is cleared with both tokens selected', () => {
    mockUrlState({
      filterCurrencyA: NATIVE_CHAIN_ID,
      filterCurrencyB: USDC_BASE.address,
      filterTokenChain: UniverseChainId.Base,
      filterChain: null,
    })
    mockCurrencyResolution()

    const { result } = renderHook(() => useCreatePoolHrefFromSelection())
    expect(result.current).toBe(
      `/positions/add/new?currencyA=${NATIVE_CHAIN_ID}&currencyB=${USDC_BASE.address}&chain=base`,
    )
  })

  // Reload of an "All Networks + tokens selected" URL: `filterChain` is absent, and the chain has
  // to come from the persisted `filterTokenChain` rather than mount-seeded component state.
  it('survives a reload with no network filter in the URL', () => {
    mockUrlState({
      filterCurrencyA: USDC_BASE.address,
      filterTokenChain: UniverseChainId.Base,
      filterChain: null,
    })
    mockCurrencyResolution()

    const { result } = renderHook(() => useCreatePoolHrefFromSelection())
    expect(result.current).toBe(`/positions/add/new?currencyA=${USDC_BASE.address}&chain=base`)
  })

  it('resolves against filterTokenChain, not the table network filter', () => {
    mockUrlState({
      filterCurrencyA: USDC_BASE.address,
      filterTokenChain: UniverseChainId.Base,
      filterChain: UniverseChainId.Mainnet,
    })
    mockCurrencyResolution()

    renderHook(() => useCreatePoolHrefFromSelection())
    expect(useCurrencyInfoMock).toHaveBeenCalledWith(USDC_BASE.address, UniverseChainId.Base, false)
  })

  // A token selected with NO chain in the URL: a legacy link written before `filterTokenChain`
  // existed, or one whose `filterChain` was nulled by Network = "All". The chain hint is undefined,
  // so the real `useCurrencyInfo` would resolve the `NATIVE` sentinel on the connected chain and
  // seed `chain=ethereum` for a token picked elsewhere. Passing `skip` degrades it to the blank
  // form instead — this fails without that argument.
  it('emits no chain-seeded href when a token is selected with no chain in the URL', () => {
    mockUrlState({ filterCurrencyA: NATIVE_CHAIN_ID, filterTokenChain: null, filterChain: null })
    mockCurrencyResolution()

    const { result } = renderHook(() => useCreatePoolHrefFromSelection())
    expect(result.current).toBe('/positions/add/new')
    expect(useCurrencyInfoMock).toHaveBeenCalledWith(NATIVE_CHAIN_ID, undefined, true)
  })

  it('falls back to the bare path while the selection is unresolved', () => {
    mockUrlState({ filterCurrencyA: USDC_BASE.address, filterTokenChain: UniverseChainId.Base })
    useCurrencyInfoMock.mockReturnValue(undefined)

    const { result } = renderHook(() => useCreatePoolHrefFromSelection())
    expect(result.current).toBe('/positions/add/new')
  })

  it('returns the bare path when nothing is selected', () => {
    mockUrlState({})
    mockCurrencyResolution()

    const { result } = renderHook(() => useCreatePoolHrefFromSelection())
    expect(result.current).toBe('/positions/add/new')
    expect(useCurrencyInfoMock).toHaveBeenCalledWith(undefined, undefined, true)
  })
})

describe('useResolvedBrowserSelection', () => {
  // The selectors and both CTAs read this one hook, so a single test pins the derivation all
  // three depend on — the duplication that previously let the CTAs drift from the selectors.
  it('resolves both sides and the chain from the persisted token chain', () => {
    mockUrlState({
      filterCurrencyA: NATIVE_CHAIN_ID,
      filterCurrencyB: USDC_BASE.address,
      filterTokenChain: UniverseChainId.Base,
      filterChain: null,
    })
    mockCurrencyResolution()

    const { result } = renderHook(() => useResolvedBrowserSelection())
    expect(result.current.chainId).toBe(UniverseChainId.Base)
    expect(result.current.currencyAInfo?.currency).toBe(ETH_BASE)
    expect(result.current.currencyBInfo?.currency).toBe(USDC_BASE)
  })

  it('falls back to the table network filter for a URL written before filterTokenChain existed', () => {
    mockUrlState({ filterCurrencyA: USDC_BASE.address, filterChain: UniverseChainId.Base })
    mockCurrencyResolution()

    const { result } = renderHook(() => useResolvedBrowserSelection())
    expect(result.current.chainId).toBe(UniverseChainId.Base)
    expect(result.current.currencyAInfo?.currency).toBe(USDC_BASE)
  })
})
