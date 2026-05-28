let mockIsSandboxed = false

jest.mock('src/contentScript/isSandboxedFrame', () => ({
  isSandboxedFrame: jest.fn(() => mockIsSandboxed),
}))

jest.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: jest.fn((definition) => definition),
}))

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
}))

jest.mock('src/background/messagePassing/messageUtils', () => ({
  addWindowMessageListener: jest.fn(),
  removeWindowMessageListener: jest.fn(),
}))

jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

jest.mock('src/contentScript/WindowEthereumProxy', () => ({
  WindowEthereumProxy: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
    isMetaMask: false,
  })),
}))

describe('ethereum.content', () => {
  let definition: { main: () => void }
  let postMessageSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetModules()
    // Reset the mock flag before re-requiring
    mockIsSandboxed = false
    // Clear window.ethereum
    Object.defineProperty(window, 'ethereum', { value: undefined, writable: true, configurable: true })
    // jsdom's postMessage requires a targetOrigin; spy to prevent the call from throwing
    postMessageSpy = jest.spyOn(window, 'postMessage').mockImplementation(jest.fn())
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
  })

  describe('normal frame', () => {
    beforeEach(() => {
      mockIsSandboxed = false
      definition = require('../entrypoints/ethereum.content').default
    })

    it('assigns window.ethereum after main()', () => {
      const eip6963Listener = jest.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(window.ethereum).toBeDefined()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })

    it('fires EIP-6963 announceProvider event', () => {
      const eip6963Listener = jest.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(eip6963Listener).toHaveBeenCalled()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })
  })

  describe('sandboxed frame', () => {
    beforeEach(() => {
      mockIsSandboxed = true
      definition = require('../entrypoints/ethereum.content').default
    })

    it('does NOT assign window.ethereum', () => {
      const eip6963Listener = jest.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(window.ethereum).toBeUndefined()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })

    it('does NOT fire EIP-6963 announceProvider event', () => {
      const eip6963Listener = jest.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(eip6963Listener).not.toHaveBeenCalled()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })
  })
})
