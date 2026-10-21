import { Token } from '@uniswap/sdk-core'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { nativeOnChain, OUSD_TEMPO, PATHUSD_TEMPO, USDC_E_TEMPO } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useAccountGasToken, useChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'

const mockFetchTempoFeeTokenPreference = vi.fn<(accountAddress?: Address) => Promise<Address | null>>()

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return { ...actual, useFeatureFlag: vi.fn() }
})

vi.mock('uniswap/src/features/gas/tempoFeeToken/tempoFeeToken', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/gas/tempoFeeToken/tempoFeeToken')>()
  return {
    ...actual,
    getTempoFeeTokenPreferenceQueryOptions: (
      accountAddress?: Address,
    ): ReturnType<typeof actual.getTempoFeeTokenPreferenceQueryOptions> => ({
      ...actual.getTempoFeeTokenPreferenceQueryOptions(accountAddress),
      queryFn: (): Promise<Address | null> => mockFetchTempoFeeTokenPreference(accountAddress),
    }),
  }
})

vi.mock('uniswap/src/features/portfolio/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/portfolio/api')>()
  return {
    ...actual,
    useOnChainCurrencyBalance: vi.fn(() => ({ balance: undefined, isLoading: false, error: undefined })),
  }
})

const ACCOUNT = '0x889b6fb6af37bfaa257e1fcf2913afe0b42313cf'
const OUSD_ADDRESS = '0x20c0000000000000000000006a37da5c996874be'

function setFlag(enabled: boolean): void {
  vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.TempoFeeTokenPreference && enabled)
}

describe(useAccountGasToken, () => {
  beforeEach(() => {
    SharedQueryClient.clear()
    mockFetchTempoFeeTokenPreference.mockReset()
    setFlag(true)
  })

  it('returns the stored fee token preference on Tempo', async () => {
    mockFetchTempoFeeTokenPreference.mockResolvedValue(OUSD_ADDRESS)

    const { result } = renderHook(() => useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT }))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.gasToken).toBe(OUSD_TEMPO)
  })

  it('returns any other stored USD TIP-20, e.g. USDC.e', async () => {
    mockFetchTempoFeeTokenPreference.mockResolvedValue('0x20c000000000000000000000b9537d11c60e8b50')

    const { result } = renderHook(() => useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.gasToken).toBe(USDC_E_TEMPO)
  })

  it('returns pathUSD when no fee token is stored', async () => {
    mockFetchTempoFeeTokenPreference.mockResolvedValue(null)

    const { result } = renderHook(() => useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFetchTempoFeeTokenPreference).toHaveBeenCalledTimes(1)
    expect(result.current.gasToken).toBe(PATHUSD_TEMPO)
  })

  it('returns the sent USD stablecoin when no fee token is stored', async () => {
    mockFetchTempoFeeTokenPreference.mockResolvedValue(null)

    const { result } = renderHook(() =>
      useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT, sendCurrency: USDC_E_TEMPO }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.gasToken).toBe(USDC_E_TEMPO)
  })

  it('keeps the stored fee token over the sent currency', async () => {
    mockFetchTempoFeeTokenPreference.mockResolvedValue(OUSD_ADDRESS)

    const { result } = renderHook(() =>
      useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT, sendCurrency: USDC_E_TEMPO }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.gasToken).toBe(OUSD_TEMPO)
  })

  it('returns pathUSD when the sent token is not a USD fee token', async () => {
    mockFetchTempoFeeTokenPreference.mockResolvedValue(null)
    const nonUsdToken = new Token(UniverseChainId.Tempo, '0x20c0000000000000000000000000000000000abc', 6, 'EURX')

    const { result } = renderHook(() =>
      useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT, sendCurrency: nonUsdToken }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.gasToken).toBe(PATHUSD_TEMPO)
  })

  it('ignores the sent currency when the flag is off', () => {
    setFlag(false)

    const { result } = renderHook(() =>
      useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT, sendCurrency: USDC_E_TEMPO }),
    )

    expect(result.current).toEqual({ gasToken: PATHUSD_TEMPO, isLoading: false })
  })

  it('falls back to pathUSD when the preference read fails', async () => {
    mockFetchTempoFeeTokenPreference.mockRejectedValue(new Error('rpc down'))

    const { result } = renderHook(() => useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT }))

    await waitFor(() => expect(mockFetchTempoFeeTokenPreference).toHaveBeenCalled())
    expect(result.current.gasToken).toBe(PATHUSD_TEMPO)
  })

  it('returns pathUSD without reading the preference when the flag is off', () => {
    setFlag(false)
    mockFetchTempoFeeTokenPreference.mockResolvedValue(OUSD_ADDRESS)

    const { result } = renderHook(() => useAccountGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT }))

    expect(result.current).toEqual({ gasToken: PATHUSD_TEMPO, isLoading: false })
    expect(mockFetchTempoFeeTokenPreference).not.toHaveBeenCalled()
  })

  it('returns pathUSD without reading the preference when there is no account', () => {
    const { result } = renderHook(() => useAccountGasToken({ chainId: UniverseChainId.Tempo }))

    expect(result.current).toEqual({ gasToken: PATHUSD_TEMPO, isLoading: false })
    expect(mockFetchTempoFeeTokenPreference).not.toHaveBeenCalled()
  })

  it('leaves non-Tempo chains unchanged', () => {
    const { result: mainnet } = renderHook(() =>
      useAccountGasToken({ chainId: UniverseChainId.Mainnet, accountAddress: ACCOUNT }),
    )
    const { result: arc } = renderHook(() =>
      useAccountGasToken({ chainId: UniverseChainId.Arc, accountAddress: ACCOUNT }),
    )

    expect(mainnet.current).toEqual({ gasToken: nativeOnChain(UniverseChainId.Mainnet), isLoading: false })
    expect(arc.current.gasToken).toBe(getChainInfo(UniverseChainId.Arc).gasTokenOverride)
    expect(mockFetchTempoFeeTokenPreference).not.toHaveBeenCalled()
  })

  it('returns undefined without a chain', () => {
    const { result } = renderHook(() => useAccountGasToken({ chainId: undefined, accountAddress: ACCOUNT }))
    expect(result.current).toEqual({ gasToken: undefined, isLoading: false })
  })
})

describe(useChainGasToken, () => {
  beforeEach(() => {
    SharedQueryClient.clear()
    mockFetchTempoFeeTokenPreference.mockReset()
    vi.mocked(useOnChainCurrencyBalance).mockClear()
    setFlag(true)
  })

  it('holds the balance lookup until the preference is known, then reads the preferred token', async () => {
    mockFetchTempoFeeTokenPreference.mockResolvedValue(OUSD_ADDRESS)

    const { result } = renderHook(() => useChainGasToken({ chainId: UniverseChainId.Tempo, accountAddress: ACCOUNT }))

    expect(result.current.isLoading).toBe(true)
    expect(useOnChainCurrencyBalance).toHaveBeenLastCalledWith(undefined, ACCOUNT)

    await waitFor(() => expect(result.current.gasToken).toBe(OUSD_TEMPO))
    expect(useOnChainCurrencyBalance).toHaveBeenLastCalledWith(OUSD_TEMPO, ACCOUNT)
  })
})
