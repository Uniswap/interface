jest.mock('src/background/messagePassing/messageChannels')

describe('injected', () => {
  it('should run without throwing an error', () => {
    // This does not exist in the extension execution environment for content scripts
    Object.defineProperty(document, 'head', { value: undefined, writable: true })

    const injected = require('./injected')
    expect(injected).toBeTruthy()
  })
})
