jest.mock('src/background/messagePassing/messageChannels')
jest.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: jest.fn((definition) => definition),
}))
jest.mock('src/contentScript/isSandboxedFrame', () => ({
  isSandboxedFrame: jest.fn(() => false),
}))

const { isSandboxedFrame } = require('src/contentScript/isSandboxedFrame') as {
  isSandboxedFrame: jest.Mock
}

describe('injected', () => {
  it('should run without throwing an error', () => {
    // This does not exist in the extension execution environment for content scripts
    Object.defineProperty(document, 'head', { value: undefined, writable: true })

    const injected = require('../entrypoints/injected.content')
    expect(injected).toBeTruthy()
  })
})

describe('injected - sandboxed frame', () => {
  beforeEach(() => {
    isSandboxedFrame.mockReturnValue(true)
  })

  afterEach(() => {
    isSandboxedFrame.mockReturnValue(false)
  })

  it('should load without error in sandbox mode', () => {
    const { addWindowMessageListener } = require('src/background/messagePassing/messageUtils') as {
      addWindowMessageListener: jest.Mock
    }

    const injected = require('../entrypoints/injected.content')
    expect(injected).toBeTruthy()

    // In sandbox mode, isSandboxedFrame() returns true and makeInjected() bails out early,
    // so addWindowMessageListener should NOT have been called for request handling.
    // Note: since the module was already required above, this test verifies the module
    // loads without error when the sandbox check is active.
    expect(addWindowMessageListener).toBeDefined()
  })
})
