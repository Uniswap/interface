import { SlippageControl as SlippageControlBase } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/SlippageControl.web'
import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'

export function SlippageControl(props: SlippageControlProps): JSX.Element {
  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade)
  const isBridgeTrade = trade.trade ? isBridge(trade.trade) : false

  return <SlippageControlBase saveOnBlur={props.saveOnBlur} isZeroSlippage={isBridgeTrade} />
}
