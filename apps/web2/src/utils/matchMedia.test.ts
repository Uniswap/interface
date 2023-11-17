import { addMediaQueryListener, removeMediaQueryListener } from './matchMedia'

describe('addMediaQueryListener', () => {
  test('adds event listener to media query', () => {
    const mediaQuery = {
      addEventListener: jest.fn(),
      addListener: jest.fn(),
    } as unknown as MediaQueryList

    const listener = jest.fn()
    addMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.addEventListener).toHaveBeenCalledWith('change', listener)
    expect(mediaQuery.addListener).not.toHaveBeenCalled()
  })

  test('falls back to addMediaQueryListener for older browsers', () => {
    const mediaQuery = {
      addListener: jest.fn(),
    } as unknown as MediaQueryList

    const listener = jest.fn()
    addMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.addListener).toHaveBeenCalledWith(listener)
  })
})

describe('removeMediaQueryListener', () => {
  test('removes event listener from media query', () => {
    const mediaQuery = {
      removeEventListener: jest.fn(),
      removeListener: jest.fn(),
    } as unknown as MediaQueryList

    const listener = jest.fn()
    removeMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.removeEventListener).toHaveBeenCalledWith('change', listener)
    expect(mediaQuery.removeListener).not.toHaveBeenCalled()
  })

  test('falls back to removeMediaQueryListener for older browsers', () => {
    const mediaQuery = {
      removeListener: jest.fn(),
    } as unknown as MediaQueryList

    const listener = jest.fn()
    removeMediaQueryListener(mediaQuery, listener)

    expect(mediaQuery.removeListener).toHaveBeenCalledWith(listener)
  })
})
