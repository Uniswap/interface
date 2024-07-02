import { NotImplementedError } from 'utilities/src/errors'

export type KeyboardLayout = { isVisible: boolean; containerHeight: number }

export function useKeyboardLayout(): KeyboardLayout {
  throw new NotImplementedError('See `.native.ts` file.')
}
