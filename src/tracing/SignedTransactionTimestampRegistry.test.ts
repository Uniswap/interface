import { SignedTransactionTimestampRegistry } from './SignedTransactionTimestampRegistry'

describe('SignedTransactionTimestampRegistry', () => {
  beforeAll(() => {
    // Mocking performance functions
    Object.defineProperty(window, 'performance', {
      value: {
        getEntriesByName: jest.fn().mockReturnValue([]),
        clearMarks: jest.fn(),
        mark: jest.fn(),
      },
    })
  })

  it('should be a singleton', () => {
    expect(SignedTransactionTimestampRegistry.getInstance()).toBe(SignedTransactionTimestampRegistry.getInstance())
  })

  it('should set a performance mark for the given hash', () => {
    SignedTransactionTimestampRegistry.getInstance().set('hash')
    expect(global.performance.mark).toHaveBeenCalledWith('time-to-sign-hash')
  })

  it('should return undefined if no timestamp exists for the given hash', () => {
    expect(SignedTransactionTimestampRegistry.getInstance().get('hash')).toBe(undefined)
  })
})
