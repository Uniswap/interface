import { renderHook } from '@testing-library/react'
import { useRecommendedGasFields } from 'uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields'
import { useIsCustomGasFlowAvailable } from 'uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable'
import { useTradingApiGasOverrides } from 'uniswap/src/features/gas/hooks/useTradingApiGasOverrides'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { vi } from 'vitest'

vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields')
vi.mock('uniswap/src/features/gas/hooks/useIsCustomGasFlowAvailable')
vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
)

const mockUseRecommendedGasFields = vi.mocked(useRecommendedGasFields)
const mockUseIsCustomGasFlowAvailable = vi.mocked(useIsCustomGasFlowAvailable)
const mockUseTransactionSettingsStore = useTransactionSettingsStore as unknown as ReturnType<typeof vi.fn>

function setGasOverrides(gasOverrides: GasFeeOverrides | undefined): void {
  mockUseTransactionSettingsStore.mockImplementation(
    (selector: (s: { gasOverrides: GasFeeOverrides | undefined }) => unknown) => selector({ gasOverrides }),
  )
}

describe('useTradingApiGasOverrides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsCustomGasFlowAvailable.mockReturnValue(true)
    mockUseRecommendedGasFields.mockReturnValue({
      recommendedMaxBaseFeeGwei: '3',
      recommendedPriorityFeeGwei: '2',
      recommendedGasLimit: '21000',
      currentNetworkBaseFeeGwei: '3',
      isLoading: false,
    })
  })

  it('returns undefined when no gasOverrides set', () => {
    setGasOverrides(undefined)
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: undefined }))
    expect(result.current).toBeUndefined()
  })

  it('returns undefined when gasOverrides object has all fields undefined', () => {
    setGasOverrides({})
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: undefined }))
    expect(result.current).toBeUndefined()
  })

  it('returns priority-only wire payload when only priorityFeeGwei is set (with recommended)', () => {
    setGasOverrides({ priorityFeeGwei: '5' })
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    // priority = 5, recommended maxBase = 3 → maxFeePerGas = 8 GWEI = 8_000_000_000 wei
    expect(result.current?.maxPriorityFeePerGas).toBe('5000000000')
    expect(result.current?.maxFeePerGas).toBe('8000000000')
    expect(result.current?.gasLimit).toBeUndefined()
  })

  it('returns maxBase-only wire payload when only maxBaseFeeGwei is set (with recommended)', () => {
    setGasOverrides({ maxBaseFeeGwei: '10' })
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    // maxBase = 10, recommended priority = 2 → maxFeePerGas = 12 GWEI = 12_000_000_000 wei
    expect(result.current?.maxFeePerGas).toBe('12000000000')
    expect(result.current?.maxPriorityFeePerGas).toBeUndefined()
  })

  it('returns gasLimit-only payload when only gasLimit is set', () => {
    setGasOverrides({ gasLimit: '250000' })
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: undefined }))
    expect(result.current?.gasLimit).toBe('250000')
    expect(result.current?.maxFeePerGas).toBeUndefined()
    expect(result.current?.maxPriorityFeePerGas).toBeUndefined()
  })

  it('returns full payload when all three fields are set', () => {
    setGasOverrides({ maxBaseFeeGwei: '10', priorityFeeGwei: '5', gasLimit: '250000' })
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    // user maxBase + user priority = 15 GWEI
    expect(result.current?.maxFeePerGas).toBe('15000000000')
    expect(result.current?.maxPriorityFeePerGas).toBe('5000000000')
    expect(result.current?.gasLimit).toBe('250000')
  })

  it('omits maxFeePerGas when only maxBaseFeeGwei is set and recommended is unavailable', () => {
    mockUseRecommendedGasFields.mockReturnValue({
      recommendedMaxBaseFeeGwei: undefined,
      recommendedPriorityFeeGwei: undefined,
      recommendedGasLimit: undefined,
      currentNetworkBaseFeeGwei: undefined,
      isLoading: false,
    })
    setGasOverrides({ maxBaseFeeGwei: '10' })
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    expect(result.current).toBeUndefined()
  })

  it('does not call useRecommendedGasFields with a real tx when gasOverrides is undefined', () => {
    setGasOverrides(undefined)
    renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    // Confirm the hook was called with `tx: undefined` (no extra /EstimateGasFee traffic when no overrides)
    expect(mockUseRecommendedGasFields).toHaveBeenCalledWith({ tx: undefined })
  })

  it('omits maxFeePerGas (rather than assigning undefined) when gweiToWei rejects the input', () => {
    // Malformed recommended GWEI → gweiToWei returns undefined. The override key
    // should be absent from the result, not assigned `undefined`.
    mockUseRecommendedGasFields.mockReturnValue({
      recommendedMaxBaseFeeGwei: 'not-a-number',
      recommendedPriorityFeeGwei: '2',
      recommendedGasLimit: '21000',
      currentNetworkBaseFeeGwei: 'not-a-number',
      isLoading: false,
    })
    setGasOverrides({ priorityFeeGwei: '5' })
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    expect(result.current).not.toHaveProperty('maxFeePerGas')
    expect(result.current?.maxPriorityFeePerGas).toBe('5000000000')
  })

  it('returns undefined when custom gas flow is unavailable, even with saved overrides', () => {
    mockUseIsCustomGasFlowAvailable.mockReturnValue(false)
    setGasOverrides({ maxBaseFeeGwei: '10', priorityFeeGwei: '5', gasLimit: '250000' })
    const { result } = renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    expect(result.current).toBeUndefined()
  })

  it('skips the recommended-fields fetch when custom gas flow is unavailable', () => {
    mockUseIsCustomGasFlowAvailable.mockReturnValue(false)
    setGasOverrides({ priorityFeeGwei: '5' })
    renderHook(() => useTradingApiGasOverrides({ tx: { chainId: 1 } as never }))
    // Even though gasOverrides is populated, the flow is gated off — no
    // /EstimateGasFee traffic should be triggered.
    expect(mockUseRecommendedGasFields).toHaveBeenCalledWith({ tx: undefined })
  })
})
