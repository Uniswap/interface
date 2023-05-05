import { setLocalStorage } from './localStorage'

describe('setLocalStorage', () => {
  const originalSetItem = localStorage.setItem

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should call onError when there is an error other than quota exceeded', () => {
    const onError = jest.fn()
    const setItemSpy = jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Test Error', 'TestError')
    })

    setLocalStorage('testKey', 'testValue', onError)

    expect(onError).toHaveBeenCalled()

    // Restore the original setItem method
    setItemSpy.mockRestore()
  })
})
