import { mark } from '..'

// Force ./console to be loaded after mocking out console methods.
const consoleDebug = (console.debug = jest.fn())
const consoleLog = (console.log = jest.fn())
const consoleWarn = (console.warn = jest.fn())
const consoleError = (console.error = jest.fn())
require('./console')

jest.mock('..')

describe('console', () => {
  it('wraps calls to console.debug', () => {
    console.debug('message', 1, 2, 3)
    expect(mark).toHaveBeenCalledWith('console.debug', { message: 'message', params: [1, 2, 3] })
    expect(consoleDebug).toHaveBeenCalledWith('message', 1, 2, 3)
  })

  it('wraps calls to console.log', () => {
    console.log('message', 1, 2, 3)
    expect(mark).toHaveBeenCalledWith('console.log', { message: 'message', params: [1, 2, 3] })
    expect(consoleLog).toHaveBeenCalledWith('message', 1, 2, 3)
  })

  it('wraps calls to console.warn', () => {
    console.warn('message', 1, 2, 3)
    expect(mark).toHaveBeenCalledWith('console.warn', { message: 'message', params: [1, 2, 3] })
    expect(consoleWarn).toHaveBeenCalledWith('message', 1, 2, 3)
  })

  it('wraps calls to console.error', () => {
    const error = new Error('message')
    console.error(error, 1, 2, 3)
    expect(mark).toHaveBeenCalledWith('console.error', { message: 'message', params: [1, 2, 3] }, 'message')
    expect(consoleError).toHaveBeenCalledWith(error, 1, 2, 3)
  })
})
