import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { usePortfolioSectionTotalValue } from '~/pages/Portfolio/Overview/hooks/usePortfolioSectionTotalValue'
import { mocked } from '~/test-utils/mocked'
import { renderHook } from '~/test-utils/render'

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioBalanceBreakdown: vi.fn(),
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: vi.fn(),
}))

vi.mock('~/pages/Portfolio/hooks/usePortfolioAddresses', () => ({
  usePortfolioAddresses: vi.fn(),
}))

const EVM_ADDRESS = '0x0000000000000000000000000000000000000001'

function mockBreakdown({
  tokensUSD,
  poolsUSD,
  loading = false,
}: {
  tokensUSD?: number
  poolsUSD?: number
  loading?: boolean
}): void {
  mocked(usePortfolioBalanceBreakdown).mockReturnValue({
    data:
      tokensUSD === undefined && poolsUSD === undefined
        ? undefined
        : {
            total: { balanceUSD: (tokensUSD ?? 0) + (poolsUSD ?? 0) },
            tokens: { balanceUSD: tokensUSD },
            pools: { balanceUSD: poolsUSD },
          },
    loading,
  } as ReturnType<typeof usePortfolioBalanceBreakdown>)
}

describe('usePortfolioSectionTotalValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(usePortfolioAddresses).mockReturnValue({
      evmAddress: EVM_ADDRESS,
      svmAddress: undefined,
      isExternalWallet: false,
    })
    mocked(useLocalizationContext).mockReturnValue({
      convertFiatAmountFormatted: (value: number) => `$${value}`,
    } as unknown as ReturnType<typeof useLocalizationContext>)
  })

  it('formats the selected part and exposes its numeric value', () => {
    mockBreakdown({ tokensUSD: 8783.76, poolsUSD: 6958.23 })

    const { result } = renderHook(() =>
      usePortfolioSectionTotalValue({ part: PortfolioBalancePart.Tokens, enabled: true }),
    )

    expect(result.current.totalValueFormatted).toBe('$8783.76')
    expect(result.current.totalValueNumeric).toBe(8783.76)
    expect(result.current.totalValueLoading).toBe(false)
  })

  it('reads the pools slice when part is "pools"', () => {
    mockBreakdown({ tokensUSD: 8783.76, poolsUSD: 6958.23 })

    const { result } = renderHook(() =>
      usePortfolioSectionTotalValue({ part: PortfolioBalancePart.Pools, enabled: true }),
    )

    expect(result.current.totalValueFormatted).toBe('$6958.23')
    expect(result.current.totalValueNumeric).toBe(6958.23)
  })

  it('returns an undefined total when the slice balance is unavailable', () => {
    mockBreakdown({ tokensUSD: 8783.76, poolsUSD: undefined })

    const { result } = renderHook(() =>
      usePortfolioSectionTotalValue({ part: PortfolioBalancePart.Pools, enabled: true }),
    )

    expect(result.current.totalValueFormatted).toBeUndefined()
    expect(result.current.totalValueNumeric).toBeUndefined()
  })

  it('reports loading only while the balance is still unavailable', () => {
    mockBreakdown({ loading: true })

    const { result } = renderHook(() =>
      usePortfolioSectionTotalValue({ part: PortfolioBalancePart.Tokens, enabled: true }),
    )

    expect(result.current.totalValueLoading).toBe(true)
    expect(result.current.totalValueFormatted).toBeUndefined()
  })

  it('does not report loading once the balance has resolved', () => {
    mockBreakdown({ tokensUSD: 8783.76, loading: true })

    const { result } = renderHook(() =>
      usePortfolioSectionTotalValue({ part: PortfolioBalancePart.Tokens, enabled: true }),
    )

    expect(result.current.totalValueLoading).toBe(false)
    expect(result.current.totalValueFormatted).toBe('$8783.76')
  })

  it('passes the resolved chain to the breakdown query', () => {
    mockBreakdown({ tokensUSD: 100 })

    renderHook(() =>
      usePortfolioSectionTotalValue({
        part: PortfolioBalancePart.Tokens,
        chainId: UniverseChainId.Base,
        enabled: true,
      }),
    )

    expect(usePortfolioBalanceBreakdown).toHaveBeenCalledWith(
      expect.objectContaining({ chainIds: [UniverseChainId.Base], enabled: true }),
    )
  })

  it('forwards the enabled flag to the breakdown query', () => {
    mockBreakdown({})

    renderHook(() => usePortfolioSectionTotalValue({ part: PortfolioBalancePart.Tokens, enabled: false }))

    expect(usePortfolioBalanceBreakdown).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('returns no total when disabled even if the shared breakdown cache is populated', () => {
    mockBreakdown({ tokensUSD: 8783.76, poolsUSD: 6958.23 })

    const { result } = renderHook(() =>
      usePortfolioSectionTotalValue({ part: PortfolioBalancePart.Tokens, enabled: false }),
    )

    expect(result.current.totalValueFormatted).toBeUndefined()
    expect(result.current.totalValueNumeric).toBeUndefined()
    expect(result.current.totalValueLoading).toBe(false)
  })
})
