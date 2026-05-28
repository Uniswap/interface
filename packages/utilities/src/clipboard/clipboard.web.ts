import type { IClipboard } from 'utilities/src/clipboard/clipboard'
import { logger } from 'utilities/src/logger/logger'

/**
 * Legacy clipboard copy using execCommand.
 * Creates a temporary textarea, selects its content, and executes the copy command.
 */
function copyWithExecCommand(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.cssText = [
    'position: fixed',
    'top: 0',
    'left: 0',
    'width: 2em',
    'height: 2em',
    'padding: 0',
    'border: none',
    'outline: none',
    'box-shadow: none',
    'background: transparent',
    'font-size: 16px',
    'transform: translateX(-9999px)',
  ].join(';')

  document.body.appendChild(textarea)

  let success = false

  try {
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    success = document.execCommand('copy')
    if (!success) {
      logger.warn('clipboard.web', 'copyWithExecCommand', 'execCommand returned false')
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'clipboard.web', function: 'copyWithExecCommand' },
    })
  } finally {
    document.body.removeChild(textarea)
  }

  return success
}

// navigator.clipboard can be undefined in older browsers or non-secure contexts (e.g. HTTP, iframes)
const getClipboardAPI = (): { writeText(s: string): Promise<void>; readText(): Promise<string> } | undefined =>
  (navigator as { clipboard?: { writeText(s: string): Promise<void>; readText(): Promise<string> } }).clipboard

const Clipboard: IClipboard = {
  setClipboard: async (value: string) => {
    const clipboard = getClipboardAPI()
    if (clipboard) {
      try {
        await clipboard.writeText(value)
        return
      } catch (error) {
        logger.debug('clipboard.web', 'setClipboard', 'Clipboard API failed, trying fallback', { error })
      }
    }
    const success = copyWithExecCommand(value)
    if (!success) {
      logger.error(new Error('setClipboard failed'), {
        tags: { file: 'clipboard.web', function: 'setClipboard' },
      })
    }
  },
  getClipboard: async () => {
    const clipboard = getClipboardAPI()
    if (!clipboard) {
      return undefined
    }
    try {
      return await clipboard.readText()
    } catch (error) {
      logger.error(error, {
        tags: { file: 'clipboard.web', function: 'getClipboard' },
      })
      return undefined
    }
  },
  setClipboardImage: async (_imageUrl: string | undefined) => {
    // Image clipboard is not implemented on web (no standard API for writing image to clipboard in all browsers)
  },
}

export async function setClipboard(value: string): Promise<void> {
  return Clipboard.setClipboard(value)
}

export async function getClipboard(): Promise<string | void> {
  return Clipboard.getClipboard()
}

export async function setClipboardImage(imageUrl: string | undefined): Promise<void> {
  return Clipboard.setClipboardImage(imageUrl)
}
