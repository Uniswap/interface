import { PnlMetric } from 'uniswap/src/components/ProfitLoss/PnlDefinitions'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface PnlInfoTriggerProps {
  metrics?: PnlMetric[]
  footer?: string
}

export function PnlInfoTrigger(_props: PnlInfoTriggerProps): JSX.Element {
  throw new PlatformSplitStubError('PnlInfoTrigger')
}
