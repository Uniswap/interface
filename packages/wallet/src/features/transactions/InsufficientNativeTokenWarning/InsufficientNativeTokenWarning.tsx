import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { Warning } from 'uniswap/src/features/transactions/WarningModal/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type InsufficientNativeTokenWarningProps = {
  warnings: Warning[]
  flow: 'send' | 'swap'
  gasFee: GasFeeResult
}

export function InsufficientNativeTokenWarning(_: InsufficientNativeTokenWarningProps): JSX.Element | null {
  throw new PlatformSplitStubError('InsufficientNativeTokenWarning')
}
