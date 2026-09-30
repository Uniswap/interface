import { UniverseChainId } from '@universe/chains'
import { useBalances } from 'uniswap/src/data/apiClients/dataApiService/balances/hooks/useBalances'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { portfolioBalance, SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import { ethV2Token, usdcBaseV2Token } from 'uniswap/src/test/fixtures/dataApi/tokens'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

vi.mock('uniswap/src/features/portfolio/balances/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/portfolio/balances/hooks')>()),
  usePortfolioBalances: vi.fn(),
}))

const USDC_BASE_CHECKSUMMED = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

describe(useBalances, () => {
  const usdcBaseBalance = portfolioBalance({ fromToken: usdcBaseV2Token() })
  const ethBalance = portfolioBalance({ fromToken: ethV2Token() })

  beforeEach(() => {
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: {
        [usdcBaseBalance.currencyInfo.currencyId]: usdcBaseBalance,
        [ethBalance.currencyInfo.currencyId]: ethBalance,
      },
      loading: false,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      error: undefined,
    } as unknown as ReturnType<typeof usePortfolioBalances>)
  })

  it('finds a lowercase-keyed balance from a checksummed currency id', () => {
    expect(usdcBaseBalance.currencyInfo.currencyId).toBe(
      buildCurrencyId(UniverseChainId.Base, USDC_BASE_CHECKSUMMED.toLowerCase()),
    )

    const { result } = renderHookWithProviders(() =>
      useBalances({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        currencies: [buildCurrencyId(UniverseChainId.Base, USDC_BASE_CHECKSUMMED)],
      }),
    )

    expect(result.current).toEqual([usdcBaseBalance])
  })

  it('finds a native balance from the native currency id', () => {
    const { result } = renderHookWithProviders(() =>
      useBalances({ evmAddress: SAMPLE_SEED_ADDRESS_1, currencies: [buildNativeCurrencyId(UniverseChainId.Mainnet)] }),
    )

    expect(result.current).toEqual([ethBalance])
  })

  it('drops currencies without a balance and returns null when nothing is requested', () => {
    const { result } = renderHookWithProviders(() =>
      useBalances({
        evmAddress: SAMPLE_SEED_ADDRESS_1,
        currencies: [buildNativeCurrencyId(UniverseChainId.Base), buildNativeCurrencyId(UniverseChainId.Mainnet)],
      }),
    )
    expect(result.current).toEqual([ethBalance])

    const { result: empty } = renderHookWithProviders(() =>
      useBalances({ evmAddress: SAMPLE_SEED_ADDRESS_1, currencies: [] }),
    )
    expect(empty.current).toBeNull()
  })
})
