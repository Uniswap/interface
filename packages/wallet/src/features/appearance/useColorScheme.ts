import { PlatformSplitStubError } from 'utilities/src/errors'
import { type ColorScheme } from 'wallet/src/features/appearance/types'

export const useColorScheme = (): ColorScheme => {
  throw new PlatformSplitStubError('Use the correct hook for your platform')
}
