import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { useBlastExposure } from 'uniswap/src/features/chains/blastShutdown/useBlastExposure'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { portfolioBalance, SAMPLE_SEED_ADDRESS_1 } from 'uniswap/src/test/fixtures'
import { currencyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { renderHookWithProviders } from 'uniswap/src/test/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))
vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/accounts/store/hooks')>()),
  useActiveAddresses: vi.fn(),
}))
vi.mock('uniswap/src/features/portfolio/balances/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/portfolio/balances/hooks')>()),
  usePortfolioBalances: vi.fn(),
}))
vi.mock('uniswap/src/features/positions/hooks/useWalletPositions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/positions/hooks/useWalletPositions')>()),
  useWalletPositions: vi.fn(),
}))

function balanceOn({
  chainId,
  balanceUSD,
  isSpam = false,
}: {
  chainId: UniverseChainId
  balanceUSD: number
  isSpam?: boolean
}) {
  return portfolioBalance({
    balanceUSD,
    currencyInfo: { ...currencyInfo({ nativeCurrency: nativeOnChain(chainId) }), isSpam },
  })
}

function mockBalances({
  balances = [],
  isPending = false,
  isPlaceholderData = false,
  isError = false,
}: {
  balances?: ReturnType<typeof balanceOn>[]
  isPending?: boolean
  isPlaceholderData?: boolean
  isError?: boolean
}): void {
  vi.mocked(usePortfolioBalances).mockReturnValue({
    data: Object.fromEntries(balances.map((b) => [b.id, b])),
    loading: isPending,
    isPending,
    isPlaceholderData,
    isError,
    refetch: vi.fn(),
  })
}

function mockPositions({
  count = 0,
  isLoading = false,
  isPlaceholderData = false,
  error = null,
}: {
  count?: number
  isLoading?: boolean
  isPlaceholderData?: boolean
  error?: Error | null
}): void {
  const positions = Array.from({ length: count }, () => ({}) as PositionInfo)
  vi.mocked(useWalletPositions).mockReturnValue({
    positions,
    allPositions: positions,
    isLoading,
    isPlaceholderData,
    error,
  } as unknown as ReturnType<typeof useWalletPositions>)
}

describe(useBlastExposure, () => {
  beforeEach(() => {
    vi.mocked(useFeatureFlag).mockReturnValue(false)
    vi.mocked(useActiveAddresses).mockReturnValue({ evmAddress: SAMPLE_SEED_ADDRESS_1, svmAddress: undefined })
    mockBalances({})
    mockPositions({})
  })

  it('sums non-spam Blast balances against the $1 threshold', () => {
    mockBalances({
      balances: [
        balanceOn({ chainId: UniverseChainId.Blast, balanceUSD: 0.6 }),
        balanceOn({ chainId: UniverseChainId.Blast, balanceUSD: 0.4 }),
        balanceOn({ chainId: UniverseChainId.Blast, balanceUSD: 500, isSpam: true }),
        balanceOn({ chainId: UniverseChainId.Mainnet, balanceUSD: 500 }),
      ],
    })

    const { result } = renderHookWithProviders(useBlastExposure)

    expect(result.current).toEqual({ hasBalance: true, hasPositions: false, positionsUnknown: false, isLoading: false })
  })

  it('ignores Blast dust, spam and other chains below the threshold', () => {
    mockBalances({
      balances: [
        balanceOn({ chainId: UniverseChainId.Blast, balanceUSD: 0.99 }),
        balanceOn({ chainId: UniverseChainId.Blast, balanceUSD: 500, isSpam: true }),
        balanceOn({ chainId: UniverseChainId.Mainnet, balanceUSD: 500 }),
      ],
    })

    const { result } = renderHookWithProviders(useBlastExposure)

    expect(result.current.hasBalance).toBe(false)
  })

  it('reports open Blast positions', () => {
    mockPositions({ count: 2 })

    const { result } = renderHookWithProviders(useBlastExposure)

    expect(result.current).toEqual({ hasBalance: false, hasPositions: true, positionsUnknown: false, isLoading: false })
  })

  it("stays loading and unexposed while balances are the previous wallet's placeholder", () => {
    mockBalances({ balances: [balanceOn({ chainId: UniverseChainId.Blast, balanceUSD: 50 })], isPlaceholderData: true })
    mockPositions({ count: 1, isPlaceholderData: true })

    const { result } = renderHookWithProviders(useBlastExposure)

    expect(result.current).toEqual({ hasBalance: false, hasPositions: false, positionsUnknown: false, isLoading: true })
  })

  it('settles when both queries error, flagging positions as unknown', () => {
    mockBalances({ isPending: true, isError: true })
    mockPositions({ isLoading: true, error: new Error('boom') })

    const { result } = renderHookWithProviders(useBlastExposure)

    expect(result.current).toEqual({ hasBalance: false, hasPositions: false, positionsUnknown: true, isLoading: false })
  })

  it('is not exposed once disable_blast is on, and skips the Blast positions query', () => {
    vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.DisableBlast)
    mockBalances({ balances: [balanceOn({ chainId: UniverseChainId.Blast, balanceUSD: 50 })] })
    mockPositions({ count: 1 })

    const { result } = renderHookWithProviders(useBlastExposure)

    expect(result.current).toEqual({
      hasBalance: false,
      hasPositions: false,
      positionsUnknown: false,
      isLoading: false,
    })
    expect(useWalletPositions).toHaveBeenCalledWith(expect.objectContaining({ disabled: true }))
  })

  it('is not exposed or loading without a connected EVM address', () => {
    vi.mocked(useActiveAddresses).mockReturnValue({ evmAddress: undefined, svmAddress: undefined })
    mockBalances({ isPending: true })
    mockPositions({ isLoading: true })

    const { result } = renderHookWithProviders(useBlastExposure)

    expect(result.current).toEqual({
      hasBalance: false,
      hasPositions: false,
      positionsUnknown: false,
      isLoading: false,
    })
  })
})
