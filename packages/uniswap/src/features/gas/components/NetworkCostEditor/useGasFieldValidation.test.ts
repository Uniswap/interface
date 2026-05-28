import { renderHook } from '@testing-library/react'
import { useGasFieldValidation } from 'uniswap/src/features/gas/components/NetworkCostEditor/useGasFieldValidation'

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: (key: string, vars?: Record<string, unknown>) => string } => ({
    t: (key: string, vars?: Record<string, unknown>): string => {
      const translations: Record<string, string> = {
        'gas.override.error.invalidNumber': 'Enter a valid number',
        'gas.override.error.maxBaseBelowCurrent': 'Must be greater than current base fee ({{value}} GWEI)',
        'gas.override.error.gasLimitTooLow': 'Gas limit must be greater than 0',
        'gas.override.warning.priorityFeeLow':
          'This transaction may take a while to process. Consider a higher priority fee.',
        'gas.override.warning.gasLimitLow':
          'Gas limit is below the recommended value ({{value}}). Your transaction may run out of gas.',
      }
      let result = translations[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          result = result.replace(`{{${k}}}`, String(v))
        }
      }
      return result
    },
  }),
}))

describe('useGasFieldValidation', () => {
  const recommended = {
    recommendedMaxBaseFeeGwei: '5',
    recommendedPriorityFeeGwei: '2',
    recommendedGasLimit: '21000',
    currentNetworkBaseFeeGwei: '5',
  }

  it('returns no errors for recommended values', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: '21000' },
        recommended,
      }),
    )
    expect(result.current.maxBaseFee.error).toBeUndefined()
    expect(result.current.priorityFee.warning).toBeUndefined()
    expect(result.current.canSave).toBe(true)
  })

  it('errors when max base fee is below current network base fee', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: '3', priorityFeeGwei: '2', gasLimit: '21000' },
        recommended,
      }),
    )
    expect(result.current.maxBaseFee.error).toMatch(/greater than current base fee/i)
    expect(result.current.canSave).toBe(false)
  })

  it('warns when priority fee is < 50% of recommended', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: '5', priorityFeeGwei: '0.5', gasLimit: '21000' },
        recommended,
      }),
    )
    expect(result.current.priorityFee.warning).toMatch(/take a while/i)
    expect(result.current.canSave).toBe(true) // warning does NOT block
  })

  it('does NOT error when input is empty (treated as no override)', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: '', priorityFeeGwei: '', gasLimit: '' },
        recommended,
      }),
    )
    expect(result.current.maxBaseFee.error).toBeUndefined()
    expect(result.current.priorityFee.error).toBeUndefined()
    expect(result.current.gasLimit.error).toBeUndefined()
    expect(result.current.canSave).toBe(true)
  })

  it('still errors on invalid characters', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: 'abc', priorityFeeGwei: '', gasLimit: '' },
        recommended,
      }),
    )
    expect(result.current.maxBaseFee.error).toBeTruthy()
    expect(result.current.canSave).toBe(false)
  })

  it('errors on non-numeric input', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: 'abc', priorityFeeGwei: '2', gasLimit: '21000' },
        recommended,
      }),
    )
    expect(result.current.maxBaseFee.error).toBeDefined()
    expect(result.current.canSave).toBe(false)
  })

  it('errors when gasLimit is a bare comma (no digits)', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: ',' },
        recommended,
      }),
    )
    expect(result.current.gasLimit.error).toBeDefined()
    expect(result.current.canSave).toBe(false)
  })

  it('accepts gasLimit with comma separators', () => {
    const { result } = renderHook(() =>
      useGasFieldValidation({
        values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: '210,000' },
        recommended,
      }),
    )
    expect(result.current.gasLimit.error).toBeUndefined()
    expect(result.current.canSave).toBe(true)
  })

  describe('rejects gasLimit of zero (SWAP-2688)', () => {
    it.each([
      { input: '0', label: 'plain zero' },
      { input: '00', label: 'padded zero' },
      { input: '0,0', label: 'comma-grouped zero' },
      { input: '0,000', label: 'thousand-grouped zero' },
    ])('blocks save when gasLimit is $label ("$input")', ({ input }) => {
      const { result } = renderHook(() =>
        useGasFieldValidation({
          values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: input },
          recommended,
        }),
      )
      expect(result.current.gasLimit.error).toMatch(/greater than 0/i)
      expect(result.current.canSave).toBe(false)
    })

    it('still accepts a non-zero gasLimit at the recommended value', () => {
      const { result } = renderHook(() =>
        useGasFieldValidation({
          values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: '21000' },
          recommended,
        }),
      )
      expect(result.current.gasLimit.error).toBeUndefined()
      expect(result.current.gasLimit.warning).toBeUndefined()
      expect(result.current.canSave).toBe(true)
    })
  })

  describe('warns when gasLimit is below recommended (SWAP-2688)', () => {
    const recommendedWithGasLimit = { ...recommended, recommendedGasLimit: '200000' }

    it.each([
      { input: '1', label: 'far below recommended' },
      { input: '50000', label: 'below recommended' },
      { input: '199999', label: 'just below recommended' },
    ])('sets warning (not error) when gasLimit is $label ("$input")', ({ input }) => {
      const { result } = renderHook(() =>
        useGasFieldValidation({
          values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: input },
          recommended: recommendedWithGasLimit,
        }),
      )
      expect(result.current.gasLimit.error).toBeUndefined()
      expect(result.current.gasLimit.warning).toMatch(/below the recommended/i)
      // Warnings must NOT block Save.
      expect(result.current.canSave).toBe(true)
    })

    it('does not warn when gasLimit equals recommended', () => {
      const { result } = renderHook(() =>
        useGasFieldValidation({
          values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: '200000' },
          recommended: recommendedWithGasLimit,
        }),
      )
      expect(result.current.gasLimit.warning).toBeUndefined()
    })

    it('does not warn when gasLimit is above recommended', () => {
      const { result } = renderHook(() =>
        useGasFieldValidation({
          values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: '400000' },
          recommended: recommendedWithGasLimit,
        }),
      )
      expect(result.current.gasLimit.warning).toBeUndefined()
    })

    it('does not warn when recommendedGasLimit is not yet available', () => {
      const { result } = renderHook(() =>
        useGasFieldValidation({
          values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: '1' },
          recommended: { ...recommended, recommendedGasLimit: undefined },
        }),
      )
      expect(result.current.gasLimit.warning).toBeUndefined()
    })

    it('still errors (not warns) when input is zero, even with a recommended value', () => {
      const { result } = renderHook(() =>
        useGasFieldValidation({
          values: { maxBaseFeeGwei: '5', priorityFeeGwei: '2', gasLimit: '0' },
          recommended: recommendedWithGasLimit,
        }),
      )
      expect(result.current.gasLimit.error).toMatch(/greater than 0/i)
      expect(result.current.gasLimit.warning).toBeUndefined()
      expect(result.current.canSave).toBe(false)
    })
  })
})
