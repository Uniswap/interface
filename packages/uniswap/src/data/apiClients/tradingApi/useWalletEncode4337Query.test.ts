import { waitFor } from '@testing-library/react-native'
import { TradingApi } from '@universe/api'
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
