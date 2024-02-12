import { renderHook } from '@testing-library/react-hooks'
import { LayoutChangeEvent } from 'react-native'
import { act } from 'react-test-renderer'
import { useDynamicFontSizing, useShouldShowNativeKeyboard } from './hooks'

describe(useShouldShowNativeKeyboard, () => {
  it('returns false if layout calculation is pending', () => {
    const { result } = renderHook(() => useShouldShowNativeKeyboard())

    expect(result.current.showNativeKeyboard).toBe(false)
  })

  it('returns isLayoutPending as true if layout calculation is pending', () => {
    const { result } = renderHook(() => useShouldShowNativeKeyboard())

    expect(result.current.isLayoutPending).toBe(true)
  })

  it("shouldn't show native keyboard if decimal pad is rendered below the input panel", async () => {
    const { result } = renderHook(() => useShouldShowNativeKeyboard())

    await act(async () => {
      result.current.onInputPanelLayout({
        nativeEvent: { layout: { height: 100 } },
      } as LayoutChangeEvent)
      result.current.onDecimalPadLayout({
        nativeEvent: { layout: { y: 200 } },
      } as LayoutChangeEvent)
    })

    expect(result.current.showNativeKeyboard).toBe(false)
    expect(result.current.maxContentHeight).toBeDefined()
    expect(result.current.isLayoutPending).toBe(false)
  })

  it('should show native keyboard if decimal pad is rendered above the input panel', async () => {
    const { result } = renderHook(() => useShouldShowNativeKeyboard())

    await act(async () => {
      result.current.onInputPanelLayout({
        nativeEvent: { layout: { height: 100 } },
      } as LayoutChangeEvent)
      result.current.onDecimalPadLayout({
        nativeEvent: { layout: { y: 50 } },
      } as LayoutChangeEvent)
    })

    expect(result.current.showNativeKeyboard).toBe(true)
    expect(result.current.maxContentHeight).not.toBeDefined()
    expect(result.current.isLayoutPending).toBe(false)
  })
})

const MAX_INPUT_FONT_SIZE = 42
const MIN_INPUT_FONT_SIZE = 28
const MAX_CHAR_PIXEL_WIDTH = 23

describe(useDynamicFontSizing, () => {
  it('returns maxFontSize if text input element width is not set', () => {
    const { result } = renderHook(() =>
      useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)
    )

    expect(result.current.fontSize).toBe(MAX_INPUT_FONT_SIZE)
  })

  it('returns maxFontSize as fontSize if text fits in the container', async () => {
    const { result } = renderHook(() =>
      useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)
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
      useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)
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
      useDynamicFontSizing(MAX_CHAR_PIXEL_WIDTH, MAX_INPUT_FONT_SIZE, MIN_INPUT_FONT_SIZE)
    )

    await act(() => {
      result.current.onLayout({ nativeEvent: { layout: { width: 100 } } } as LayoutChangeEvent)
      result.current.onSetFontSize('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    })

    expect(result.current.fontSize).toBe(MIN_INPUT_FONT_SIZE)
  })
})
