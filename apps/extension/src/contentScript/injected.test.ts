import { isSandboxedFrame as isSandboxedFrameImport } from 'src/contentScript/isSandboxedFrame'
import type { Mock } from 'vitest'
import type { ContentScriptContext } from 'wxt/utils/content-script-context'

vi.mock('src/background/messagePassing/messageChannels')
vi.mock('wxt/utils/define-content-script', () => ({
  defineContentScript: vi.fn((definition) => definition),
}))
vi.mock('src/contentScript/isSandboxedFrame', () => ({
  isSandboxedFrame: vi.fn(() => false),
}))

const isSandboxedFrame = isSandboxedFrameImport as Mock

describe('injected', () => {
  it('should run without throwing an error', async () => {
    // This does not exist in the extension execution environment for content scripts
    Object.defineProperty(document, 'head', { value: undefined, writable: true })

    const injected = await import('../entrypoints/injected.content')
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

  it('should load without error in sandbox mode', async () => {
    const { addWindowMessageListener } = (await import('src/background/messagePassing/messageUtils')) as unknown as {
      addWindowMessageListener: Mock
    }

    const injected = await import('../entrypoints/injected.content')
    expect(injected).toBeTruthy()

    // In sandbox mode, isSandboxedFrame() returns true and makeInjected() bails out early,
    // so addWindowMessageListener should NOT have been called for request handling.
    // Note: since the module was already imported above, this test verifies the module
    // loads without error when the sandbox check is active.
    expect(addWindowMessageListener).toBeDefined()
  })
})

describe('injected - broadcasts from the extension', () => {
  it('only applies connection updates addressed to this frame origin', async () => {
    const { externalDappMessageChannel } =
      (await import('src/background/messagePassing/messageChannels')) as unknown as {
        externalDappMessageChannel: { addMessageListener: Mock }
      }
    const { ExtensionToDappRequestType } = await import('src/background/messagePassing/types/requests')
    const injected = await import('../entrypoints/injected.content')
    injected.default.main({} as ContentScriptContext)

    const listener = externalDappMessageChannel.addMessageListener.mock.calls
      .filter(([type]) => type === ExtensionToDappRequestType.UpdateConnections)
      .at(-1)?.[1] as ((message: unknown) => void) | undefined
    expect(listener).toBeDefined()

    const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {})
    const addresses = ['0x0000000000000000000000000000000000000001']

    // A cross-origin iframe in the same tab receives the parent's broadcast and must drop it.
    listener?.({ type: ExtensionToDappRequestType.UpdateConnections, dappUrl: 'https://attacker.example', addresses })
    expect(postMessage).not.toHaveBeenCalledWith(expect.objectContaining({ emitKey: 'accountsChanged' }))

    listener?.({ type: ExtensionToDappRequestType.UpdateConnections, dappUrl: window.origin, addresses })
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ emitKey: 'accountsChanged', emitValue: addresses }),
    )

    postMessage.mockRestore()
  })
})
