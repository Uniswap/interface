import { useGetWalletsBalancesQuery } from 'uniswap/src/data/rest/getWalletsBalances/getWalletsBalances'
import type { MockedFunction } from 'vitest'
import { useAccountBalances, useAccountListData } from 'wallet/src/features/accounts/useAccountListData'
import { renderHook } from 'wallet/src/test/test-utils'

vi.mock('uniswap/src/data/rest/getWalletsBalances/getWalletsBalances', async () => ({
  ...(await vi.importActual('uniswap/src/data/rest/getWalletsBalances/getWalletsBalances')),
  useGetWalletsBalancesQuery: vi.fn(),
}))

vi.mock('uniswap/src/data/rest/getWalletBalances/getWalletBalances', async () => ({
  ...(await vi.importActual('uniswap/src/data/rest/getWalletBalances/getWalletBalances')),
  useWalletBalancesIncludeCategories: vi.fn().mockReturnValue([]),
}))

vi.mock('uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier', () => ({
  useRestPortfolioValueModifiers: vi.fn().mockReturnValue(undefined),
}))

const mockUseGetWalletsBalancesQuery = useGetWalletsBalancesQuery as MockedFunction<typeof useGetWalletsBalancesQuery>

const ADDRESS_1 = '0x1234567890123456789012345678901234567890'
const ADDRESS_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

function mockQueryResult({
  data,
  isLoading = false,
  isPlaceholderData = false,
}: {
  data: AddressTo<number | undefined> | undefined
  isLoading?: boolean
  isPlaceholderData?: boolean
}): void {
  mockUseGetWalletsBalancesQuery.mockReturnValue({
    data,
    isLoading,
    isPlaceholderData,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useGetWalletsBalancesQuery>)
}

describe('useAccountListData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns balances keyed by address once loaded', () => {
    mockQueryResult({ data: { [ADDRESS_1]: 100, [ADDRESS_2]: 200 } })

    const { result } = renderHook(() => useAccountListData({ addresses: [ADDRESS_1, ADDRESS_2] }))

    expect(result.current.balancesByAddress).toEqual({ [ADDRESS_1]: 100, [ADDRESS_2]: 200 })
    expect(result.current.loading).toBe(false)
  })

  it('is loading while the first fetch is pending', () => {
    mockQueryResult({ data: undefined, isLoading: true })

    const { result } = renderHook(() => useAccountListData({ addresses: [ADDRESS_1] }))

    expect(result.current.loading).toBe(true)
  })

  it('is loading while showing placeholder data from a previous address tuple', () => {
    mockQueryResult({ data: { [ADDRESS_1]: 100 }, isPlaceholderData: true })

    const { result } = renderHook(() => useAccountListData({ addresses: [ADDRESS_1, ADDRESS_2] }))

    expect(result.current.loading).toBe(true)
    expect(result.current.balancesByAddress).toEqual({ [ADDRESS_1]: 100 })
  })

  it('disables the query when there are no addresses', () => {
    mockQueryResult({ data: undefined, isLoading: true })

    renderHook(() => useAccountListData({ addresses: [] }))

    expect(mockUseGetWalletsBalancesQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('requests one wallet per address and forwards the refetch interval', () => {
    mockQueryResult({ data: undefined, isLoading: true })

    renderHook(() => useAccountListData({ addresses: [ADDRESS_1, ADDRESS_2], refetchInterval: 1000 }))

    expect(mockUseGetWalletsBalancesQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        refetchInterval: 1000,
        input: expect.objectContaining({
          wallets: [{ evmAddress: ADDRESS_1 }, { evmAddress: ADDRESS_2 }],
        }),
      }),
    )
  })
})

describe('useAccountBalances', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns defined balances in address order and their sum', () => {
    mockQueryResult({ data: { [ADDRESS_1]: 100, [ADDRESS_2]: undefined } })

    const { result } = renderHook(() => useAccountBalances({ addresses: [ADDRESS_1, ADDRESS_2] }))

    expect(result.current.balances).toEqual([100])
    expect(result.current.totalBalance).toBe(100)
  })

  it('returns empty balances while data is missing', () => {
    mockQueryResult({ data: undefined, isLoading: true })

    const { result } = renderHook(() => useAccountBalances({ addresses: [ADDRESS_1] }))

    expect(result.current.balances).toEqual([])
    expect(result.current.totalBalance).toBe(0)
  })
})
