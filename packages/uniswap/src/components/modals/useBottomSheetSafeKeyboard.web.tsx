import { KeyboardInfo } from 'uniswap/src/components/modals/useBottomSheetSafeKeyboard'

export function useBottomSheetSafeKeyboard(): KeyboardInfo {
  // Not yet accounting for mWeb
  return { keyboardHeight: 0 }
}
