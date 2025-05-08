import { createFetchGasFee } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { getWrapTransactionRequest } from 'uniswap/src/features/transactions/swap/contexts/hooks/useWrapTransactionRequest'
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
    async getSwapTxAndGasInfo({ account, derivedSwapInfo }) {
      const currencyAmountIn = derivedSwapInfo.currencyAmounts.input
      const from = account?.address

      if (!currencyAmountIn) {
        throw new Error('Currency amount in is required')
      }

      const wrapTxRequest = await getWrapTransactionRequest({ currencyAmountIn, from })

      // TODO(WALL-6421): Remove this handling once GasFeeResult shape is decoupled from state fields
      const { data: statelessGasFeeResult, error } = await tryCatch(
        fetchGasFee({ tx: wrapTxRequest, fallbackGasLimit }),
      )
      const gasFeeResult: GasFeeResult = { ...statelessGasFeeResult, error, isLoading: false }

      const swapTxInfo = processWrapResponse({ gasFeeResult, wrapTxRequest })

      return getWrapTxAndGasInfo({ swapTxInfo })
    },
  }

  return service
}
