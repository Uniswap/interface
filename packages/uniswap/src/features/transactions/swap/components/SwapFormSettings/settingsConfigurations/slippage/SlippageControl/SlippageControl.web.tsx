import { SlippageControl as SlippageControlBase } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/SlippageControl.web'
import type { SlippageControlProps } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/SlippageControl/types'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { BridgeTrade } from 'uniswap/src/features/transactions/swap/types/trade'

export function SlippageControl(props: SlippageControlProps): JSX.Element {
  const trade = useSwapFormStoreDerivedSwapInfo((s) => s.trade)
  const isBridgeTrade = trade.trade instanceof BridgeTrade

  return <SlippageControlBase saveOnBlur={props.saveOnBlur} isZeroSlippage={isBridgeTrade} />
}
