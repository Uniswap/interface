import { TradeType } from '@uniswap/sdk-core'
import type { Percent } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import {
  InterfaceTransactionDetails,
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useAccount } from '~/hooks/useAccount'
import { useSelectChain } from '~/hooks/useSelectChain'
import { useUniswapXSwapCallback } from '~/hooks/useUniswapXSwapCallback'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import type { InterfaceTrade } from '~/state/routing/types'
import { isLimitTrade, isUniswapXTrade } from '~/state/routing/utils'
import type { LimitOrderResult } from '~/types/trade'

// Returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useLimitOrderCallback({
  trade,
  fiatValues,
  allowedSlippage,
}: {
  trade?: InterfaceTrade // trade to execute
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number } // usd values for amount in and out, and the fee value, logged for analytics
  allowedSlippage: Percent // in bips
}) {
  const dispatch = useDispatch()
  const account = useAccount()
  const supportedConnectedChainId = useSupportedChainId(account.chainId)
  const { chainId: swapChainId } = useMultichainContext()

  const swapCallback = useUniswapXSwapCallback({
    trade: isUniswapXTrade(trade) ? trade : undefined,
    allowedSlippage,
    fiatValues,
  })

  const selectChain = useSelectChain()

  return useCallback(async (): Promise<LimitOrderResult> => {
    if (!trade) {
      throw new Error('missing trade')
    } else if (!account.isConnected || !account.address) {
      throw new Error('wallet must be connected to swap')
    } else if (!swapChainId) {
      throw new Error('missing swap chainId')
    } else if (!isEVMChain(swapChainId)) {
      throw new Error('non EVM chain in legacy limits flow')
    } else if (!supportedConnectedChainId || supportedConnectedChainId !== swapChainId) {
      const correctChain = await selectChain(swapChainId)
      if (!correctChain) {
        throw new Error('wallet must be connected to correct chain to swap')
      }
    }
    const result = await swapCallback()

    const swapInfo: TransactionTypeInfo = {
      type: TransactionType.Swap,
      inputCurrencyId: currencyId(trade.inputAmount.currency),
      outputCurrencyId: currencyId(trade.outputAmount.currency),
      isUniswapXOrder: true,
      ...(trade.tradeType === TradeType.EXACT_INPUT
        ? {
            tradeType: TradeType.EXACT_INPUT,
            inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
            expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
          }
        : {
            tradeType: TradeType.EXACT_OUTPUT,
            maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
            outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
            expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
          }),
    }

    // Limit orders need to be added manually since they don't go through the saga when initially submitted
    if (isLimitTrade(trade)) {
      // Create transaction details for limit order
      const limitOrderTransaction: UniswapXOrderDetails<InterfaceTransactionDetails> = {
        id: result.response.orderHash,
        chainId: swapChainId,
        from: account.address!,
        status: TransactionStatus.Pending,
        addedTime: Date.now(),
        transactionOriginType: TransactionOriginType.Internal,
        typeInfo: swapInfo,
        routing: TradingApi.Routing.DUTCH_LIMIT,
        orderHash: result.response.orderHash,
        queueStatus: QueuedOrderStatus.Submitted,
        encodedOrder: result.response.encodedOrder,
        expiry: result.response.deadline,
      }

      dispatch(addTransaction(limitOrderTransaction))
    }

    return result
  }, [
    account.address,
    account.isConnected,
    allowedSlippage,
    dispatch,
    selectChain,
    supportedConnectedChainId,
    swapCallback,
    swapChainId,
    trade,
  ])
}
