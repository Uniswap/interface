import { renderHook } from '@testing-library/react'
import useDisableScrolling from 'hooks/useDisableScrolling'

const UserAgentMock = jest.requireMock('utilities/src/platform')
jest.mock('utilities/src/platform', () => ({
  isMobileWeb: true,
}))

describe('useDisableScrolling', () => {
  it('should disable scrolling on mobile', () => {
    UserAgentMock.isMobileWeb = true
    renderHook(() => useDisableScrolling(true))
    expect(document.body.style.overflow).toBe('hidden')
  })
  it('should enable scrolling on mobile', () => {
    UserAgentMock.isMobileWeb = true
    renderHook(() => useDisableScrolling(false))
    expect(document.body.style.overflow).toBe('auto')
  })
  it('should not disable scrolling on desktop', () => {
    UserAgentMock.isMobileWeb = false
    renderHook(() => useDisableScrolling(true))
    expect(document.body.style.overflow).toBe('auto')
  })
  it('should not enable scrolling on desktop', () => {
    UserAgentMock.isMobileWeb = false
    renderHook(() => useDisableScrolling(false))
    expect(document.body.style.overflow).toBe('auto')
  })
})
