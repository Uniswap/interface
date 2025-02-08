import { useSortedAccountList } from 'src/app/features/accounts/useSortedAccountList'
import { act, renderHook } from 'src/test/test-utils'
import { useAccountListData } from 'wallet/src/features/accounts/useAccountListData'

jest.mock('wallet/src/features/accounts/useAccountListData')
const mockUseAccountList = useAccountListData as jest.MockedFunction<typeof useAccountListData>

describe('useSortedAccountList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should sort addresses by balance in descending order', () => {
    mockAccountList([mockPortfolio('address1', 100), mockPortfolio('address2', 200), mockPortfolio('address3', 150)])

    const addresses = ['address1', 'address2', 'address3']
    const { result } = renderHook(() => useSortedAccountList(addresses))

    expect(result.current).toEqual([
      { address: 'address2', balance: 200 },
      { address: 'address3', balance: 150 },
      { address: 'address1', balance: 100 },
    ])
  })

  it('should handle undefined portfolios', () => {
    mockAccountList(undefined)

    const addresses = ['address1', 'address2']
    const { result } = renderHook(() => useSortedAccountList(addresses))

    expect(result.current).toEqual([
      { address: 'address1', balance: 0 },
      { address: 'address2', balance: 0 },
    ])
  })

  it('should use previous data during balance updates', () => {
    mockAccountList([mockPortfolio('address1', 100), mockPortfolio('address2', 200)])

    const addresses = ['address1', 'address2']
    const { result, rerender } = renderHook((props) => useSortedAccountList(props), { initialProps: addresses })

    expect(result.current).toEqual([
      { address: 'address2', balance: 200 },
      { address: 'address1', balance: 100 },
    ])

    mockAccountList([mockPortfolio('address1', 100)], true)
    rerender(['address1'])

    expect(result.current).toEqual([{ address: 'address1', balance: 100 }])
  })

  it('should keep list order when an account is removed', async () => {
    mockAccountList([mockPortfolio('address1', 100), mockPortfolio('address2', 200), mockPortfolio('address3', 300)])

    const addresses = ['address1', 'address2', 'address3']
    const { result, rerender } = renderHook((props) => useSortedAccountList(props), { initialProps: addresses })

    expect(result.current).toEqual([
      { address: 'address3', balance: 300 },
      { address: 'address2', balance: 200 },
      { address: 'address1', balance: 100 },
    ])

    mockAccountListUndefined()

    await act(async () => {
      rerender(['address1', 'address2'])
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(result.current).toEqual([
      { address: 'address2', balance: 200 },
      { address: 'address1', balance: 100 },
    ])

    mockAccountList([mockPortfolio('address1', 100), mockPortfolio('address2', 200)])

    await act(async () => {
      rerender(['address1', 'address2'])
    })

    expect(result.current).toEqual([
      { address: 'address2', balance: 200 },
      { address: 'address1', balance: 100 },
    ])
  })
})

function mockPortfolio(
  ownerAddress: Address,
  balance: number,
): {
  id: string
  ownerAddress: Address
  tokensTotalDenominatedValue: { __typename?: 'Amount'; value: number }
} {
  return {
    id: ownerAddress,
    ownerAddress,
    tokensTotalDenominatedValue: { __typename: 'Amount', value: balance },
  }
}

function mockAccountList(portfolios: ReturnType<typeof mockPortfolio>[] | undefined, loading = false): void {
  mockUseAccountList.mockReturnValue({
    data: { portfolios },
    loading,
    networkStatus: 7,
    refetch: jest.fn(),
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
  })
}

function mockAccountListUndefined(): void {
  mockUseAccountList.mockReturnValue({
    data: undefined,
    loading: true,
    networkStatus: 7,
    refetch: jest.fn(),
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
  })
}
