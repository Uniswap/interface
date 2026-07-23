import type { MockInstance } from 'vitest'

let mockIsSandboxed = false

vi.mock('src/contentScript/isSandboxedFrame', () => ({
  isSandboxedFrame: vi.fn(() => mockIsSandboxed),
}))

vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: vi.fn((definition) => definition),
}))

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid'),
}))

vi.mock('src/background/messagePassing/messageUtils', () => ({
  addWindowMessageListener: vi.fn(),
  removeWindowMessageListener: vi.fn(),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('src/contentScript/WindowEthereumProxy', () => ({
  WindowEthereumProxy: vi.fn().mockImplementation(() => ({
    emit: vi.fn(),
    isMetaMask: false,
  })),
}))

describe('ethereum.content', () => {
  let definition: { main: () => void }
  let postMessageSpy: MockInstance

  beforeEach(() => {
    vi.resetModules()
    // Reset the mock flag before re-requiring
    mockIsSandboxed = false
    // Clear window.ethereum
    Object.defineProperty(window, 'ethereum', { value: undefined, writable: true, configurable: true })
    // jsdom's postMessage requires a targetOrigin; spy to prevent the call from throwing
    postMessageSpy = vi.spyOn(window, 'postMessage').mockImplementation(vi.fn())
  })

  afterEach(() => {
    postMessageSpy.mockRestore()
  })

  describe('normal frame', () => {
    beforeEach(async () => {
      mockIsSandboxed = false
      definition = (await import('../entrypoints/ethereum.content')).default as unknown as { main: () => void }
    })

    it('assigns window.ethereum after main()', () => {
      const eip6963Listener = vi.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(window.ethereum).toBeDefined()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })

    it('fires EIP-6963 announceProvider event', () => {
      const eip6963Listener = vi.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(eip6963Listener).toHaveBeenCalled()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })
  })

  describe('sandboxed frame', () => {
    beforeEach(async () => {
      mockIsSandboxed = true
      definition = (await import('../entrypoints/ethereum.content')).default as unknown as { main: () => void }
    })

    it('does NOT assign window.ethereum', () => {
      const eip6963Listener = vi.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(window.ethereum).toBeUndefined()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })

    it('does NOT fire EIP-6963 announceProvider event', () => {
      const eip6963Listener = vi.fn()
      window.addEventListener('eip6963:announceProvider', eip6963Listener)

      definition.main()

      expect(eip6963Listener).not.toHaveBeenCalled()

      window.removeEventListener('eip6963:announceProvider', eip6963Listener)
    })
  })
})
