import { type Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { type GasStrategy, SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { PATHUSD_TEMPO, USDC_E_TEMPO } from 'uniswap/src/constants/tokens'
import { convertGasFeeToDisplayValue } from 'uniswap/src/features/gas/convertGasFeeToDisplayValue'
import { useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import { type DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { renderHook, waitFor } from 'uniswap/src/test/test-utils'
import { CurrencyField } from 'uniswap/src/types/currency'

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

vi.mock('uniswap/src/features/address/useIsSmartContractAddress', () => ({
  useIsSmartContractAddress: (): unknown => ({ isSmartContractAddress: false, loading: false }),
}))

vi.mock('uniswap/src/features/portfolio/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/portfolio/api')>()
  return {
    ...actual,
    useOnChainCurrencyBalance: (currency: Currency | undefined): unknown => ({
      balance: currency
        ? CurrencyAmount.fromRawAmount(currency, currency.equals(USDC_E_TEMPO) ? '100000000' : '0')
        : undefined,
      isLoading: false,
      error: undefined,
    }),
  }
})

const strategy: GasStrategy = {
  limitInflationFactor: 1.15,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
  thresholdToInflateLastBlockBaseFee: 0.75,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.2,
  minPriorityFeeGwei: 2,
  maxPriorityFeeGwei: 9,
}

describe(convertGasFeeToDisplayValue, () => {
  it('returns undefined when gasFee is undefined', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: undefined, gasStrategy: strategy })).toBeUndefined()
  })

  it('returns gasFee unchanged when gasStrategy is undefined', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: undefined })).toBe('1150')
  })

  it('returns gasFee unchanged when limitInflationFactor is 0', () => {
    const zeroLimit = { ...strategy, limitInflationFactor: 0 }
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: zeroLimit })).toBe('1150')
  })

  it('returns gasFee unchanged when hasOverrides is true (short-circuit)', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: strategy, hasOverrides: true })).toBe('1150')
  })

  it('applies displayLimitInflationFactor / limitInflationFactor when hasOverrides is false', () => {
    // 1150 * 1 / 1.15 = 1000
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: strategy, hasOverrides: false })).toBe('1000')
  })

  it('applies the ratio when hasOverrides is omitted (defaults to inflation-adjusted path)', () => {
    expect(convertGasFeeToDisplayValue({ gasFee: '1150', gasStrategy: strategy })).toBe('1000')
  })
})

describe(useTransactionGasWarning, () => {
  const ACCOUNT = '0x889b6fb6af37bfaa257e1fcf2913afe0b42313cf'
  const derivedSendInfo = {
    chainId: UniverseChainId.Tempo,
    currencyAmounts: { [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC_E_TEMPO, '50000000') },
    currencyBalances: { [CurrencyField.INPUT]: CurrencyAmount.fromRawAmount(USDC_E_TEMPO, '100000000') },
  } as unknown as DerivedSendInfo

  beforeEach(() => {
    SharedQueryClient.clear()
    mockFetchTempoFeeTokenPreference.mockResolvedValue(null)
    vi.mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.TempoFeeTokenPreference)
  })

  it('does not block a USDC.e send from an account with no pathUSD and no stored fee token', async () => {
    const { result } = renderHook(() =>
      useTransactionGasWarning({
        accountAddress: ACCOUNT,
        derivedInfo: derivedSendInfo,
        gasFee: '1000000000000000',
        sendCurrency: USDC_E_TEMPO,
      }),
    )

    await waitFor(() => expect(mockFetchTempoFeeTokenPreference).toHaveBeenCalled())
    await waitFor(() => expect(SharedQueryClient.isFetching()).toBe(0))
    expect(result.current).toBeUndefined()
  })

  it('checks pathUSD when the transaction is not a plain send', async () => {
    const { result } = renderHook(() =>
      useTransactionGasWarning({ accountAddress: ACCOUNT, derivedInfo: derivedSendInfo, gasFee: '1000000000000000' }),
    )

    await waitFor(() => expect(result.current?.type).toBe(WarningLabel.InsufficientGasFunds))
    expect(result.current?.currency).toBe(PATHUSD_TEMPO)
  })
})
