import { BigNumber } from '@ethersproject/bignumber'
import type { Percent } from '@uniswap/sdk-core'
import { TradeType } from '@uniswap/sdk-core'
import type { FlatFeeOptions } from '@uniswap/universal-router-sdk'
import type { FeeOptions } from '@uniswap/v3-sdk'
import { useAccount } from 'hooks/useAccount'
import type { PermitSignature } from 'hooks/usePermitAllowance'
import useSelectChain from 'hooks/useSelectChain'
import { useUniswapXSwapCallback } from 'hooks/useUniswapXSwapCallback'
import { useUniversalRouterSwapCallback } from 'hooks/useUniversalRouter'
import { useCallback } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import type { InterfaceTrade } from 'state/routing/types'
import { OffchainOrderType, TradeFillType } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'
import { useAddOrder } from 'state/signatures/hooks'
import type { UniswapXOrderDetails } from 'state/signatures/types'
import { useTransaction, useTransactionAdder } from 'state/transactions/hooks'
import type { TransactionInfo } from 'state/transactions/types'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
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
  const addTransaction = useTransactionAdder()
  const addOrder = useAddOrder()
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

    switch (result.type) {
      case TradeFillType.UniswapX:
      case TradeFillType.UniswapXv2:
        addOrder({
          offerer: account.address,
          orderHash: result.response.orderHash,
          chainId: supportedConnectedChainId as UniverseChainId, // satisfies type-checker; already checked & switched chain above if !supportedConnectedChainId
          expiry: result.response.deadline,
          swapInfo: swapInfo as UniswapXOrderDetails['swapInfo'],
          encodedOrder: result.response.encodedOrder,
          offchainOrderType: isUniswapXTrade(trade) ? trade.offchainOrderType : OffchainOrderType.DUTCH_AUCTION, // satisfying type-checker; isUniswapXTrade should always be true
        })
        break
      default:
        addTransaction(result.response, swapInfo, result.deadline?.toNumber())
    }

    return result
  }, [
    account.address,
    account.isConnected,
    addOrder,
    addTransaction,
    allowedSlippage,
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
