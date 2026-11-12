import { PlatformSplitStubError } from 'utilities/src/errors'

/** Dummy clipboard class. Overridden by mobile or extension related code. */

export interface IClipboard {
  /** Resolves false when the copy failed; it never rejects. */
  setClipboard(value: string): Promise<boolean>
  getClipboard(): Promise<string | void>
  setClipboardImage(imageUrl: string | undefined): Promise<void>
}

/** This will be overridden by the compiler with platform-specific clipboard file. */
const Clipboard: IClipboard = {
  setClipboard: () => {
    throw new PlatformSplitStubError('setClipboard')
  },
  getClipboard: () => {
    throw new PlatformSplitStubError('getClipboard')
  },
  setClipboardImage: () => {
    throw new PlatformSplitStubError('setClipboardImage')
  },
}

export async function setClipboard(value: string): Promise<boolean> {
  return Clipboard.setClipboard(value)
}

export async function getClipboard(): Promise<string | void> {
  return Clipboard.getClipboard()
}

export async function setClipboardImage(imageUrl: string | undefined): Promise<void> {
  return Clipboard.setClipboardImage(imageUrl)
}
