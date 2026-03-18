import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Swap-specific implementation of the slippage control.
 */
export function SlippageControl(_props: SlippageControlProps): JSX.Element {
  throw new PlatformSplitStubError('SlippageControl')
}
