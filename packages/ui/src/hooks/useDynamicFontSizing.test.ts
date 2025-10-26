import { act, renderHook } from '@testing-library/react'
import { LayoutChangeEvent } from 'react-native'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { describe, expect, it } from 'vitest'

const MAX_INPUT_FONT_SIZE = 42
const MIN_INPUT_FONT_SIZE = 28
const MAX_CHAR_PIXEL_WIDTH = 23

describe(useDynamicFontSizing, () => {
  it('returns maxFontSize if text input element width is not set', () => {
    const { result } = renderHook(() =>
      useDynamicFontSizing({
        maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
        maxFontSize: MAX_INPUT_FONT_SIZE,
        minFontSize: MIN_INPUT_FONT_SIZE,
      }),
    )

    expect(result.current.fontSize).toBe(MAX_INPUT_FONT_SIZE)
  })

  it('returns maxFontSize as fontSize if text fits in the container', async () => {
    const { result } = renderHook(() =>
      useDynamicFontSizing({
        maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
        maxFontSize: MAX_INPUT_FONT_SIZE,
        minFontSize: MIN_INPUT_FONT_SIZE,
      }),
    )

    await act(() => {
      result.current.onLayout({ nativeEvent: { layout: { width: 100 } } } as LayoutChangeEvent)
      result.current.onSetFontSize('aaaa')
    })

    // 100 / 23 = 4.34 - 4 letters should fit in the container
    expect(result.current.fontSize).toBe(MAX_INPUT_FONT_SIZE)
  })

  it('scales down font when text does not fit in the container', async () => {
    const { result } = renderHook(() =>
      useDynamicFontSizing({
        maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
        maxFontSize: MAX_INPUT_FONT_SIZE,
        minFontSize: MIN_INPUT_FONT_SIZE,
      }),
    )

    await act(() => {
      result.current.onLayout({ nativeEvent: { layout: { width: 100 } } } as LayoutChangeEvent)
      result.current.onSetFontSize('aaaaa')
    })

    // 100 / 23 = 4.34 - 5 letters should not fit in the container
    expect(result.current.fontSize).toBeLessThan(MAX_INPUT_FONT_SIZE)
  })

  it("doesn't return font size less than minFontSize", async () => {
    const { result } = renderHook(() =>
      useDynamicFontSizing({
        maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
        maxFontSize: MAX_INPUT_FONT_SIZE,
        minFontSize: MIN_INPUT_FONT_SIZE,
      }),
    )

    await act(() => {
      result.current.onLayout({ nativeEvent: { layout: { width: 100 } } } as LayoutChangeEvent)
      result.current.onSetFontSize('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    })

    expect(result.current.fontSize).toBe(MIN_INPUT_FONT_SIZE)
  })
})
