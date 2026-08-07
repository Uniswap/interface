import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { TradingApi, type CheckPermissionsRequest, type CheckPermissionsResponse } from '@universe/api'
import { createElement, type ReactNode } from 'react'
import { hasKnownPermissionedToken } from 'uniswap/src/data/apiClients/tradingApi/permissionedTokenStatusCache'
import { useCheckPermissionsQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckPermissionsQuery'

const { mockFetchCheckPermissions } = vi.hoisted(() => ({ mockFetchCheckPermissions: vi.fn() }))

// Only `fetchCheckPermissions` is exercised on this path; stub the module so the test stays a
// focused hook-seam test and doesn't pull in SharedQueryClient/gating.
vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: { fetchCheckPermissions: (...args: unknown[]) => mockFetchCheckPermissions(...args) },
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const CHAIN_ID = TradingApi.ChainId._11155111
const PERMISSIONED_TOKEN = '0xbf56488c857A881ae7e3BED27Cf99c10A7Ab7e50'
const STANDARD_TOKEN = '0x1F46ea239595706960a9208897968b169db1b89c'
const WALLET = '0xaaaaBBBBccccDDDDeeeeFFFF000011112222Aaaa'

const params: CheckPermissionsRequest = {
  walletAddress: WALLET,
  tokens: [PERMISSIONED_TOKEN, STANDARD_TOKEN],
  chainId: CHAIN_ID,
}

const response: CheckPermissionsResponse = {
  requestId: 'req-1',
  results: [
    {
      token: PERMISSIONED_TOKEN,
      isPermissioned: true,
      isAllowlisted: true,
      adapterTokenAddress: '0xeF1dC9ABD8A7E073CFDDA453C775e7cE24e4A4C8',
      issuer: 'issuer',
    },
    { token: STANDARD_TOKEN, isPermissioned: false },
  ],
}

describe('useCheckPermissionsQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  })

  const wrapper = ({ children }: { children: ReactNode }): ReturnType<typeof createElement> =>
    createElement(QueryClientProvider, { client: queryClient }, children)

  it('seeds confirmed-permissioned tokens into the persistent cache on a successful fetch', async () => {
    mockFetchCheckPermissions.mockResolvedValue(response)

    const { result } = renderHook(() => useCheckPermissionsQuery({ params }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [PERMISSIONED_TOKEN] })).toBe(
      true,
    )
    // The non-permissioned token in the same response is never seeded (positives only).
    expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [STANDARD_TOKEN] })).toBe(false)
  })

  it('does not seed when the fetch fails', async () => {
    mockFetchCheckPermissions.mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useCheckPermissionsQuery({ params }), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(hasKnownPermissionedToken({ queryClient, chainId: CHAIN_ID, tokenAddresses: [PERMISSIONED_TOKEN] })).toBe(
      false,
    )
  })
})
