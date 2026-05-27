import { renderHook } from '@testing-library/react'
import { useGasOverridesWarningState } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasOverridesWarningState'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}))

const mockUseEnableCustomGasFeeEntry = vi.fn()
const mockUseRecommendedGasFields = vi.fn()

vi.mock('uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry', () => ({
  useEnableCustomGasFeeEntry: (): unknown => mockUseEnableCustomGasFeeEntry(),
}))

vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/useRecommendedGasFields', () => ({
  useRecommendedGasFields: (): unknown => mockUseRecommendedGasFields(),
}))

describe('useGasOverridesWarningState', () => {
  beforeEach(() => {
    mockUseRecommendedGasFields.mockReturnValue({
      recommendedMaxBaseFeeGwei: '5',
      recommendedPriorityFeeGwei: '2',
      recommendedGasLimit: '21000',
      currentNetworkBaseFeeGwei: '5',
      isLoading: false,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns custom entry disabled, no overrides, no warning when nothing is set', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(false)
    const { result } = renderHook(() => useGasOverridesWarningState({ tx: undefined, gasOverrides: undefined }))
    expect(result.current).toEqual({ enableCustomGasFeeEntry: false, hasOverrides: false, hasWarning: false })
  })

  it('returns custom entry enabled, hasOverrides=true, hasWarning=false for healthy overrides', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)
    const overrides: GasFeeOverrides = {
      maxBaseFeeGwei: '5',
      priorityFeeGwei: '2',
      gasLimit: '21000',
    }
    const { result } = renderHook(() => useGasOverridesWarningState({ tx: undefined, gasOverrides: overrides }))
    expect(result.current).toEqual({ enableCustomGasFeeEntry: true, hasOverrides: true, hasWarning: false })
  })

  it('returns hasWarning=true when priority fee is far below recommended', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)
    const overrides: GasFeeOverrides = {
      maxBaseFeeGwei: '5',
      priorityFeeGwei: '0.1', // well under 50% of recommended (2)
      gasLimit: '21000',
    }
    const { result } = renderHook(() => useGasOverridesWarningState({ tx: undefined, gasOverrides: overrides }))
    expect(result.current).toEqual({ enableCustomGasFeeEntry: true, hasOverrides: true, hasWarning: true })
  })

  it('does not raise the warning flag when no overrides are saved, even if validation could warn', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)
    const { result } = renderHook(() => useGasOverridesWarningState({ tx: undefined, gasOverrides: undefined }))
    expect(result.current.hasOverrides).toBe(false)
    expect(result.current.hasWarning).toBe(false)
  })

  it('holds hasWarning while the gas-service is between responses (queryKey churn on every /swap poll)', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)
    const riskyOverrides: GasFeeOverrides = {
      maxBaseFeeGwei: '5',
      priorityFeeGwei: '0.1', // well under 50% of recommended (2)
      gasLimit: '21000',
    }

    // 1. Initial render with populated recommended values → warning shown.
    const { result, rerender } = renderHook(() =>
      useGasOverridesWarningState({ tx: undefined, gasOverrides: riskyOverrides }),
    )
    expect(result.current.hasWarning).toBe(true)

    // 2. Poll fires, queryKey changes, recommended values evicted while the
    //    next gas-service request is in flight. Without sticky-caching, the
    //    UI would flash here.
    mockUseRecommendedGasFields.mockReturnValue({
      recommendedMaxBaseFeeGwei: undefined,
      recommendedPriorityFeeGwei: undefined,
      recommendedGasLimit: undefined,
      currentNetworkBaseFeeGwei: undefined,
      isLoading: true,
    })
    rerender()
    expect(result.current.hasWarning).toBe(true)

    // 3. New gas-service response arrives, still risky → still warning.
    mockUseRecommendedGasFields.mockReturnValue({
      recommendedMaxBaseFeeGwei: '5',
      recommendedPriorityFeeGwei: '2',
      recommendedGasLimit: '21000',
      currentNetworkBaseFeeGwei: '5',
      isLoading: false,
    })
    rerender()
    expect(result.current.hasWarning).toBe(true)
  })

  it('clears hasWarning even mid-refetch when the user removes overrides (outer hasOverrides gate)', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)
    const riskyOverrides: GasFeeOverrides = {
      maxBaseFeeGwei: '5',
      priorityFeeGwei: '0.1',
      gasLimit: '21000',
    }

    const { result, rerender } = renderHook(
      ({ overrides }: { overrides: GasFeeOverrides | undefined }) =>
        useGasOverridesWarningState({ tx: undefined, gasOverrides: overrides }),
      { initialProps: { overrides: riskyOverrides as GasFeeOverrides | undefined } },
    )
    expect(result.current.hasWarning).toBe(true)

    // Simulate the worst case: the gas-service is between responses AND the
    // user clears the override in the same tick. The cached warning bit is
    // still `true`, but the outer `hasOverrides` gate must zero it out.
    mockUseRecommendedGasFields.mockReturnValue({
      recommendedMaxBaseFeeGwei: undefined,
      recommendedPriorityFeeGwei: undefined,
      recommendedGasLimit: undefined,
      currentNetworkBaseFeeGwei: undefined,
      isLoading: true,
    })
    rerender({ overrides: undefined })
    expect(result.current.hasOverrides).toBe(false)
    expect(result.current.hasWarning).toBe(false)
  })

  it('clears hasWarning when the override is raised to a healthy value', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)

    const { result, rerender } = renderHook(
      ({ overrides }: { overrides: GasFeeOverrides }) =>
        useGasOverridesWarningState({ tx: undefined, gasOverrides: overrides }),
      {
        initialProps: {
          overrides: {
            maxBaseFeeGwei: '5',
            priorityFeeGwei: '0.1', // risky
            gasLimit: '21000',
          } as GasFeeOverrides,
        },
      },
    )
    expect(result.current.hasWarning).toBe(true)

    rerender({
      overrides: {
        maxBaseFeeGwei: '5',
        priorityFeeGwei: '2', // healthy
        gasLimit: '21000',
      },
    })
    expect(result.current.hasWarning).toBe(false)
  })
})
