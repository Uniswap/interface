import type { UseQueryResult } from '@tanstack/react-query'
import { type RenderHookResult, waitFor } from '@testing-library/react-native'
import { SharedQueryClient, TradingApi } from '@universe/api'
import { useWalletEncode7702Query } from 'uniswap/src/data/apiClients/tradingApi/useWalletEncode7702Query'
import { renderHook } from 'uniswap/src/test/test-utils'
import { vi } from 'vitest'

const mockFetchWalletEncoding7702 = vi.fn()

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: {
    fetchWalletEncoding7702: (
      params: TradingApi.WalletEncode7702RequestBody,
    ): Promise<TradingApi.Encode7702ResponseBody> => mockFetchWalletEncoding7702(params),
  },
}))

const WALLET = '0x1111111111111111111111111111111111111111'
const DELEGATION = '0x2222222222222222222222222222222222222222'
const TOKEN = '0x00000000e20e49e6dcee6e8283a0c090578f0fb9'
const MULTICALL = '0xca11bde05977b3631167028862be2a173976ca11'

const grant = { chainId: 1, from: WALLET, to: TOKEN, data: `0x095ea7b3${'11'.repeat(64)}`, value: '0x0' }
const revoke = { chainId: 1, from: WALLET, to: TOKEN, data: `0x095ea7b3${'00'.repeat(64)}`, value: '0x0' }
const pull = { chainId: 1, from: WALLET, to: MULTICALL, data: `0x82ad56cb${'ab'.repeat(64)}`, value: '0x0' }

function paramsFor(calls: (typeof grant)[]): TradingApi.WalletEncode7702RequestBody {
  return {
    walletAddress: WALLET,
    smartContractDelegationAddress: DELEGATION,
    calls,
  } as unknown as TradingApi.WalletEncode7702RequestBody
}

const paramsA = paramsFor([grant, pull, revoke])
const paramsB = paramsFor([grant, revoke, pull])

const responseA = {
  requestId: 'encoding-A',
  encoded: { chainId: 1, from: WALLET, to: WALLET, data: '0xaaaa', value: '0x0' },
}
const responseB = {
  requestId: 'encoding-B',
  encoded: { chainId: 1, from: WALLET, to: WALLET, data: '0xbbbb', value: '0x0' },
}

function mount(
  params: TradingApi.WalletEncode7702RequestBody,
): RenderHookResult<UseQueryResult<TradingApi.Encode7702ResponseBody>, unknown> {
  return renderHook(() => useWalletEncode7702Query({ params, retry: false }))
}

describe('useWalletEncode7702Query call-order cache identity', () => {
  beforeEach(() => {
    SharedQueryClient.clear()
    mockFetchWalletEncoding7702.mockReset()
  })

  it('hashes permutations of the same calls to distinct queries', async () => {
    mockFetchWalletEncoding7702.mockResolvedValueOnce(responseA).mockResolvedValueOnce(responseB)

    const a = mount(paramsA)
    const b = mount(paramsB)
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))

    const hashes = SharedQueryClient.getQueryCache()
      .getAll()
      .map((query) => query.queryHash)
    expect(hashes).toHaveLength(2)
    expect(new Set(hashes).size).toBe(2)
  })

  it('does not serve a completed, unmounted batch to a reordered batch', async () => {
    mockFetchWalletEncoding7702.mockResolvedValueOnce(responseA).mockResolvedValueOnce(responseB)

    const a = mount(paramsA)
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true))
    a.unmount()

    const b = mount(paramsB)
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))

    expect(mockFetchWalletEncoding7702).toHaveBeenCalledTimes(2)
    expect(mockFetchWalletEncoding7702).toHaveBeenNthCalledWith(2, paramsB)
    expect(b.result.current.data).toEqual(responseB)
  })

  it('does not join an in-flight batch that differs only in call order', async () => {
    let resolveA: ((value: typeof responseA) => void) | undefined
    mockFetchWalletEncoding7702
      .mockReturnValueOnce(
        new Promise<typeof responseA>((resolve) => {
          resolveA = resolve
        }),
      )
      .mockResolvedValueOnce(responseB)

    const a = mount(paramsA)
    await waitFor(() => expect(mockFetchWalletEncoding7702).toHaveBeenCalledTimes(1))
    a.unmount()

    const b = mount(paramsB)
    await waitFor(() => expect(mockFetchWalletEncoding7702).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))
    expect(b.result.current.data).toEqual(responseB)

    resolveA?.(responseA)
    await waitFor(() =>
      expect(
        SharedQueryClient.getQueryCache()
          .getAll()
          .every((query) => query.state.status === 'success'),
      ).toBe(true),
    )
    expect(b.result.current.data).toEqual(responseB)
  })
})
