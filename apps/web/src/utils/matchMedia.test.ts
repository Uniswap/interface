import { addMediaQueryListener, removeMediaQueryListener } from 'utils/matchMedia'

describe('addMediaQueryListener', () => {
  test('adds event listener to media query', () => {
    const mediaQuery = {
      addEventListener: vi.fn(),
      addListener: vi.fn(),
    } as unknown as MediaQueryList

    const listener = vi.fn()
    addMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', listener)
    expect(mediaQuery.addListener).not.toHaveBeenCalled()
  })

  test('falls back to addMediaQueryListener for older browsers', () => {
    const mediaQuery = {
      addListener: vi.fn(),
    } as unknown as MediaQueryList

    const listener = vi.fn()
    addMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.addListener).toHaveBeenCalledWith(listener)
  })
})

describe('removeMediaQueryListener', () => {
  test('removes event listener from media query', () => {
    const mediaQuery = {
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    const listener = vi.fn()
    removeMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listener)
    expect(mediaQuery.removeListener).not.toHaveBeenCalled()
  })

  test('falls back to removeMediaQueryListener for older browsers', () => {
    const mediaQuery = {
      removeListener: vi.fn(),
    } as unknown as MediaQueryList

    const listener = vi.fn()
    removeMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.removeListener).toHaveBeenCalledWith(listener)
  })
})
