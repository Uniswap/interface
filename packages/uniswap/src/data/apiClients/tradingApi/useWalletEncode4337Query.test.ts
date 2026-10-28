import { waitFor } from '@testing-library/react-native'
import { SharedQueryClient, TradingApi } from '@universe/api'
import { useWalletEncode4337Query } from 'uniswap/src/data/apiClients/tradingApi/useWalletEncode4337Query'
import { renderHook } from 'uniswap/src/test/test-utils'
import { vi } from 'vitest'

const mockFetchWalletEncoding4337 = vi.fn()

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: {
    fetchWalletEncoding4337: (params: TradingApi.Encode4337Request): Promise<TradingApi.Encode4337Response> =>
      mockFetchWalletEncoding4337(params),
  },
}))

const baseUserOperation = {
  sender: '0x1111111111111111111111111111111111111111',
  nonce: '0x0',
  callData: '0x',
} as unknown as TradingApi.UserOperation

// Distinct params per test so query keys don't collide on the shared QueryClient.
const baseParams: TradingApi.Encode4337Request = {
  calls: [],
  sender: '0x1111111111111111111111111111111111111111',
  chainId: 1 as TradingApi.ChainId,
}

function paymasterParamsFor(sender: string): TradingApi.Encode4337Request {
  return {
    ...baseParams,
    sender,
    paymasterUrl: 'https://paymaster.example/rpc',
    paymasterServiceContext: { policyId: 'abc' },
  }
}

describe('useWalletEncode4337Query — sponsorship delivery', () => {
  beforeEach(() => {
    mockFetchWalletEncoding4337.mockReset()
  })

  it('returns the userOperation when sponsorship was requested and granted', async () => {
    mockFetchWalletEncoding4337.mockResolvedValue({
      requestId: '1',
      userOperation: baseUserOperation,
      gasSponsored: true,
    } satisfies TradingApi.Encode4337Response)

    const { result } = renderHook(() =>
      useWalletEncode4337Query({
        params: paymasterParamsFor('0xaaaa000000000000000000000000000000000001'),
        retry: false,
      }),
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.gasSponsored).toBe(true)
  })

  it('errors when a paymasterUrl was provided but the response is gasSponsored=false', async () => {
    mockFetchWalletEncoding4337.mockResolvedValue({
      requestId: '1',
      userOperation: baseUserOperation,
      gasSponsored: false,
      gasSponsorshipRejectionReason: 'policy_rejected',
    } satisfies TradingApi.Encode4337Response)

    const { result } = renderHook(() =>
      useWalletEncode4337Query({
        params: paymasterParamsFor('0xbbbb000000000000000000000000000000000002'),
        retry: false,
      }),
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('does not error on gasSponsored=false when no paymasterUrl was requested (unsponsored encode is valid)', async () => {
    mockFetchWalletEncoding4337.mockResolvedValue({
      requestId: '1',
      userOperation: baseUserOperation,
      gasSponsored: false,
    } satisfies TradingApi.Encode4337Response)

    const { result } = renderHook(() => useWalletEncode4337Query({ params: baseParams, retry: false }))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.userOperation).toBeDefined()
  })
})

describe('useWalletEncode4337Query call-order cache identity', () => {
  type Call = TradingApi.Encode4337Request['calls'][number]
  const call = (data: string): Call =>
    ({ chainId: 1, from: baseParams.sender, to: baseParams.sender, data, value: '0x0' }) as unknown as Call
  const grant = call('0x01')
  const pull = call('0x02')
  const revoke = call('0x03')

  beforeEach(() => {
    SharedQueryClient.clear()
    mockFetchWalletEncoding4337.mockReset()
  })

  it('fetches a reordered batch instead of reusing the previous encoding', async () => {
    mockFetchWalletEncoding4337
      .mockResolvedValueOnce({ requestId: 'op-A', userOperation: baseUserOperation, gasSponsored: false })
      .mockResolvedValueOnce({ requestId: 'op-B', userOperation: baseUserOperation, gasSponsored: false })

    const a = renderHook(() =>
      useWalletEncode4337Query({ params: { ...baseParams, calls: [grant, pull, revoke] }, retry: false }),
    )
    await waitFor(() => expect(a.result.current.isSuccess).toBe(true))
    a.unmount()

    const b = renderHook(() =>
      useWalletEncode4337Query({ params: { ...baseParams, calls: [grant, revoke, pull] }, retry: false }),
    )
    await waitFor(() => expect(b.result.current.isSuccess).toBe(true))

    expect(mockFetchWalletEncoding4337).toHaveBeenCalledTimes(2)
    expect(b.result.current.data?.requestId).toBe('op-B')
  })
})
