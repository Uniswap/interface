import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

/**
 * Base implementation of the slippage setting control.
 * For the swap-specific implementation, see SwapFormSettings.
 */
export function SlippageControl(_props: SlippageControlProps): JSX.Element {
  throw new PlatformSplitStubError('SlippageControl')
}
