import { BigNumber } from '@ethersproject/bignumber'
import type { Percent } from '@uniswap/sdk-core'
import { TradeType } from '@uniswap/sdk-core'
import type { FlatFeeOptions } from '@uniswap/universal-router-sdk'
import type { FeeOptions } from '@uniswap/v3-sdk'
import { TradingApi } from '@universe/api'
import { useAccount } from 'hooks/useAccount'
import type { PermitSignature } from 'hooks/usePermitAllowance'
import useSelectChain from 'hooks/useSelectChain'
import { useUniswapXSwapCallback } from 'hooks/useUniswapXSwapCallback'
import { useUniversalRouterSwapCallback } from 'hooks/useUniversalRouter'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import type { InterfaceTrade } from 'state/routing/types'
import { TradeFillType } from 'state/routing/types'
import { isClassicTrade, isLimitTrade, isUniswapXTrade } from 'state/routing/utils'
import { useTransaction, useTransactionAdder } from 'state/transactions/hooks'
import type { TransactionInfo } from 'state/transactions/types'
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
import { currencyId } from 'uniswap/src/utils/currencyId'

export type SwapResult = Awaited<ReturnType<ReturnType<typeof useSwapCallback>>>

type UniversalRouterFeeField = { feeOptions: FeeOptions } | { flatFeeOptions: FlatFeeOptions }

function getUniversalRouterFeeFields(trade?: InterfaceTrade): UniversalRouterFeeField | undefined {
  if (!isClassicTrade(trade)) {
    return undefined
  }
  if (!trade.swapFee) {
    return undefined
  }

  if (trade.tradeType === TradeType.EXACT_INPUT) {
    return { feeOptions: { fee: trade.swapFee.percent, recipient: trade.swapFee.recipient } }
  } else {
    return { flatFeeOptions: { amount: BigNumber.from(trade.swapFee.amount), recipient: trade.swapFee.recipient } }
  }
}

// Returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback({
  trade,
  fiatValues,
  allowedSlippage,
  permitSignature,
}: {
  trade?: InterfaceTrade // trade to execute
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number } // usd values for amount in and out, and the fee value, logged for analytics
  allowedSlippage: Percent // in bips
  permitSignature?: PermitSignature
}) {
  const dispatch = useDispatch()
  const addClassicTransaction = useTransactionAdder()
  const account = useAccount()
  const supportedConnectedChainId = useSupportedChainId(account.chainId)
  const { chainId: swapChainId } = useMultichainContext()

  const uniswapXSwapCallback = useUniswapXSwapCallback({
    trade: isUniswapXTrade(trade) ? trade : undefined,
    allowedSlippage,
    fiatValues,
  })

  const universalRouterSwapCallback = useUniversalRouterSwapCallback({
    trade: isClassicTrade(trade) ? trade : undefined,
    fiatValues,
    options: {
      slippageTolerance: allowedSlippage,
      permit: permitSignature,
      ...getUniversalRouterFeeFields(trade),
    },
  })

  const selectChain = useSelectChain()
  const swapCallback = isUniswapXTrade(trade) ? uniswapXSwapCallback : universalRouterSwapCallback

  return useCallback(async () => {
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

    const swapInfo: TransactionInfo = {
      type: TransactionType.Swap,
      inputCurrencyId: currencyId(trade.inputAmount.currency),
      outputCurrencyId: currencyId(trade.outputAmount.currency),
      isUniswapXOrder: result.type === TradeFillType.UniswapX || result.type === TradeFillType.UniswapXv2,
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
    if (result.type === TradeFillType.Classic) {
      addClassicTransaction(result.response, swapInfo, result.deadline?.toNumber())
    } else if (isLimitTrade(trade)) {
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
    addClassicTransaction,
    allowedSlippage,
    dispatch,
    selectChain,
    supportedConnectedChainId,
    swapCallback,
    swapChainId,
    trade,
  ])
}

export function useSwapTransactionStatus(swapResult: SwapResult | undefined): TransactionStatus | undefined {
  const transaction = useTransaction(swapResult?.type === TradeFillType.Classic ? swapResult.response.hash : undefined)
  if (!transaction) {
    return undefined
  }
  return transaction.status
}
