import { act, waitFor } from '@testing-library/react-native'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import {
  useCurrencyInfo,
  useCurrencyInfos,
  useCurrencyInfoWithLoading,
} from 'uniswap/src/features/tokens/useCurrencyInfo'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const { mockGetGetTokenQueryOptions, mockGetGetTokensQueryOptions } = vi.hoisted(() => ({
  mockGetGetTokenQueryOptions: vi.fn(),
  mockGetGetTokensQueryOptions: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokenQueryOptions: mockGetGetTokenQueryOptions,
  getGetTokensQueryOptions: mockGetGetTokensQueryOptions,
}))

// Deliberately not a well-known COMMON_BASES address (e.g. USDC/DAI) — those short-circuit
// through getCommonBase and would mask the REST branch this test exercises.
const ADDRESS = '0x1234567890123456789012345678901234567890'
const CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, ADDRESS)

const REST_TOKEN = {
  chainId: UniverseChainId.Mainnet,
  address: ADDRESS,
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin (REST)',
  project: { logoUrl: 'https://example.com/rest.png' },
  safety: { isSpam: false, isVerified: true, isBlocked: false },
  multichain: { id: 'usdc-multichain-id', addresses: { '1': ADDRESS } },
}

describe(useCurrencyInfo, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetGetTokenQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getToken'],
      queryFn: () => Promise.resolve({ token: REST_TOKEN }),
      enabled,
      select,
    }))
    mockGetGetTokensQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokens'],
      queryFn: () => Promise.resolve({ tokens: [REST_TOKEN] }),
      enabled,
      select,
    }))
  })

  it('returns a CurrencyInfo built from the REST token', async () => {
    const { result } = renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID))

    await waitFor(() => expect(result.current?.currency.name).toBe('USD Coin (REST)'))
    expect(result.current?.logoUrl).toBe('https://example.com/rest.png')
    expect(result.current?.isBridged).toBe(false)
    expect(result.current?.bridgedWithdrawalInfo).toBeUndefined()
  })

  // Regression: projectId drives cross-chain "same asset" matching downstream (e.g.
  // sameAssetBridgeDetected in swap, multichain grouping in search history) — it must not
  // silently go undefined.
  it('populates projectId from the REST token multichain id', async () => {
    const { result } = renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID))

    await waitFor(() => expect(result.current?.projectId).toBe('usdc-multichain-id'))
  })

  it('does not fetch when skipped', () => {
    renderHookWithProviders(() => useCurrencyInfo(CURRENCY_ID, { skip: true }))

    expect(mockGetGetTokenQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  // Regression: the REST project.logoUrl override exists to patch broken *token* commonBase
  // images (WEB-5111) — it must never clobber a native currency's own maintained static logo,
  // since backend project metadata keyed on the native placeholder address isn't reliable.
  it('does not override the native currency logo with the REST project logoUrl', async () => {
    const { result } = renderHookWithProviders(() => useCurrencyInfo(buildNativeCurrencyId(UniverseChainId.Mainnet)))

    await waitFor(() => expect(result.current?.currency.isNative).toBe(true))
    expect(result.current?.logoUrl).not.toBe('https://example.com/rest.png')
  })
})

describe(useCurrencyInfos, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Every test's mocked getGetTokensQueryOptions reuses the same hardcoded queryKey, and
    // useRestCurrencyInfos runs against the app's SharedQueryClient singleton — without clearing,
    // a later test can read a stale cached response from an earlier one under that same key.
    SharedQueryClient.clear()

    mockGetGetTokensQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokens'],
      queryFn: () => Promise.resolve({ tokens: [REST_TOKEN] }),
      enabled,
      select,
    }))
  })

  it('matches REST batch results back to the requested currencyIds by chainId+address', async () => {
    const { result } = renderHookWithProviders(() => useCurrencyInfos([CURRENCY_ID]))

    await waitFor(() => expect(result.current[0]?.currency.name).toBe('USD Coin (REST)'))
  })

  // Regression: the native currencyId embeds the display address (0xeee...), but the REST
  // wire/response address for native ETH is 0x0. The response-matching key must be built from
  // the same resolved REST contract input as the request, not re-derived from the currencyId
  // string, or the native leg never matches and callers (e.g. PoolInfoCell) render nothing.
  it('matches the native currency by its REST wire address, not the currencyId display address', async () => {
    const nativeCurrencyId = buildNativeCurrencyId(UniverseChainId.Mainnet)
    const nativeRestToken = {
      ...REST_TOKEN,
      address: DEFAULT_NATIVE_ADDRESS,
      symbol: 'ETH',
      name: 'Ethereum',
    }
    mockGetGetTokensQueryOptions.mockImplementation(({ enabled, select }) => ({
      queryKey: [ReactQueryCacheKey.DataApiService, 'getTokens'],
      queryFn: () => Promise.resolve({ tokens: [nativeRestToken] }),
      enabled,
      select,
    }))

    const { result } = renderHookWithProviders(() => useCurrencyInfos([nativeCurrencyId]))

    await waitFor(() => expect(result.current[0]?.currency.name).toBe('Ethereum'))
  })
})

describe(useCurrencyInfoWithLoading, () => {
  beforeEach(async () => {
    // The file-level mock drops placeholderData; this regression needs the real query options.
    const actual = await vi.importActual<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>(
      'uniswap/src/data/apiClients/dataApiService/tokens/queries',
    )
    mockGetGetTokenQueryOptions.mockImplementation(actual.getGetTokenQueryOptions)
  })

  it('settles on an empty result instead of looping on placeholder data when the currency id is cleared', () => {
    SharedQueryClient.setQueryData(
      [ReactQueryCacheKey.DataApiService, 'getToken', currencyIdToRestContractInput(CURRENCY_ID)],
      { token: REST_TOKEN },
    )
    let renders = 0
    const { result, rerender } = renderHookWithProviders(
      (id: string | undefined) => {
        renders++
        const r = useCurrencyInfoWithLoading(id)
        // Tracking status props is what turns placeholder/pending alternation into re-renders.
        return { data: r.data, status: r.status, isPlaceholderData: r.isPlaceholderData }
      },
      { initialProps: [CURRENCY_ID] },
    )
    expect(result.current.data?.currency.name).toBe('USD Coin (REST)')

    const before = renders
    act(() => rerender([undefined]))

    expect(result.current.data).toBeUndefined()
    expect(result.current.isPlaceholderData).toBe(false)
    expect(renders - before).toBeLessThan(5)
  })
})
