import { useMemo } from 'react'
import {
  useFormattedUniswapXGasFeeInfo,
  useGasFeeFormattedDisplayAmounts,
  useGasFeeHighRelativeToValue,
} from 'uniswap/src/features/gas/hooks'
import type { GasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/types'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { usePrevious } from 'utilities/src/react/hooks'

// TODO: WALL-6293
export function useDebouncedGasInfo(): GasInfo {
  const { chainId, currencyAmountsUSDValue, trade, currencyAmounts, exactCurrencyField } =
    useSwapFormStoreDerivedSwapInfo((s) => ({
      chainId: s.chainId,
      currencyAmountsUSDValue: s.currencyAmountsUSDValue,
      trade: s.trade,
      currencyAmounts: s.currencyAmounts,
      exactCurrencyField: s.exactCurrencyField,
    }))
  const inputUSDValue = currencyAmountsUSDValue[CurrencyField.INPUT]
  const outputUSDValue = currencyAmountsUSDValue[CurrencyField.OUTPUT]

  const { gasFee, gasFeeBreakdown } = useSwapTxStore((s) => {
    if (isUniswapX(s)) {
      return {
        gasFee: s.gasFee,
        gasFeeBreakdown: s.gasFeeBreakdown,
      }
    }

    return {
      gasFee: s.gasFee,
      gasFeeBreakdown: undefined,
    }
  })

  const uniswapXGasFeeInfo = useFormattedUniswapXGasFeeInfo(gasFeeBreakdown, chainId)

  const { gasFeeFormatted, gasFeeUSD } = useGasFeeFormattedDisplayAmounts({
    gasFee,
    chainId,
    placeholder: undefined,
  })

  const isHighRelativeToValue = useGasFeeHighRelativeToValue(gasFeeUSD, outputUSDValue ?? inputUSDValue)

  const amountChanged = usePrevious(currencyAmounts[exactCurrencyField]) !== currencyAmounts[exactCurrencyField]
  const tradeChanged = usePrevious(trade.trade) !== trade.trade && Boolean(trade.trade)

  const tradeLoadingOrRefetching = Boolean(trade.isLoading || trade.isFetching)
  const gasLoading = Boolean(gasFee.isLoading || (gasFee.value && !gasFeeUSD))

  const isLoading = tradeLoadingOrRefetching || gasLoading || amountChanged || tradeChanged

  return useMemo(
    () => ({
      gasFee,
      fiatPriceFormatted: gasFeeFormatted ?? undefined,
      isHighRelativeToValue,
      uniswapXGasFeeInfo,
      isLoading,
      chainId,
    }),
    [gasFee, gasFeeFormatted, isHighRelativeToValue, isLoading, uniswapXGasFeeInfo, chainId],
  )
}
