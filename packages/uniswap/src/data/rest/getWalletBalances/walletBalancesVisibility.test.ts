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
  values: Partial<{ valueUsd: number; absoluteChange1d: number; percentChange1d: number }>,
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
})
