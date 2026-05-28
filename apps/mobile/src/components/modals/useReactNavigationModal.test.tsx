import { act, renderHook } from '@testing-library/react'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'

const mockGoBack = jest.fn()
const mockIsFocused = jest.fn(() => true)
const mockCanGoBack = jest.fn(() => true)

jest.mock('src/app/navigation/types', () => ({
  useAppStackNavigation: jest.fn(() => ({
    goBack: mockGoBack,
    isFocused: mockIsFocused,
    canGoBack: mockCanGoBack,
  })),
}))

describe('useReactNavigationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
