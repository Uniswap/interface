import { NotImplementedError } from 'utilities/src/errors'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { Warning } from 'wallet/src/features/transactions/WarningModal/types'

export type InsufficientNativeTokenWarningProps = {
  warnings: Warning[]
  flow: 'send' | 'swap'
  gasFee: GasFeeResult
}

export function InsufficientNativeTokenWarning(_: InsufficientNativeTokenWarningProps): JSX.Element | null {
  throw new NotImplementedError('InsufficientNativeTokenWarning')
}
