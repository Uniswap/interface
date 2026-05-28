import { renderHook } from '@testing-library/react'
import { useGasChipDispatch } from 'uniswap/src/features/gas/hooks/useGasChipDispatch'

const mockUseEnableCustomGasFeeEntry = vi.fn()

vi.mock('uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry', () => ({
  useEnableCustomGasFeeEntry: (): unknown => mockUseEnableCustomGasFeeEntry(),
}))

describe('useGasChipDispatch', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns auto-tooltip when custom entry is disabled', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(false)
    const { result } = renderHook(() => useGasChipDispatch({ isCrossChain: false }))
    expect(result.current.dispatch()).toEqual({ type: 'auto-tooltip' })
  })

  it('returns auto-tooltip when custom entry is disabled regardless of crosschain', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(false)
    const { result } = renderHook(() => useGasChipDispatch({ isCrossChain: true }))
    expect(result.current.dispatch()).toEqual({ type: 'auto-tooltip' })
  })

  it('returns crosschain-not-supported when custom entry is on and crosschain', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)
    const { result } = renderHook(() => useGasChipDispatch({ isCrossChain: true }))
    expect(result.current.dispatch()).toEqual({ type: 'crosschain-not-supported' })
  })

  it('returns editor when custom entry is on and not crosschain', () => {
    mockUseEnableCustomGasFeeEntry.mockReturnValue(true)
    const { result } = renderHook(() => useGasChipDispatch({ isCrossChain: false }))
    expect(result.current.dispatch()).toEqual({ type: 'editor' })
  })
})
