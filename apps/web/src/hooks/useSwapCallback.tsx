import { Percent, TradeType } from '@taraswap/sdk-core'
import { FlatFeeOptions } from '@taraswap/universal-router-sdk'
import { FeeOptions } from '@taraswap/v3-sdk'
import { BigNumber } from 'ethers/lib/ethers'
import { PermitSignature } from 'hooks/usePermitAllowance'
import { useCallback } from 'react'
import { InterfaceTrade, OffchainOrderType, TradeFillType } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'
import { useAddOrder } from 'state/signatures/hooks'
import { UniswapXOrderDetails } from 'state/signatures/types'

import { useSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { useSwapAndLimitContext } from 'state/swap/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionType,
} from '../state/transactions/types'
import { currencyId } from '../utils/currencyId'
import { useUniswapXSwapCallback } from './useUniswapXSwapCallback'
import { useUniversalRouterSwapCallback } from './useUniversalRouter'

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
export function useSwapCallback(
  trade: InterfaceTrade | undefined, // trade to execute, required
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number }, // usd values for amount in and out, and the fee value, logged for analytics
  allowedSlippage: Percent, // in bips
  permitSignature: PermitSignature | undefined
) {
  const addTransaction = useTransactionAdder()
  const addOrder = useAddOrder()
  const account = useAccount()
  const { chainId } = useSwapAndLimitContext()
  const supportedChainId = useSupportedChainId(chainId)

  const uniswapXSwapCallback = useUniswapXSwapCallback({
    trade: isUniswapXTrade(trade) ? trade : undefined,
    allowedSlippage,
    fiatValues,
  })

  const universalRouterSwapCallback = useUniversalRouterSwapCallback(
    isClassicTrade(trade) ? trade : undefined,
    fiatValues,
    {
      slippageTolerance: allowedSlippage,
      permit: permitSignature,
      ...getUniversalRouterFeeFields(trade),
    }
  )

  const swapCallback = isUniswapXTrade(trade) ? uniswapXSwapCallback : universalRouterSwapCallback

  return useCallback(async () => {
    if (!trade) {
      throw new Error('missing trade')
    }
    if (!account.address || !account.chainId) {
      throw new Error('wallet must be connected to swap')
    }
    if (!supportedChainId) {
      throw new Error('unsupported chain')
    }

    const result = await swapCallback()

    const swapInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo = {
      type: TransactionType.SWAP,
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

    switch (result.type) {
      case TradeFillType.UniswapX:
      case TradeFillType.UniswapXv2:
        addOrder(
          account.address,
          result.response.orderHash,
          supportedChainId,
          result.response.deadline,
          swapInfo as UniswapXOrderDetails['swapInfo'],
          result.response.encodedOrder,
          isUniswapXTrade(trade) ? trade.offchainOrderType : OffchainOrderType.DUTCH_AUCTION // satisfying type-checker; isUniswapXTrade should always be true
        )
        break
      default:
        addTransaction(result.response, swapInfo, result.deadline?.toNumber())
    }

    return result
  }, [
    account.address,
    account.chainId,
    addOrder,
    addTransaction,
    allowedSlippage,
    supportedChainId,
    swapCallback,
    trade,
  ])
}
