import type { AppStateStatus } from 'react-native'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** This hook will only ever be triggered in the mobile app, invoking `callback` when state becomes `expectedState`. This hook will no-op on web. */
export function useOnMobileAppState(_expectedState: AppStateStatus, _callback: () => void): void {
  throw new PlatformSplitStubError('useMobileAppStateTrigger')
}
