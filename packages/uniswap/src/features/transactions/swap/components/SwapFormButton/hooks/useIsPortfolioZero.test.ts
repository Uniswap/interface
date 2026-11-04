import {
  BalanceComponent,
  GetWalletBalancesResponse,
  WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { SharedQueryClient } from '@universe/api'
import { useIsPortfolioZero } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsPortfolioZero'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { waitFor } from 'uniswap/src/test/test-utils'

const EVM_ADDRESS = '0x4f3a000000000000000000000000000000000851'

const mocks = vi.hoisted(() => ({
  activeAddresses: {} as { evmAddress?: string; svmAddress?: string },
  getWalletBalances: vi.fn(),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/accounts/store/hooks')>()),
  useActiveAddresses: (): { evmAddress?: string; svmAddress?: string } => mocks.activeAddresses,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClient', () => ({
  dataApiServiceClientV1: { getWalletBalances: mocks.getWalletBalances },
}))

describe(useIsPortfolioZero, () => {
  beforeEach(() => {
    SharedQueryClient.clear()
    mocks.activeAddresses = { evmAddress: EVM_ADDRESS }
    mocks.getWalletBalances.mockResolvedValue(
      new GetWalletBalancesResponse({
        balance: new WalletBalance({ total: new BalanceComponent({ valueUsd: 0 }) }),
      }),
    )
  })

  it('is true for a connected account with a zero balance', async () => {
    const { result } = renderHookWithProviders(() => useIsPortfolioZero())

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('turns false once the account disconnects', async () => {
    const { result, rerender } = renderHookWithProviders(() => useIsPortfolioZero())
    await waitFor(() => expect(result.current).toBe(true))

    mocks.activeAddresses = {}
    rerender()

    expect(result.current).toBe(false)
  })

  it('is false with no connected account', () => {
    mocks.activeAddresses = {}

    const { result } = renderHookWithProviders(() => useIsPortfolioZero())

    expect(result.current).toBe(false)
    expect(mocks.getWalletBalances).not.toHaveBeenCalled()
  })
})
