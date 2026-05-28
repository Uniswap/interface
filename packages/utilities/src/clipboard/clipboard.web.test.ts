import { getClipboard, setClipboard, setClipboardImage } from 'utilities/src/clipboard/clipboard.web'
import { describe, expect, it, vi } from 'vitest'

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

/** jsdom does not provide document.execCommand; stub it so the fallback copy path can run. */
function stubExecCommand(impl: (command: string) => boolean): void {
  if (typeof (document as Document & { execCommand?: (command: string) => boolean }).execCommand !== 'function') {
    Object.defineProperty(document, 'execCommand', {
      value: impl,
      writable: true,
      configurable: true,
    })
  } else {
    vi.spyOn(document, 'execCommand').mockImplementation(impl)
  }
}

describe('clipboard.web', () => {
  const originalClipboard = navigator.clipboard

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    })
  })

  describe('setClipboard', () => {
    it('writes text via Clipboard API when available', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText, readText: vi.fn() },
        writable: true,
        configurable: true,
      })

      await setClipboard('hello')

      expect(writeText).toHaveBeenCalledWith('hello')
    })

    it('falls back to execCommand when navigator.clipboard is undefined', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      })
      const execCommand = vi.fn().mockReturnValue(true)
      stubExecCommand(execCommand)

      await setClipboard('fallback text')

      expect(execCommand).toHaveBeenCalledWith('copy')
    })

    it('falls back to execCommand when Clipboard API writeText rejects', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('Permission denied'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText, readText: vi.fn() },
        writable: true,
        configurable: true,
      })
      const execCommand = vi.fn().mockReturnValue(true)
      stubExecCommand(execCommand)

      await setClipboard('after reject')

      expect(execCommand).toHaveBeenCalledWith('copy')
    })
  })

  describe('getClipboard', () => {
    it('returns text from Clipboard API when available', async () => {
      const readText = vi.fn().mockResolvedValue('pasted content')
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn(), readText },
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(readText).toHaveBeenCalled()
      expect(result).toBe('pasted content')
    })

    it('returns undefined when navigator.clipboard is undefined', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBeUndefined()
    })

    it('returns undefined when readText rejects', async () => {
      const readText = vi.fn().mockRejectedValue(new Error('Permission denied'))
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn(), readText },
        writable: true,
        configurable: true,
      })

      const result = await getClipboard()

      expect(result).toBeUndefined()
    })
  })

  describe('setClipboardImage', () => {
    it('resolves without writing (no-op on web)', async () => {
      await expect(setClipboardImage('https://example.com/image.png')).resolves.toBeUndefined()
      await expect(setClipboardImage(undefined)).resolves.toBeUndefined()
    })
  })
})
