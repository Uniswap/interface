import { act, renderHook } from '@testing-library/react'
import { useDeferredComponent } from 'hooks/useDeferredComponent'
import { logger } from 'utilities/src/logger/logger'

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

describe('useDeferredComponent', () => {
  const mockRequestIdleCallback = jest.fn()
  const mockSetTimeout = jest.fn()
  const mockImportFn = jest.fn()

  beforeEach(() => {
    jest.useFakeTimers()

    Object.defineProperty(window, 'requestIdleCallback', {
      value: mockRequestIdleCallback,
      writable: true,
      configurable: true,
    })
    jest.spyOn(window, 'setTimeout').mockImplementation(mockSetTimeout)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    delete (window as any).requestIdleCallback
  })

  it('should return null initially', () => {
    const { result } = renderHook(() => useDeferredComponent(mockImportFn))
    expect(result.current).toBeNull()
  })

  it('should use requestIdleCallback when available', async () => {
    const mockComponent = () => <div>Test Component</div>
    mockImportFn.mockResolvedValue({ default: mockComponent })

    renderHook(() => useDeferredComponent(mockImportFn))

    expect(mockRequestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 100 })
  })

  it('should use setTimeout as fallback when requestIdleCallback is not available', async () => {
    delete (window as any).requestIdleCallback

    const mockComponent = () => <div>Test Component</div>
    mockImportFn.mockResolvedValue({ default: mockComponent })

    renderHook(() => useDeferredComponent(mockImportFn))

    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1)
  })

  it('should load component after requestIdleCallback', async () => {
    const mockComponent = () => <div>Test Component</div>
    mockImportFn.mockResolvedValue({ default: mockComponent })

    const { result } = renderHook(() => useDeferredComponent(mockImportFn))

    expect(result.current).toBeNull()

    await act(async () => {
      const callback = mockRequestIdleCallback.mock.calls[0][0]
      await callback()
    })

    expect(result.current).toBe(mockComponent)
  })

  it('should load component after setTimeout when requestIdleCallback is not available', async () => {
    delete (window as any).requestIdleCallback

    const mockComponent = () => <div>Test Component</div>
    mockImportFn.mockResolvedValue({ default: mockComponent })

    const { result } = renderHook(() => useDeferredComponent(mockImportFn))

    expect(result.current).toBeNull()

    await act(async () => {
      const callback = mockSetTimeout.mock.calls[0][0]
      await callback()
    })

    expect(result.current).toBe(mockComponent)
  })

  it('should handle import errors gracefully', async () => {
    const error = new Error('Import failed')
    mockImportFn.mockRejectedValue(error)

    const { result } = renderHook(() => useDeferredComponent(mockImportFn))

    expect(result.current).toBeNull()

    await act(async () => {
      const callback = mockRequestIdleCallback.mock.calls[0][0]
      await expect(callback()).resolves.not.toThrow()
    })

    expect(result.current).toBeNull()
    expect(logger.error).toHaveBeenCalledWith(error, {
      tags: {
        file: 'useDeferredComponent.tsx',
        function: 'requestIdleCallback',
      },
    })
  })

  it('should handle multiple imports correctly', async () => {
    const mockComponent1 = () => <div>Test Component 1</div>
    const mockComponent2 = () => <div>Test Component 2</div>

    mockImportFn.mockResolvedValueOnce({ default: mockComponent1 }).mockResolvedValueOnce({ default: mockComponent2 })

    const { result: result1 } = renderHook(() => useDeferredComponent(mockImportFn))
    const { result: result2 } = renderHook(() => useDeferredComponent(mockImportFn))

    expect(result1.current).toBeNull()
    expect(result2.current).toBeNull()

    await act(async () => {
      const callback1 = mockRequestIdleCallback.mock.calls[0][0]
      await callback1()
    })

    expect(result1.current).toBe(mockComponent1)

    await act(async () => {
      const callback2 = mockRequestIdleCallback.mock.calls[1][0]
      await callback2()
    })

    expect(result2.current).toBe(mockComponent2)
  })
})
