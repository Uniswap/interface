import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import type { SwapTxStoreState } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/createSwapTxStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { SwapCallbackParams } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import type {
  ExecuteSwapCallback,
  PrepareSwapCallback,
} from 'uniswap/src/features/transactions/swap/types/swapHandlers'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { AccountDetails, isSignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { CurrencyField } from 'uniswap/src/types/currency'

type ExecuteSwap = () => void

export interface ExecuteSwapService {
  executeSwap: ExecuteSwap
}

export type GetExecuteSwapService = (ctx: {
  onSuccess: () => void
  onFailure: () => void
  onPending: () => void
  setCurrentStep: SwapCallbackParams['setCurrentStep']
  setSteps: SwapCallbackParams['setSteps']
  getSwapTxContext: () => SwapTxAndGasInfo
}) => ExecuteSwapService

export function createExecuteSwapService(ctx: {
  getAccount?: () => AccountDetails | undefined
  getSwapTxContext?: () => SwapTxStoreState
  getDerivedSwapInfo: () => DerivedSwapInfo
  getTxSettings: () => { customSlippageTolerance?: number }
  getIsFiatMode?: () => boolean
  getPresetInfo: () => { presetPercentage: PresetPercentage | undefined; preselectAsset: boolean | undefined }
  onSuccess: () => void
  onFailure: (error?: Error) => void
  onPending: () => void
  setCurrentStep: SwapCallbackParams['setCurrentStep']
  setSteps: SwapCallbackParams['setSteps']
  onPrepareSwap: PrepareSwapCallback
  onExecuteSwap: ExecuteSwapCallback
}): { executeSwap: ExecuteSwap } {
  // Unified execution pattern - handles both swaps and wraps through SwapHandlers
  return {
    executeSwap: (): void => {
      const { currencyAmounts, currencyAmountsUSDValue, txId, wrapType } = ctx.getDerivedSwapInfo()
      const { customSlippageTolerance } = ctx.getTxSettings()
      const swapTxContext = ctx.getSwapTxContext?.()
      const account = ctx.getAccount?.()

      if (process.env.NODE_ENV === 'development') {
        console.log('[execute] executeSwapService executeSwap called:', {
          account: account ? {
            address: account.address,
            chainId: account.chainId,
            accountType: account.accountType,
          } : undefined,
          swapTxContext: swapTxContext ? {
            routing: swapTxContext.routing,
            hasTxRequests: !!swapTxContext.txRequests,
            txRequestCount: swapTxContext.txRequests?.length || 0,
            hasTrade: !!swapTxContext.trade,
            includesDelegation: swapTxContext.includesDelegation,
            hasSwapRequestArgs: 'swapRequestArgs' in swapTxContext,
            swapRequestArgs: swapTxContext.swapRequestArgs ? {
              deadline: swapTxContext.swapRequestArgs.deadline,
              deadlineDate: swapTxContext.swapRequestArgs.deadline ? new Date(swapTxContext.swapRequestArgs.deadline * 1000).toLocaleString('zh-CN') : undefined,
              hasQuote: !!swapTxContext.swapRequestArgs.quote,
              simulateTransaction: swapTxContext.swapRequestArgs.simulateTransaction,
              allKeys: Object.keys(swapTxContext.swapRequestArgs),
            } : 'swapRequestArgs is undefined',
            swapTxContextKeys: Object.keys(swapTxContext),
          } : undefined,
          currencyAmounts: currencyAmounts ? {
            input: currencyAmounts.input?.toExact(),
            output: currencyAmounts.output?.toExact(),
          } : undefined,
          currencyAmountsUSDValue: currencyAmountsUSDValue,
          txId,
          wrapType,
          customSlippageTolerance,
        })
      }

      if (
        !account ||
        !swapTxContext ||
        !isSignerMnemonicAccountDetails(account) ||
        !isValidSwapTxContext(swapTxContext)
      ) {
        const errorMessage = !account
              ? 'No account available'
              : !swapTxContext
                ? 'Missing swap transaction context'
                : !isSignerMnemonicAccountDetails(account)
                  ? 'Invalid account type - must be signer mnemonic account'
              : 'Invalid swap transaction context'

        if (process.env.NODE_ENV === 'development') {
          console.error('[Swap] Error: Validation failed in executeSwapService', {
            error: errorMessage,
          })
        }

        ctx.onFailure(new Error(errorMessage))
        return
      }

      const { presetPercentage, preselectAsset } = ctx.getPresetInfo()

      const executeParams = {
          account,
          swapTxContext,
          currencyInAmountUSD: currencyAmountsUSDValue[CurrencyField.INPUT] ?? undefined,
          currencyOutAmountUSD: currencyAmountsUSDValue[CurrencyField.OUTPUT] ?? undefined,
          isAutoSlippage: !customSlippageTolerance,
          presetPercentage,
          preselectAsset,
          onSuccess: ctx.onSuccess,
          onFailure: ctx.onFailure,
          onPending: ctx.onPending,
          txId,
          setCurrentStep: ctx.setCurrentStep,
          setSteps: ctx.setSteps,
          isFiatInputMode: ctx.getIsFiatMode?.(),
          wrapType,
          inputCurrencyAmount: currencyAmounts.input ?? undefined,
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[execute] executeSwapService calling onExecuteSwap with params:', executeParams)
        console.log('[execute] executeSwapService - Detailed swapTxContext:', {
          routing: executeParams.swapTxContext?.routing,
          hasTxRequests: !!executeParams.swapTxContext?.txRequests,
          txRequestCount: executeParams.swapTxContext?.txRequests?.length || 0,
          txRequests: executeParams.swapTxContext?.txRequests?.map((tx, idx) => ({
            index: idx,
            to: tx.to,
            data: tx.data?.substring(0, 20) + '...',
            value: tx.value?.toString(),
            gasLimit: tx.gasLimit?.toString(),
            gasPrice: tx.gasPrice?.toString(),
            chainId: tx.chainId,
          })),
          hasTrade: !!executeParams.swapTxContext?.trade,
          trade: executeParams.swapTxContext?.trade ? {
            routing: executeParams.swapTxContext.trade.routing,
            inputAmount: executeParams.swapTxContext.trade.inputAmount?.toExact(),
            outputAmount: executeParams.swapTxContext.trade.outputAmount?.toExact(),
            deadline: executeParams.swapTxContext.trade.deadline,
            deadlineDate: executeParams.swapTxContext.trade.deadline ? new Date(executeParams.swapTxContext.trade.deadline * 1000).toLocaleString('zh-CN') : undefined,
          } : undefined,
          includesDelegation: executeParams.swapTxContext?.includesDelegation,
          hasSwapRequestArgs: 'swapRequestArgs' in (executeParams.swapTxContext || {}),
          swapRequestArgs: executeParams.swapTxContext?.swapRequestArgs ? {
            deadline: executeParams.swapTxContext.swapRequestArgs.deadline,
            deadlineDate: executeParams.swapTxContext.swapRequestArgs.deadline ? new Date(executeParams.swapTxContext.swapRequestArgs.deadline * 1000).toLocaleString('zh-CN') : undefined,
            hasQuote: !!executeParams.swapTxContext.swapRequestArgs.quote,
            simulateTransaction: executeParams.swapTxContext.swapRequestArgs.simulateTransaction,
            allKeys: Object.keys(executeParams.swapTxContext.swapRequestArgs),
            fullSwapRequestArgs: executeParams.swapTxContext.swapRequestArgs,
          } : 'swapRequestArgs is undefined',
          swapTxContextKeys: executeParams.swapTxContext ? Object.keys(executeParams.swapTxContext) : [],
        })
      }

      ctx.onExecuteSwap(executeParams)
        .catch((error) => {
          const swapError = error instanceof Error ? error : new Error(String(error))
          ctx.onFailure(swapError)
        })
    },
  }
}
