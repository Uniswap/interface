import { isSandboxedFrame } from 'src/contentScript/isSandboxedFrame'

describe('isSandboxedFrame', () => {
  const originalOrigin = window.origin

  afterEach(() => {
    Object.defineProperty(window, 'origin', {
      value: originalOrigin,
      writable: true,
      configurable: true,
    })
  })

  it('returns true when window.origin is "null" (sandboxed without allow-same-origin)', () => {
    Object.defineProperty(window, 'origin', { value: 'null', writable: true, configurable: true })
    expect(isSandboxedFrame()).toBe(true)
  })

  it('returns false when window.origin is a normal https URL', () => {
    Object.defineProperty(window, 'origin', { value: 'https://example.com', writable: true, configurable: true })
    expect(isSandboxedFrame()).toBe(false)
  })

  it('returns false when window.origin is localhost', () => {
    Object.defineProperty(window, 'origin', { value: 'http://localhost', writable: true, configurable: true })
    expect(isSandboxedFrame()).toBe(false)
  })

  it('returns false when window.origin is empty string', () => {
    Object.defineProperty(window, 'origin', { value: '', writable: true, configurable: true })
    expect(isSandboxedFrame()).toBe(false)
  })
})
