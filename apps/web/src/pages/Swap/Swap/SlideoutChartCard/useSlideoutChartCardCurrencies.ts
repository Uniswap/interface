import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'

export function useSlideoutChartCardCurrencies() {
  const { currentTab, currencyState } = useSwapAndLimitContext()
  const isLimitTab = currentTab === SwapTab.Limit

  const swapInputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.INPUT]?.currency)
  const swapOutputCurrency = useSwapFormStoreDerivedSwapInfo((s) => s.currencies[CurrencyField.OUTPUT]?.currency)

  return {
    inputCurrency: isLimitTab ? currencyState.inputCurrency : swapInputCurrency,
    outputCurrency: isLimitTab ? currencyState.outputCurrency : swapOutputCurrency,
  }
}
