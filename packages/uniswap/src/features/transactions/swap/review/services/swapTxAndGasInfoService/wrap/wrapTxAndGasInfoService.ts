import { createFetchGasFee } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { getWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/contexts/hooks/useWrapTransactionRequest'
import { WRAP_FALLBACK_GAS_LIMIT_IN_GWEI } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/constants'
import { SwapTxAndGasInfoService } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/swapTxAndGasInfoService'
import {
  getWrapTxAndGasInfo,
  processWrapResponse,
} from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/utils'
import { tryCatch } from 'utilities/src/errors'

interface WrapTxAndGasInfoServiceContext {
  activeGasStrategy: GasStrategy
  shadowGasStrategies: GasStrategy[]
  fallbackGasLimit?: number
}

export function createWrapTxAndGasInfoService(ctx: WrapTxAndGasInfoServiceContext): SwapTxAndGasInfoService<undefined> {
  const { activeGasStrategy, shadowGasStrategies, fallbackGasLimit } = ctx
  const fetchGasFee = createFetchGasFee({ activeGasStrategy, shadowGasStrategies })

  const service: SwapTxAndGasInfoService<undefined> = {
    async getSwapTxAndGasInfo({ account, derivedSwapInfo, approvalTxInfo }) {
      const currencyAmountIn = derivedSwapInfo.currencyAmounts.input
      const from = account?.address
      const wrapType = derivedSwapInfo.wrapType
      const currencyOut = derivedSwapInfo.currencies.output?.currency

      if (!currencyAmountIn) {
        throw new Error('Currency amount in is required')
      }

      const wrapTxRequest = await getWrapTransactionRequest({
        currencyAmountIn,
        from,
        wrapType,
        currencyOut,
      })
      // TODO(WALL-6421): Remove this handling once GasFeeResult shape is decoupled from state fields
      const { data: statelessGasFeeResult, error } = await tryCatch(
        fetchGasFee({ tx: wrapTxRequest, fallbackGasLimit }),
      )
      const gasFeeResult: GasFeeResult = { ...statelessGasFeeResult, error, isLoading: false }

      // If gas estimation failed, use fallback gas limit
      const fallbackGasParams =
        !gasFeeResult.params && (fallbackGasLimit || WRAP_FALLBACK_GAS_LIMIT_IN_GWEI)
          ? { gasLimit: fallbackGasLimit || WRAP_FALLBACK_GAS_LIMIT_IN_GWEI }
          : undefined

      const swapTxInfo = processWrapResponse({ gasFeeResult, wrapTxRequest, fallbackGasParams })

      return getWrapTxAndGasInfo({ swapTxInfo, approvalTxInfo })
    },
  }

  return service
}
