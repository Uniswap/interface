import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function CurrentScreen(_props: {
  settings: SwapSettingConfig[]
  onSubmitSwap?: () => Promise<void>
  tokenColor?: string
}): JSX.Element {
  throw new PlatformSplitStubError('CurrentScreen')
}
