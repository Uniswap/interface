import { CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface CopyToClipboardParams {
  textToCopy: string
  copyType: CopyNotificationType
}

export type CopyToClipboardFunction = (params: CopyToClipboardParams) => Promise<void>

/**
 * Hook for copying text to clipboard with notification
 * This is a platform-specific implementation stub that will be replaced
 * by the appropriate platform-specific implementation
 */
export function useCopyToClipboard(): CopyToClipboardFunction {
  throw new PlatformSplitStubError('useCopyToClipboard not implemented for this platform')
}
