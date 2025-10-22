import type { DialogProps } from 'uniswap/src/components/dialog/DialogProps'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * A dialog component that renders platform-specific implementations.
 * Web/extension: Modal dialog
 * Native: To be implemented
 */
export function Dialog(_: DialogProps): JSX.Element {
  throw new PlatformSplitStubError('Dialog')
}
