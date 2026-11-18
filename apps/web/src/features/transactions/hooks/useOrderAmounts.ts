import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { hasTradeType } from 'uniswap/src/features/transactions/swap/utils/trade'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useCurrency } from '~/hooks/currency/useCurrency'

export function useOrderAmounts(order?: UniswapXOrderDetails):
  | {
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }
  | undefined {
  const typeInfo = order?.typeInfo
  const swapInfo = typeInfo && hasTradeType(typeInfo) ? typeInfo : undefined

  const inputCurrency = useCurrency({
    address: swapInfo ? currencyIdToAddress(swapInfo.inputCurrencyId) : undefined,
    chainId: order?.chainId,
  })
  const outputCurrency = useCurrency({
    address: swapInfo ? currencyIdToAddress(swapInfo.outputCurrencyId) : undefined,
    chainId: order?.chainId,
  })

  if (!order || !swapInfo) {
    return undefined
  }

  if (!inputCurrency || !outputCurrency) {
    logger.warn('OffchainActivityModal', 'useOrderAmounts', 'Could not find token(s) for order', {
      hash: order.hash,
    })
    return undefined
  }

  if (swapInfo.tradeType === TradeType.EXACT_INPUT) {
    return {
      inputAmount: CurrencyAmount.fromRawAmount(inputCurrency, swapInfo.inputCurrencyAmountRaw),
      outputAmount: CurrencyAmount.fromRawAmount(
        outputCurrency,
        swapInfo.settledOutputCurrencyAmountRaw ?? swapInfo.expectedOutputCurrencyAmountRaw,
      ),
    }
  } else {
    return {
      inputAmount: CurrencyAmount.fromRawAmount(inputCurrency, swapInfo.expectedInputCurrencyAmountRaw),
      outputAmount: CurrencyAmount.fromRawAmount(outputCurrency, swapInfo.outputCurrencyAmountRaw),
    }
  }
}
