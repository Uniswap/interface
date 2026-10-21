import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { buildEarnQuoteGasParams } from 'uniswap/src/features/earn/earnQuoteGasParams'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getTokenAddressForApi } from 'uniswap/src/features/transactions/swap/utils/tradingApi'

export function getWithdrawQuoteRequestBase({
  accountAddress,
  currency,
  outputTradingApiChainId,
  vault,
  vaultTradingApiChainId,
  withdrawAmount,
}: {
  accountAddress: string | undefined
  currency: Currency | undefined
  outputTradingApiChainId: TradingApi.ChainId | undefined
  vault: EarnVaultInfo
  vaultTradingApiChainId: TradingApi.ChainId | undefined
  withdrawAmount: CurrencyAmount<Currency> | undefined
}): TradingApi.QuoteRequest | undefined {
  const tokenOut = getTokenAddressForApi(currency)
  if (
    !accountAddress ||
    !currency ||
    !withdrawAmount ||
    !tokenOut ||
    !outputTradingApiChainId ||
    !vaultTradingApiChainId
  ) {
    return undefined
  }

  return {
    type: TradingApi.TradeType.EXACT_INPUT,
    amount: withdrawAmount.quotient.toString(),
    tokenIn: vault.vaultAddress,
    tokenOut,
    tokenInChainId: vaultTradingApiChainId,
    tokenOutChainId: outputTradingApiChainId,
    swapper: accountAddress,
    recipient: accountAddress,
    routingPreference: TradingApi.RoutingPreference.BEST_PRICE,
    autoSlippage: TradingApi.AutoSlippage.DEFAULT,
    ...buildEarnQuoteGasParams(),
  }
}
