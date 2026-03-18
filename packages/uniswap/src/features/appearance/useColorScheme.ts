import { type ColorScheme } from 'uniswap/src/features/appearance/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export const useColorScheme = (): ColorScheme => {
  throw new PlatformSplitStubError('Use the correct hook for your platform')
}
