import { PlatformSplitStubError } from 'utilities/src/errors'

export type KeyboardLayout = { isVisible: boolean; containerHeight: number }

export function useKeyboardLayout(): KeyboardLayout {
  throw new PlatformSplitStubError('See `.native.ts` file.')
}
