import { renderHook } from '@testing-library/react-hooks'
import { LayoutChangeEvent } from 'react-native'
import { act } from 'react-test-renderer'
import { useShouldShowNativeKeyboard } from './hooks'

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
