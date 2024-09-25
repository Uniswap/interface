import { PlatformSplitStubError } from 'utilities/src/errors'

export interface KeyboardInfo {
  keyboardHeight: number
}

export function useBottomSheetSafeKeyboard(): KeyboardInfo {
  throw new PlatformSplitStubError('useBottomSheetSafeKeyboard')
}
