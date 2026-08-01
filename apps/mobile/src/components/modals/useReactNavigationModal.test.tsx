import { act, renderHook } from '@testing-library/react'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'

const mockGoBack = vi.fn()
const mockIsFocused = vi.fn(() => true)
const mockCanGoBack = vi.fn(() => true)

vi.mock('src/app/navigation/types', () => ({
  useAppStackNavigation: vi.fn(() => ({
    goBack: mockGoBack,
    isFocused: mockIsFocused,
    canGoBack: mockCanGoBack,
  })),
}))

describe('useReactNavigationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call navigation.goBack when onClose is called', () => {
    const { result } = renderHook(() => useReactNavigationModal())
    expect(result.current.preventCloseRef.current).toBe(false)
    act(() => {
      result.current.onClose()
      result.current.onClose()
      result.current.onClose()
      result.current.onClose()
    })
    expect(mockGoBack).toHaveBeenCalledTimes(1)
    expect(result.current.preventCloseRef.current).toBe(true)
  })

  it('should not call navigation.goBack when preventCloseRef is true', () => {
    const { result } = renderHook(() => useReactNavigationModal())
    act(() => {
      result.current.preventCloseRef.current = true
    })
    act(() => {
      result.current.onClose()
    })
    expect(mockGoBack).not.toHaveBeenCalled()
  })

  it('should not call navigation.goBack when navigation is not focused', () => {
    mockIsFocused.mockReturnValue(false)
    const { result } = renderHook(() => useReactNavigationModal())
    act(() => {
      result.current.onClose()
    })
    expect(mockGoBack).not.toHaveBeenCalled()
    expect(result.current.preventCloseRef.current).toBe(false)
  })
})
