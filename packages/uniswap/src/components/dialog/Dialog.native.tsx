import type { DialogProps } from 'uniswap/src/components/dialog/DialogProps'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function Dialog(_: DialogProps): JSX.Element {
  throw new PlatformSplitStubError('Dialog')
}
