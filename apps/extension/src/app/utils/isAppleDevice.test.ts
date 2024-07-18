import { isAppleDevice } from 'src/app/utils/isAppleDevice'

describe('isAppleDevice', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    jest.resetModules()
  })

  it('should return true for macOS', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'MacIntel',
      writable: true,
    })
    expect(isAppleDevice()).toBe(true)
  })

  it('should return true for iPhone', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'iPhone',
      writable: true,
    })
    expect(isAppleDevice()).toBe(true)
  })

  it('should return true for iPad', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'iPad',
      writable: true,
    })
    expect(isAppleDevice()).toBe(true)
  })

  it('should return false for Windows', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Win32',
      writable: true,
    })
    expect(isAppleDevice()).toBe(false)
  })

  it('should return false for Linux', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Linux',
      writable: true,
    })
    expect(isAppleDevice()).toBe(false)
  })

  it('should return false for Android', () => {
    Object.defineProperty(window.navigator, 'platform', {
      value: 'Android',
      writable: true,
    })
    expect(isAppleDevice()).toBe(false)
  })
})
