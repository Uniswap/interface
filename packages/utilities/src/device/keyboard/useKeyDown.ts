import { UseKeyDownProps } from 'utilities/src/device/keyboard/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

/** On desktop, this will trigger a keyboard event listener. No-op on mobile. */
export const useKeyDown = (_: UseKeyDownProps): void => {
  throw new PlatformSplitStubError('useKeyDown')
}
