import { isIFramed } from 'utils/isIFramed'

const dispatchMock = vi.fn()
vi.mock('state/hooks', () => ({
  useAppDispatch: () => dispatchMock,
}))

describe('useIsIframed', () => {
  it('should return true if there are ancestor origins', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: ['https://www.google.com'],
      },
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(true)
  })
  it('should return false if there are 0 ancestor origins', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: [],
      },
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(false)
  })
  it('should return false if self is equal to top', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: undefined,
      },
      writable: true,
    })
    Object.defineProperty(window, 'self', {
      value: 'https://uniswap.org',
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: 'https://uniswap.org',
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(false)
  })
  it('should return true if self is not equal to top', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: undefined,
      },
      writable: true,
    })
    Object.defineProperty(window, 'self', {
      value: 'https://uniswap.org',
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: 'https://eviluniswap.org',
      writable: true,
    })
    const result = isIFramed()
    expect(result).toBe(true)
  })

  it('should return true otherwise an error is thrown due to weird overwriting of variables that should not be modified', async () => {
    Object.defineProperty(window, 'location', {
      value: {
        ancestorOrigins: undefined,
      },
      writable: true,
    })
    Object.defineProperty(window, 'self', {
      value: 'https://uniswap.org',
      writable: true,
    })
    Object.defineProperty(window, 'top', {
      value: undefined,
      writable: true,
    })
    const result = isIFramed(true)
    expect(result).toBe(true)
  })
})
