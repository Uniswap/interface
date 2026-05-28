import { renderHook } from '@testing-library/react'
import { useColorHexFromThemeKey } from 'ui/src/hooks/useColorHexFromThemeKey'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the useSporeColors hook
vi.mock('ui/src/hooks/useSporeColors', () => ({
  useSporeColors: vi.fn(),
}))

const mockUseSporeColors = useSporeColors as ReturnType<typeof vi.fn>

describe(useColorHexFromThemeKey, () => {
  beforeEach(() => {
    // Reset mock before each test
    mockUseSporeColors.mockReset()
  })

  it('returns the correct color object from theme', () => {
    // Mock the colors returned by useSporeColors
    const mockColors = {
      neutral1: { val: '#000000', get: (): string => '#000000', variable: 'neutral1' },
      accent1: { val: '#FC72FF', get: (): string => '#FC72FF', variable: 'accent1' },
      surface1: { val: '#FFFFFF', get: (): string => '#FFFFFF', variable: 'surface1' },
    } as unknown as ReturnType<typeof useSporeColors>
    mockUseSporeColors.mockReturnValue(mockColors)

    // Test different theme keys
    const { result: neutral1Result } = renderHook(() => useColorHexFromThemeKey('neutral1'))
    const { result: accent1Result } = renderHook(() => useColorHexFromThemeKey('accent1'))
    const { result: surface1Result } = renderHook(() => useColorHexFromThemeKey('surface1'))

    expect(neutral1Result.current).toEqual({ val: '#000000', get: expect.any(Function), variable: 'neutral1' })
    expect(accent1Result.current).toEqual({ val: '#FC72FF', get: expect.any(Function), variable: 'accent1' })
    expect(surface1Result.current).toEqual({ val: '#FFFFFF', get: expect.any(Function), variable: 'surface1' })
  })

  it('handles empty color object', () => {
    mockUseSporeColors.mockReturnValue({} as unknown as ReturnType<typeof useSporeColors>)

    const { result } = renderHook(() => useColorHexFromThemeKey('neutral1'))

    expect(result.current).toBeUndefined()
  })
})
