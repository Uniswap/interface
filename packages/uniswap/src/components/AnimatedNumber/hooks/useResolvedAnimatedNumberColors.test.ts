import { renderHook } from '@testing-library/react'
import type { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { opacifyRaw } from 'ui/src/theme/color/utils'
import { useResolvedAnimatedNumberColors } from 'uniswap/src/components/AnimatedNumber/hooks/useResolvedAnimatedNumberColors'
import { CUSTOM_COLOR_FADED_DECIMAL_OPACITY } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'

const BASE_COLOR = '#aabbcc'
const NEUTRAL2_COLOR = '#666666'
const NEUTRAL3_COLOR = '#333333'
const NEXT_COLOR = '#00ff00'

vi.mock('uniswap/src/components/AnimatedNumber/utils/resolveAnimatedNumberColor', () => ({
  resolveAnimatedNumberColor: vi.fn((_colors, color) => (color !== undefined ? BASE_COLOR : '#neutral1')),
}))

function makeColors(): UseSporeColorsReturn {
  return {
    neutral2: { val: NEUTRAL2_COLOR, get: () => NEUTRAL2_COLOR, variable: '--neutral2' },
    neutral3: { val: NEUTRAL3_COLOR, get: () => NEUTRAL3_COLOR, variable: '--neutral3' },
  } as unknown as UseSporeColorsReturn
}

describe(useResolvedAnimatedNumberColors, () => {
  describe('hasCustomColor', () => {
    it('is false when color is undefined', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: undefined,
          shouldFadeDecimals: false,
        }),
      )
      expect(result.current.hasCustomColor).toBe(false)
    })

    it('is true when a color token is provided', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: '$accent1',
          shouldFadeDecimals: false,
        }),
      )
      expect(result.current.hasCustomColor).toBe(true)
    })
  })

  describe('balanceChangeColor', () => {
    it('passes nextColor through when there is no custom color', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: undefined,
          shouldFadeDecimals: false,
          nextColor: NEXT_COLOR,
        }),
      )
      expect(result.current.balanceChangeColor).toBe(NEXT_COLOR)
    })

    it('is undefined when a custom color is set', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: '$accent1',
          shouldFadeDecimals: false,
          nextColor: NEXT_COLOR,
        }),
      )
      expect(result.current.balanceChangeColor).toBeUndefined()
    })

    it('is undefined when nextColor is not provided and there is no custom color', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: undefined,
          shouldFadeDecimals: false,
        }),
      )
      expect(result.current.balanceChangeColor).toBeUndefined()
    })
  })

  describe('baseColor', () => {
    it('reflects the resolved color from resolveAnimatedNumberColor', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: '$accent1',
          shouldFadeDecimals: false,
        }),
      )
      expect(result.current.baseColor).toBe(BASE_COLOR)
    })
  })

  describe('decimalPartColor', () => {
    it('returns neutral2 when shouldFadeDecimals is false and there is no custom color', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: undefined,
          shouldFadeDecimals: false,
        }),
      )
      expect(result.current.decimalPartColor).toBe(NEUTRAL2_COLOR)
    })

    it('returns neutral2 when shouldFadeDecimals is true and there is no custom color', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: undefined,
          shouldFadeDecimals: true,
        }),
      )
      expect(result.current.decimalPartColor).toBe(NEUTRAL2_COLOR)
    })

    it('returns opacified base color when shouldFadeDecimals is true and a custom color is set', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: '$accent1',
          shouldFadeDecimals: true,
        }),
      )
      expect(result.current.decimalPartColor).toBe(opacifyRaw(CUSTOM_COLOR_FADED_DECIMAL_OPACITY, BASE_COLOR))
    })

    it('returns neutral2 when shouldFadeDecimals is false even with a custom color', () => {
      const { result } = renderHook(() =>
        useResolvedAnimatedNumberColors({
          colors: makeColors(),
          color: '$accent1',
          shouldFadeDecimals: false,
        }),
      )
      expect(result.current.decimalPartColor).toBe(NEUTRAL2_COLOR)
    })
  })
})
