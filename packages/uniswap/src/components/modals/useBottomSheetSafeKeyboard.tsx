import { PlatformSplitStubError } from 'utilities/src/errors'

export function useBottomSheetSafeKeyboard(): {
  keyboardHeight: number
} {
  throw new PlatformSplitStubError('useBottomSheetSafeKeyboard')
}
