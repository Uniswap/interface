import { PreloadedState } from '@reduxjs/toolkit'
import { UniverseChainId } from '@universe/chains'
import { useRecentlySearchedTokens } from 'uniswap/src/components/TokenSelector/hooks/useRecentlySearchedTokens'
import { USDC_ARBITRUM, USDC_BASE, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { SearchHistoryResult, SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { UniswapState } from 'uniswap/src/state/uniswapReducer'
import { renderHook } from 'uniswap/src/test/test-utils'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfos: vi.fn(() => []) }))

const mockUseCurrencyInfos = useCurrencyInfos as Mock

const usdcMainnetId = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
const usdcBaseId = buildCurrencyId(UniverseChainId.Base, USDC_BASE.address)
const usdcArbitrumId = buildCurrencyId(UniverseChainId.ArbitrumOne, USDC_ARBITRUM.address)

const usdcMultichainEntry = (tdpChainFilter?: UniverseChainId): SearchHistoryResult => ({
  type: SearchHistoryResultType.MultichainToken,
  multichainId: 'usdc-group',
  name: 'USD Coin',
  symbol: 'USDC',
  tokenCurrencyIds: [usdcMainnetId, usdcBaseId, usdcArbitrumId],
  ...(tdpChainFilter ? { tdpChainFilter } : {}),
})

const ethTokenEntry: SearchHistoryResult = {
  type: SearchHistoryResultType.Token,
  chainId: UniverseChainId.Mainnet,
  address: null,
}

function render(results: SearchHistoryResult[], chainFilter: UniverseChainId | null = null): string[] {
  const preloadedState: PreloadedState<UniswapState> = { searchHistory: { results } }
  renderHook(() => useRecentlySearchedTokens(chainFilter), { preloadedState })
  return mockUseCurrencyInfos.mock.lastCall?.[0] ?? []
}

describe(useRecentlySearchedTokens, () => {
  beforeEach(() => {
    mockUseCurrencyInfos.mockClear()
  })

  it('resolves a multichain entry to its first leg, keeping history order with token entries', () => {
    expect(render([usdcMultichainEntry(), ethTokenEntry])).toEqual([
      usdcMainnetId,
      buildNativeCurrencyId(UniverseChainId.Mainnet),
    ])
  })

  it('prefers the leg the user picked when the entry carries a tdpChainFilter', () => {
    expect(render([usdcMultichainEntry(UniverseChainId.Base)])).toEqual([usdcBaseId])
  })

  it('picks the leg on the active chain filter and drops entries with no leg there', () => {
    expect(render([usdcMultichainEntry(UniverseChainId.Base), ethTokenEntry], UniverseChainId.ArbitrumOne)).toEqual([
      usdcArbitrumId,
    ])
  })

  it('dedupes a token recorded both as a token entry and inside a multichain entry', () => {
    const usdcTokenEntry: SearchHistoryResult = {
      type: SearchHistoryResultType.Token,
      chainId: UniverseChainId.Mainnet,
      address: USDC_MAINNET.address.toLowerCase(),
    }
    expect(render([usdcTokenEntry, usdcMultichainEntry()])).toHaveLength(1)
  })

  it('skips token entries with unsupported chain ids', () => {
    const corrupted: SearchHistoryResult = {
      type: SearchHistoryResultType.Token,
      chainId: 99999 as UniverseChainId,
      address: null,
    }
    expect(render([corrupted, ethTokenEntry])).toEqual([buildNativeCurrencyId(UniverseChainId.Mainnet)])
  })
})
