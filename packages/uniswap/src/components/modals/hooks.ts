import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * @deprecated use useFocusEffect from @react-navigation/core instead and pass it to BottomSheetView
 */
export function useBottomSheetFocusHook(): () => void {
  throw new PlatformSplitStubError('useBottomSheetFocusHook')
}
