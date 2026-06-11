import { SlippageControl as SlippageControlBase } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/SlippageControl.native'
import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'

export function SlippageControl(_props: SlippageControlProps): JSX.Element {
  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade).trade
  const isBridgeTrade = trade ? isBridge(trade) : false

  return <SlippageControlBase isZeroSlippage={isBridgeTrade} saveOnBlur={_props.saveOnBlur} />
}
