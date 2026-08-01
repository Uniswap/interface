import { addWindowMessageListener } from 'src/background/messagePassing/messageUtils'
import { isSandboxedFrame as isSandboxedFrameImport } from 'src/contentScript/isSandboxedFrame'
import type { Mock } from 'vitest'

vi.mock('src/contentScript/isSandboxedFrame', () => ({
  isSandboxedFrame: vi.fn(() => false),
}))

const isSandboxedFrame = isSandboxedFrameImport as Mock

interface TestMessage {
  type: 'TEST'
  payload: string
}

function isTestMessage(message: unknown): message is TestMessage {
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
  return typeof message === 'object' && message !== null && (message as TestMessage).type === 'TEST'
}

function dispatchWindowMessage(data: unknown, source: MessageEventSource | null = window): void {
  const event = new MessageEvent('message', { data, source })
  window.dispatchEvent(event)
}

describe('addWindowMessageListener', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('normal frame (isSandboxedFrame returns false)', () => {
    beforeEach(() => {
      isSandboxedFrame.mockReturnValue(false)
    })

    it('calls handler when validator passes and source is window', () => {
      const handler = vi.fn()
      addWindowMessageListener({ validator: isTestMessage, handler })

      dispatchWindowMessage({ type: 'TEST', payload: 'hello' })

      expect(handler).toHaveBeenCalledWith({ type: 'TEST', payload: 'hello' }, window)
    })

    it('calls invalidMessageHandler when validator fails', () => {
      const handler = vi.fn()
      const invalidMessageHandler = vi.fn()
      addWindowMessageListener({ validator: isTestMessage, handler, invalidMessageHandler })

      dispatchWindowMessage({ type: 'INVALID' })

      expect(handler).not.toHaveBeenCalled()
      expect(invalidMessageHandler).toHaveBeenCalledWith({ type: 'INVALID' }, window)
    })

    it('rejects when event.source is not window', () => {
      const handler = vi.fn()
      const invalidMessageHandler = vi.fn()
      addWindowMessageListener({ validator: isTestMessage, handler, invalidMessageHandler })

      dispatchWindowMessage({ type: 'TEST', payload: 'hello' }, null)

      expect(handler).not.toHaveBeenCalled()
      expect(invalidMessageHandler).toHaveBeenCalled()
    })

    it('removes listener when removeAfterHandled is true', () => {
      const handler = vi.fn()
      addWindowMessageListener({
        validator: isTestMessage,
        handler,
        options: { removeAfterHandled: true },
      })

      dispatchWindowMessage({ type: 'TEST', payload: 'first' })
      dispatchWindowMessage({ type: 'TEST', payload: 'second' })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({ type: 'TEST', payload: 'first' }, window)
    })
  })

  describe('sandboxed frame (isSandboxedFrame returns true)', () => {
    beforeEach(() => {
      isSandboxedFrame.mockReturnValue(true)
    })

    it('does NOT call handler even when validator passes and source is window', () => {
      const handler = vi.fn()
      addWindowMessageListener({ validator: isTestMessage, handler })

      dispatchWindowMessage({ type: 'TEST', payload: 'hello' })

      expect(handler).not.toHaveBeenCalled()
    })

    it('calls invalidMessageHandler when rejected due to sandbox', () => {
      const handler = vi.fn()
      const invalidMessageHandler = vi.fn()
      addWindowMessageListener({ validator: isTestMessage, handler, invalidMessageHandler })

      dispatchWindowMessage({ type: 'TEST', payload: 'hello' })

      expect(handler).not.toHaveBeenCalled()
      expect(invalidMessageHandler).toHaveBeenCalledWith({ type: 'TEST', payload: 'hello' }, window)
    })
  })
})
