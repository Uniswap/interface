jest.mock('src/background/messagePassing/messageChannels')
jest.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: jest.fn((definition) => definition),
}))

describe('injected', () => {
  it('should run without throwing an error', () => {
    // This does not exist in the extension execution environment for content scripts
    Object.defineProperty(document, 'head', { value: undefined, writable: true })

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const injected = require('../entrypoints/injected.content')
    expect(injected).toBeTruthy()
  })
})
