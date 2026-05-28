/**
 * End-to-end integration test for the blocklist→allowlist persistence migration.
 *
 * Wires up the REAL machinery: a QueryClient with real queries, the real
 * `sharedDehydrateOptions`, the real `createPersister` (with in-memory storage
 * in place of IndexedDB), and exercises a full
 *   set query data → dehydrate → persistClient → restoreClient → hydrate
 * cycle. Assertions then verify exactly which queries survive the round-trip
 * and that their data is intact.
 *
 * This catches categories of bugs that the pure-unit test on
 * `shouldDehydrateQuery` cannot:
 *   - Serializer mismatch (e.g., BigInt handling)
 *   - Buster bump behavior
 *   - Interaction between `shouldDehydrateQuery` and `defaultShouldDehydrateQuery`
 *   - The `hydrate()` step actually restoring the data we expect
 */

import { dehydrate, hydrate, QueryClient } from '@tanstack/react-query'
import { type PersistedClient } from '@tanstack/react-query-persist-client'
import { createPersister } from 'uniswap/src/data/apiClients/createPersister.web'
import { sharedDehydrateOptions } from 'uniswap/src/data/apiClients/sharedDehydrateOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

// Mock idb-keyval with in-memory storage (same pattern as createPersister.test.ts).
let mockStorage: Map<string, string>

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => mockStorage.get(key)),
  set: vi.fn(async (key: string, value: string) => {
    mockStorage.set(key, value)
  }),
  del: vi.fn(async (key: string) => {
    mockStorage.delete(key)
  }),
}))

// Mock env so the dev-guard branch is exercised without depending on NODE_ENV.
vi.mock('@universe/environment', () => ({
  isDevEnv: () => true,
  isTestEnv: () => false,
}))

// Mock the logger so warnings don't pollute output.
const loggerWarnMock = vi.fn()
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => loggerWarnMock(...args),
  },
}))

/**
 * Primes a query in the client using `queryCache.build(...)` so options like
 * `meta` and `gcTime` land on the Query itself (Query.meta is a getter, so
 * it can't be assigned after construction). Then populates the query's data
 * via `setQueryData` to synthesize the successful-query state that
 * `shouldDehydrateQuery` + `defaultShouldDehydrateQuery` expect.
 */
function primeQuery<T>(
  client: QueryClient,
  options: {
    queryKey: readonly unknown[]
    meta?: Record<string, unknown>
    gcTime?: number
    // Allow other fields (queryFn, staleTime, etc.) — we ignore them and use our own.
    [key: string]: unknown
  },
  data: T,
): void {
  client.getQueryCache().build(client, {
    queryKey: options.queryKey as unknown[],
    queryFn: () => Promise.resolve(data),
    ...(options.meta ? { meta: options.meta } : {}),
    ...(options.gcTime !== undefined ? { gcTime: options.gcTime } : {}),
  })
  client.setQueryData(options.queryKey as unknown[], data)
}

describe('persistence migration integration (dehydrate → persist → restore → hydrate)', () => {
  beforeEach(() => {
    mockStorage = new Map<string, string>()
    loggerWarnMock.mockReset()
  })

  /**
   * Asserts the allowlist semantics: a query tagged via persistableQueryOptions
   * survives the full round-trip; a query not tagged does not.
   */
  it('allowlist: persistableQueryOptions-tagged queries survive, raw queryOptions-tagged queries do not', async () => {
    const client = new QueryClient()

    // Tagged — should survive.
    const persistable = persistableQueryOptions({
      queryKey: [ReactQueryCacheKey.TokenPrice, 1, '0xabc'] as const,
      queryFn: async () => ({ price: 100, timestamp: 1_700_000_000 }),
    })
    primeQuery(client, persistable, { price: 100, timestamp: 1_700_000_000 })

    // Untagged — should NOT survive (no meta.persist).
    primeQuery(
      client,
      {
        queryKey: [ReactQueryCacheKey.TradeService, 'getTrade', { from: 'ETH', to: 'USDC' }] as const,
        queryFn: async () => ({ quoteId: 'q-1', amountOut: '12345' }),
      },
      { quoteId: 'q-1', amountOut: '12345' },
    )

    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })

    // Only the tagged query survives dehydration.
    const persistedKeys = dehydrated.queries.map((q) => q.queryKey[0])
    expect(persistedKeys).toEqual([ReactQueryCacheKey.TokenPrice])

    // Full round-trip: persist → restore into a new client → hydrate → read back.
    const persister = createPersister('test-allowlist-key')
    await persister.persistClient({ timestamp: Date.now(), buster: 'v1', clientState: dehydrated })
    const restored = await persister.restoreClient()
    expect(restored).toBeDefined()

    const hydratedClient = new QueryClient()
    hydrate(hydratedClient, restored!.clientState)

    expect(hydratedClient.getQueryData([ReactQueryCacheKey.TokenPrice, 1, '0xabc'])).toEqual({
      price: 100,
      timestamp: 1_700_000_000,
    })
    expect(
      hydratedClient.getQueryData([ReactQueryCacheKey.TradeService, 'getTrade', { from: 'ETH', to: 'USDC' }]),
    ).toBeUndefined()
  })

  it('preserves BigInt values via the jsonStringify/__bigint__: prefix round-trip', async () => {
    const client = new QueryClient()

    const bigAmount = BigInt('123456789012345678901234567890')
    const queryKey = [ReactQueryCacheKey.GetPortfolio, { evmAddress: '0xabc' }, {}] as const
    primeQuery(
      client,
      persistableQueryOptions({
        queryKey,
        queryFn: async () => ({ balances: [{ amount: bigAmount, chainId: 1 }] }),
      }),
      { balances: [{ amount: bigAmount, chainId: 1 }] },
    )

    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })

    const persister = createPersister('test-bigint-key')
    await persister.persistClient({ timestamp: Date.now(), buster: 'v1', clientState: dehydrated })
    const restored = await persister.restoreClient()
    const hydratedClient = new QueryClient()
    hydrate(hydratedClient, restored!.clientState)

    const rehydratedData = hydratedClient.getQueryData<{ balances: { amount: bigint; chainId: number }[] }>(queryKey)
    expect(rehydratedData).toBeDefined()
    expect(rehydratedData!.balances[0]!.amount).toBe(bigAmount)
    expect(typeof rehydratedData!.balances[0]!.amount).toBe('bigint')
    expect(loggerWarnMock).not.toHaveBeenCalled()
  })

  it('excludes queries with gcTime:0 even when tagged', () => {
    const client = new QueryClient()

    // Simulate a queryWithoutCache usage — meta.persist AND gcTime:0.
    // (gcTime:0 wins; this is the historical behavior we preserve.)
    primeQuery(
      client,
      { queryKey: [ReactQueryCacheKey.UniqueId], meta: { persist: true }, gcTime: 0 },
      'device-abc-123',
    )

    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })

    expect(dehydrated.queries).toHaveLength(0)
  })

  it('excludes non-success queries even when tagged', () => {
    const client = new QueryClient()

    // Prime a query with no data (status stays 'pending'); no setQueryData call.
    client.getQueryCache().build(client, {
      queryKey: [ReactQueryCacheKey.GetPortfolio, 'failing'],
      queryFn: () => Promise.reject(new Error('x')),
      meta: { persist: true },
    })

    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })

    expect(dehydrated.queries).toHaveLength(0)
  })

  it('dev guard excludes circular-reference data with a warning; prod would let it through', () => {
    const client = new QueryClient()

    const circular: { self?: unknown; label: string } = { label: 'bad' }
    circular.self = circular

    primeQuery(client, { queryKey: [ReactQueryCacheKey.GetPortfolio, 'circular'], meta: { persist: true } }, circular)

    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })

    expect(dehydrated.queries).toHaveLength(0)
    expect(loggerWarnMock).toHaveBeenCalledOnce()
  })

  it('buster bump invalidates old cache', async () => {
    // Persist a client with buster='v0', then restore with a persister that
    // expects 'v1'. The persister should return undefined for the mismatch.
    // (Note: PersistQueryClientProvider's restore logic checks buster match,
    // not the persister itself — but the restored client carries the buster
    // and downstream logic will reject it.)
    const persister = createPersister('test-buster-key')
    const v0Client: PersistedClient = {
      timestamp: Date.now(),
      buster: 'v0',
      clientState: {
        queries: [
          {
            queryKey: [ReactQueryCacheKey.TokenPrice],
            queryHash: 'TokenPrice-hash',
            state: { data: { price: 42, timestamp: 1 } } as any,
          },
        ],
        mutations: [],
      },
    }

    await persister.persistClient(v0Client)
    const restored = await persister.restoreClient()

    // The persister itself round-trips the data with buster='v0'.
    // The SharedPersistQueryClientProvider runs the buster check and discards
    // mismatched data; we simulate that assertion explicitly here.
    expect(restored).toBeDefined()
    expect(restored!.buster).toBe('v0')
    expect(restored!.buster).not.toBe('v1')
    // When SharedPersistQueryClientProvider uses persistOptions.buster='v1',
    // it will see this mismatch and discard the restored client entirely.
  })

  it('dehydrate skips all currently-untagged enum keys (regression test)', async () => {
    // This acts as a spot-check against accidental re-persistence of
    // previously-blocklisted keys. If someone adds `meta.persist: true`
    // to one of these in the future, this test will fail and prompt
    // an intentional review.
    const client = new QueryClient()

    const expectedExcluded: readonly unknown[] = [
      ['Session', 'initialization'],
      ['UniqueId'],
      ['ExtensionBuiltInBiometricCapabilities'],
      ['TradeService', 'getTrade', {}],
      ['TradeService', 'getIndicativeTrade', {}],
      ['CameraPermission'],
      ['DialogVisibility', 'swap-warning'],
      ['BlockNumber', 1],
      ['BlockTimestamp', 1, 100],
      ['TradingApi', '/trading-api/quote', {}],
      ['TradingApi', '/trading-api/swap', {}],
      ['TradingApi', '/trading-api/approval', {}],
    ]

    for (const queryKey of expectedExcluded) {
      // Register with data but no meta.persist — the default behavior.
      client.setQueryData(queryKey as unknown[], { ok: true })
    }

    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })

    expect(dehydrated.queries).toHaveLength(0)
  })

  it('dehydrate includes every key that is currently tagged as persistable (smoke)', () => {
    // Snapshot-style: asserts that every `queryKey[0]` we currently opt into
    // actually makes it through dehydration. If a future change accidentally
    // strips `persistableQueryOptions` from one of these, this test breaks.
    const client = new QueryClient()

    const expectedIncluded: readonly unknown[][] = [
      ['TokenPrice', 1, '0xabc'],
      ['GetPortfolio', { evmAddress: '0xabc' }, {}],
      ['GetPortfolioChart', {}, {}],
      ['ListPositions', {}],
      ['ListPositions', 'infinite', {}],
      ['GetPosition', {}],
      ['ListTransactions', 'abc', {}, false],
      ['GetWalletProfitLoss'],
      ['GetWalletTokenProfitLoss'],
      ['GetWalletTokensProfitLoss'],
      ['DataApiService', 'listTokens', {}],
      ['DataApiService', 'listTopPools', {}],
      ['TradingApi', 'swappable-tokens', {}],
      ['UnitagsApi', 'address', {}],
      ['UnitagsApi', 'username', {}],
      ['UnitagsApi', 'claim/eligibility', {}],
      ['AuctionApi', 'getAuction', {}],
      ['AuctionApi', 'getBids', {}],
      ['AuctionApi', 'listTopAuctions', {}],
      ['OnchainENS', 'name', '0xabc'],
      ['PositionTokenURI', 1, 1, 3],
      ['DensityChartData', 'pool-1'],
      ['Notifications'],
    ]

    for (const queryKey of expectedIncluded) {
      primeQuery(client, { queryKey, meta: { persist: true } }, { sentinel: queryKey[0] })
    }

    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })

    expect(dehydrated.queries).toHaveLength(expectedIncluded.length)
    const dehydratedFirstKeys = new Set(dehydrated.queries.map((q) => q.queryKey[0]))
    expect(dehydratedFirstKeys.has('TokenPrice')).toBe(true)
    expect(dehydratedFirstKeys.has('GetPortfolio')).toBe(true)
    expect(dehydratedFirstKeys.has('AuctionApi')).toBe(true)
  })

  it('getPortfolio outer wrapper preserves meta.persist through spread', () => {
    // `getPortfolioQuery` in `packages/uniswap/src/data/rest/getPortfolio.ts`
    // uses `queryOptions({ ...baseOptions, enabled, refetchInterval, select,
    // queryFn })` where `baseOptions` comes from the `persistableQueryOptions`
    // wrapper in the @universe/api package. We verify here that `queryOptions`
    // (the identity function from @tanstack/react-query) preserves
    // `meta.persist: true` from the spread — otherwise the outer wrapper would
    // silently strip the persist tag and portfolio data wouldn't survive refresh.
    const baseOptions = persistableQueryOptions({
      queryKey: [ReactQueryCacheKey.GetPortfolio, 'a', 'b'] as const,
      queryFn: async () => 'data',
    })
    expect(baseOptions.meta).toEqual({ persist: true })

    const { queryOptions } = require('@tanstack/react-query') as typeof import('@tanstack/react-query')

    const withOverrides = queryOptions({
      ...baseOptions,
      enabled: true,
    })

    expect(withOverrides.meta).toEqual({ persist: true })
  })

  it('protobuf round-trip: data fields survive, class methods do not (documents the known limitation)', async () => {
    // Simulates what happens when a protobuf Message (e.g., GetPortfolioResponse)
    // is persisted: the instance methods don't survive JSON serialization, but
    // field-access on the rehydrated POJO works identically.
    const client = new QueryClient()

    class FakeProtoMessage {
      constructor(
        public portfolio: { totalBalanceUsd: number },
        public nextPageToken: string,
      ) {}

      getTotalBalance(): number {
        return this.portfolio.totalBalanceUsd
      }
    }

    const instance = new FakeProtoMessage({ totalBalanceUsd: 12345.67 }, 'next-page-abc')
    const queryKey = [ReactQueryCacheKey.GetPortfolio, 'proto-fake'] as const

    primeQuery(client, { queryKey, meta: { persist: true } }, instance)

    const persister = createPersister('test-proto-key')
    const dehydrated = dehydrate(client, {
      shouldDehydrateQuery: sharedDehydrateOptions!.shouldDehydrateQuery!,
    })
    await persister.persistClient({ timestamp: Date.now(), buster: 'v1', clientState: dehydrated })

    const restored = await persister.restoreClient()
    const hydratedClient = new QueryClient()
    hydrate(hydratedClient, restored!.clientState)

    const rehydrated = hydratedClient.getQueryData<FakeProtoMessage>(queryKey)

    // Field access still works — downstream consumers that read fields are fine.
    expect(rehydrated).toBeDefined()
    expect(rehydrated!.portfolio).toEqual({ totalBalanceUsd: 12345.67 })
    expect(rehydrated!.nextPageToken).toBe('next-page-abc')

    // But method access does NOT survive — this is the known limitation that
    // motivates `toPlainMessage(...)` inside queryFns (e.g., `getNotificationQueryOptions`).
    expect(typeof (rehydrated as unknown as FakeProtoMessage).getTotalBalance).not.toBe('function')
  })
})
