import { QueryClient } from '@tanstack/react-query'
import type {
  BalanceComponent,
  GetWalletBalancesResponse,
  WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { getWalletBalancesQuery, PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import {
  applyWalletBalancesVisibilityDelta,
  createWalletBalancesVisibilityUpdater,
  type WalletBalancesVisibilityPart,
} from 'uniswap/src/data/rest/getWalletBalances/walletBalancesVisibility'

const TEST_EVM_ADDRESS_1 = '0x1234567890123456789012345678901234567890'
const TEST_EVM_ADDRESS_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
const TEST_SVM_ADDRESS_1 = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

function makeComponent(
  values: Partial<{ valueUsd: number; absoluteChange1d: number; percentChange1d: number; count: number }>,
): BalanceComponent {
  return values as unknown as BalanceComponent
}

function makeResponse(balance: Partial<WalletBalance> | undefined): GetWalletBalancesResponse {
  return { balance } as unknown as GetWalletBalancesResponse
}

const totalComponent = makeComponent({ valueUsd: 1000, absoluteChange1d: 25, percentChange1d: 2.5 })
const tokensComponent = makeComponent({ valueUsd: 600, absoluteChange1d: 15, percentChange1d: 2.6 })
const poolsComponent = makeComponent({ valueUsd: 400, absoluteChange1d: 10, percentChange1d: 2.4 })

const fullResponse = makeResponse({
  total: totalComponent,
  tokens: tokensComponent,
  pools: poolsComponent,
})

describe(applyWalletBalancesVisibilityDelta, () => {
  it('returns input unchanged when balance is missing', () => {
    const empty = makeResponse(undefined)
    expect(applyWalletBalancesVisibilityDelta({ data: empty, deltaUsd: -100, part: PortfolioBalancePart.Tokens })).toBe(
      empty,
    )
  })

  it('returns undefined when input is undefined', () => {
    expect(
      applyWalletBalancesVisibilityDelta({ data: undefined, deltaUsd: -100, part: PortfolioBalancePart.Tokens }),
    ).toBeUndefined()
  })

  it.each<{ part: WalletBalancesVisibilityPart; expectedTokens: number; expectedPools: number }>([
    { part: PortfolioBalancePart.Tokens, expectedTokens: 500, expectedPools: 400 },
    { part: PortfolioBalancePart.Pools, expectedTokens: 600, expectedPools: 300 },
  ])(
    'with part=$part, applies delta to total + $part and leaves the off-side untouched',
    ({ part, expectedTokens, expectedPools }) => {
      const updated = applyWalletBalancesVisibilityDelta({ data: fullResponse, deltaUsd: -100, part })
      expect(updated?.balance?.total?.valueUsd).toBe(900)
      expect(updated?.balance?.tokens?.valueUsd).toBe(expectedTokens)
      expect(updated?.balance?.pools?.valueUsd).toBe(expectedPools)
    },
  )

  it('applies countDelta to the side-part count but leaves the off-side count alone', () => {
    const withCounts = makeResponse({
      total: makeComponent({ valueUsd: 1000 }),
      tokens: makeComponent({ valueUsd: 600, count: 5 }),
      pools: makeComponent({ valueUsd: 400, count: 3 }),
    })

    const updated = applyWalletBalancesVisibilityDelta({
      data: withCounts,
      deltaUsd: -100,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
    })

    expect(updated?.balance?.pools?.count).toBe(2)
    expect(updated?.balance?.tokens?.count).toBe(5)
  })

  it('clamps both side-part and total valueUsd at 0 when a stale aggregate would go negative', () => {
    const stale = makeResponse({
      total: makeComponent({ valueUsd: 5 }),
      pools: makeComponent({ valueUsd: 5, count: 1 }),
    })

    const updated = applyWalletBalancesVisibilityDelta({
      data: stale,
      deltaUsd: -50,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
    })

    expect(updated?.balance?.pools?.valueUsd).toBe(0)
    expect(updated?.balance?.total?.valueUsd).toBe(0)
  })

  it('clamps the side-part count at 0 (does not go negative)', () => {
    const withCounts = makeResponse({
      total: makeComponent({ valueUsd: 1000 }),
      pools: makeComponent({ valueUsd: 100, count: 0 }),
    })

    const updated = applyWalletBalancesVisibilityDelta({
      data: withCounts,
      deltaUsd: -100,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
    })

    expect(updated?.balance?.pools?.count).toBe(0)
  })

  it('leaves the side-part count untouched when countDelta is zero or omitted', () => {
    const withCounts = makeResponse({
      total: makeComponent({ valueUsd: 1000 }),
      pools: makeComponent({ valueUsd: 400, count: 3 }),
    })

    const updated = applyWalletBalancesVisibilityDelta({
      data: withCounts,
      deltaUsd: -100,
      part: PortfolioBalancePart.Pools,
    })

    expect(updated?.balance?.pools?.count).toBe(3)
  })

  it('preserves undefined valueUsd rather than fabricating 0 from the delta', () => {
    const unset = makeResponse({
      total: makeComponent({}),
      pools: makeComponent({ count: 3 }),
    })

    const updated = applyWalletBalancesVisibilityDelta({
      data: unset,
      deltaUsd: -100,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
    })

    expect(updated?.balance?.pools?.valueUsd).toBeUndefined()
    expect(updated?.balance?.total?.valueUsd).toBeUndefined()
    // Count was defined, so it still moves.
    expect(updated?.balance?.pools?.count).toBe(2)
  })

  it('preserves undefined count rather than fabricating 0 from the delta', () => {
    const unset = makeResponse({
      total: makeComponent({ valueUsd: 1000 }),
      pools: makeComponent({ valueUsd: 400 }),
    })

    const updated = applyWalletBalancesVisibilityDelta({
      data: unset,
      deltaUsd: -100,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
    })

    expect(updated?.balance?.pools?.count).toBeUndefined()
    // ValueUsd was defined, so it still moves.
    expect(updated?.balance?.pools?.valueUsd).toBe(300)
  })
})

describe(createWalletBalancesVisibilityUpdater, () => {
  const evmInput = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [1] }
  const otherChainsInput = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [10] }
  const otherAddressInput = { evmAddress: TEST_EVM_ADDRESS_2, chainIds: [1] }
  const combinedInput = {
    evmAddress: TEST_EVM_ADDRESS_1,
    svmAddress: TEST_SVM_ADDRESS_1,
    chainIds: [1],
  }

  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  function primeCache(input: { evmAddress?: string; svmAddress?: string; chainIds?: number[] }): readonly unknown[] {
    const queryKey = getWalletBalancesQuery({ input }).queryKey
    queryClient.setQueryData<GetWalletBalancesResponse>(queryKey, fullResponse)
    return queryKey
  }

  it.each<{ part: WalletBalancesVisibilityPart; expectedTokens: number; expectedPools: number }>([
    { part: PortfolioBalancePart.Tokens, expectedTokens: 500, expectedPools: 400 },
    { part: PortfolioBalancePart.Pools, expectedTokens: 600, expectedPools: 300 },
  ])(
    'with part=$part, mutates the exact cache entry: total + $part move, the off-side does not',
    ({ part, expectedTokens, expectedPools }) => {
      const key = primeCache(evmInput)

      createWalletBalancesVisibilityUpdater(queryClient)({ input: evmInput, deltaUsd: -100, part })

      const after = queryClient.getQueryData<GetWalletBalancesResponse>(key)
      expect(after?.balance?.total?.valueUsd).toBe(900)
      expect(after?.balance?.tokens?.valueUsd).toBe(expectedTokens)
      expect(after?.balance?.pools?.valueUsd).toBe(expectedPools)
    },
  )

  it('leaves sibling entries with different chainIds untouched', () => {
    primeCache(evmInput)
    const siblingKey = primeCache(otherChainsInput)

    createWalletBalancesVisibilityUpdater(queryClient)({
      input: evmInput,
      deltaUsd: -100,
      part: PortfolioBalancePart.Tokens,
    })

    const sibling = queryClient.getQueryData<GetWalletBalancesResponse>(siblingKey)
    expect(sibling?.balance?.total?.valueUsd).toBe(1000)
    expect(sibling?.balance?.tokens?.valueUsd).toBe(600)
  })

  it('leaves sibling entries with different addresses untouched', () => {
    primeCache(evmInput)
    const siblingKey = primeCache(otherAddressInput)

    createWalletBalancesVisibilityUpdater(queryClient)({
      input: evmInput,
      deltaUsd: -100,
      part: PortfolioBalancePart.Tokens,
    })

    const sibling = queryClient.getQueryData<GetWalletBalancesResponse>(siblingKey)
    expect(sibling?.balance?.total?.valueUsd).toBe(1000)
  })

  it('updates a cached-but-inactive entry (no observer)', () => {
    const key = primeCache(evmInput)
    // Guards against observer-only filters that would miss inactive entries.
    createWalletBalancesVisibilityUpdater(queryClient)({
      input: evmInput,
      deltaUsd: -100,
      part: PortfolioBalancePart.Tokens,
    })

    expect(queryClient.getQueryData<GetWalletBalancesResponse>(key)?.balance?.total?.valueUsd).toBe(900)
  })

  it('applies the delta exactly once for a combined EVM+SVM-address query', () => {
    const key = primeCache(combinedInput)

    createWalletBalancesVisibilityUpdater(queryClient)({
      input: combinedInput,
      deltaUsd: -100,
      part: PortfolioBalancePart.Tokens,
    })

    const after = queryClient.getQueryData<GetWalletBalancesResponse>(key)
    expect(after?.balance?.total?.valueUsd).toBe(900)
    expect(after?.balance?.tokens?.valueUsd).toBe(500)
  })

  it('forwards countDelta through to the cached side-part', () => {
    const input = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [1] }
    const queryKey = getWalletBalancesQuery({ input }).queryKey
    queryClient.setQueryData<GetWalletBalancesResponse>(
      queryKey,
      makeResponse({
        total: makeComponent({ valueUsd: 1000 }),
        pools: makeComponent({ valueUsd: 400, count: 3 }),
      }),
    )

    createWalletBalancesVisibilityUpdater(queryClient)({
      input,
      deltaUsd: -100,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
    })

    const after = queryClient.getQueryData<GetWalletBalancesResponse>(queryKey)
    expect(after?.balance?.pools?.valueUsd).toBe(300)
    expect(after?.balance?.pools?.count).toBe(2)
  })

  it('with scanChainId, broad-scans cache entries by address and chainId membership', () => {
    // Two cached entries for the same wallet — one all-chains, one chain-filtered to [Mainnet].
    const allChainsInput = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [1, 10, 8453] }
    const filteredInput = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [1] }
    const otherChainInput = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [10] }

    const allChainsKey = getWalletBalancesQuery({ input: allChainsInput }).queryKey
    const filteredKey = getWalletBalancesQuery({ input: filteredInput }).queryKey
    const otherChainKey = getWalletBalancesQuery({ input: otherChainInput }).queryKey

    queryClient.setQueryData<GetWalletBalancesResponse>(
      allChainsKey,
      makeResponse({ total: makeComponent({ valueUsd: 1000 }), pools: makeComponent({ valueUsd: 400, count: 3 }) }),
    )
    queryClient.setQueryData<GetWalletBalancesResponse>(
      filteredKey,
      makeResponse({ total: makeComponent({ valueUsd: 500 }), pools: makeComponent({ valueUsd: 200, count: 1 }) }),
    )
    queryClient.setQueryData<GetWalletBalancesResponse>(
      otherChainKey,
      makeResponse({ total: makeComponent({ valueUsd: 250 }), pools: makeComponent({ valueUsd: 100, count: 1 }) }),
    )

    createWalletBalancesVisibilityUpdater(queryClient)({
      input: allChainsInput,
      deltaUsd: -100,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
      scanChainId: 1, // position is on chain 1
    })

    // Both entries that include chain 1 are mutated.
    expect(queryClient.getQueryData<GetWalletBalancesResponse>(allChainsKey)?.balance?.pools?.valueUsd).toBe(300)
    expect(queryClient.getQueryData<GetWalletBalancesResponse>(allChainsKey)?.balance?.pools?.count).toBe(2)
    expect(queryClient.getQueryData<GetWalletBalancesResponse>(filteredKey)?.balance?.pools?.valueUsd).toBe(100)
    expect(queryClient.getQueryData<GetWalletBalancesResponse>(filteredKey)?.balance?.pools?.count).toBe(0)
    // The chain-10-only entry is left alone — its aggregate never included this position.
    expect(queryClient.getQueryData<GetWalletBalancesResponse>(otherChainKey)?.balance?.pools?.valueUsd).toBe(100)
    expect(queryClient.getQueryData<GetWalletBalancesResponse>(otherChainKey)?.balance?.pools?.count).toBe(1)
  })

  it('with scanChainId, leaves sibling addresses untouched', () => {
    const userInput = { evmAddress: TEST_EVM_ADDRESS_1, chainIds: [1] }
    const otherUserInput = { evmAddress: TEST_EVM_ADDRESS_2, chainIds: [1] }
    const userKey = getWalletBalancesQuery({ input: userInput }).queryKey
    const otherKey = getWalletBalancesQuery({ input: otherUserInput }).queryKey

    queryClient.setQueryData<GetWalletBalancesResponse>(userKey, fullResponse)
    queryClient.setQueryData<GetWalletBalancesResponse>(otherKey, fullResponse)

    createWalletBalancesVisibilityUpdater(queryClient)({
      input: userInput,
      deltaUsd: -100,
      countDelta: -1,
      part: PortfolioBalancePart.Pools,
      scanChainId: 1,
    })

    expect(queryClient.getQueryData<GetWalletBalancesResponse>(userKey)?.balance?.pools?.valueUsd).toBe(300)
    expect(queryClient.getQueryData<GetWalletBalancesResponse>(otherKey)?.balance?.pools?.valueUsd).toBe(400)
  })
})
