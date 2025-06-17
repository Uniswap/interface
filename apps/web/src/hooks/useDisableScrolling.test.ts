import { renderHook } from '@testing-library/react'
import useDisableScrolling from 'hooks/useDisableScrolling'

let mockIsMobileWeb = false

vi.mock('utilities/src/platform', async () => {
  const actual = await vi.importActual('utilities/src/platform')
  return {
    ...actual,
    get isMobileWeb() {
      return mockIsMobileWeb
    },
  }
})

describe('useDisableScrolling', () => {
  it('should disable scrolling on mobile', () => {
    mockIsMobileWeb = true
    renderHook(() => useDisableScrolling(true))
    expect(document.body.style.overflow).toBe('hidden')
  })
  it('should enable scrolling on mobile', () => {
    mockIsMobileWeb = true
    renderHook(() => useDisableScrolling(false))
    expect(document.body.style.overflow).toBe('auto')
  })
  it('should not disable scrolling on desktop', () => {
    mockIsMobileWeb = false
    renderHook(() => useDisableScrolling(true))
    expect(document.body.style.overflow).toBe('auto')
  })
  it('should not enable scrolling on desktop', () => {
    mockIsMobileWeb = false
    renderHook(() => useDisableScrolling(false))
    expect(document.body.style.overflow).toBe('auto')
  })
})
