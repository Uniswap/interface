import { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/PresetAmountButton'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { SwapCallback, SwapCallbackParams } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { SwapTxAndGasInfo, isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { WrapCallback, WrapCallbackParams } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'

type ExecuteSwapInput = {
  currencyInAmountUSD: SwapCallbackParams['currencyInAmountUSD']
  currencyOutAmountUSD: SwapCallbackParams['currencyOutAmountUSD']
  isAutoSlippage: SwapCallbackParams['isAutoSlippage']
  txId: SwapCallbackParams['txId']
}

type ExecuteWrapInput = {
  inputCurrencyAmount?: WrapCallbackParams['inputCurrencyAmount']
  txId: WrapCallbackParams['txId']
  wrapType?: WrapCallbackParams['wrapType']
}

type ExecuteSwap = () => void

export interface ExecuteSwapService {
  executeSwap: ExecuteSwap
}

export type GetExecuteSwapService = (ctx: {
  onSuccess: () => void
  onFailure: () => void
  setCurrentStep: SwapCallbackParams['setCurrentStep']
  setSteps: SwapCallbackParams['setSteps']
  getSwapTxContext: () => SwapTxAndGasInfo
}) => ExecuteSwapService

export function createExecuteSwapService(ctx: {
  getAccount?: () => ReturnType<typeof useAccountMeta>
  getSwapTxContext?: () => ReturnType<typeof useSwapTxContext>
  getDerivedSwapInfo: () => DerivedSwapInfo
  getTxSettings: () => { customSlippageTolerance?: number }
  getIsFiatMode?: () => boolean
  getPresetInfo: () => { presetPercentage: PresetPercentage | undefined; preselectAsset: boolean | undefined }
  onSuccess: () => void
  onFailure: (error?: Error) => void
  setCurrentStep: SwapCallbackParams['setCurrentStep']
  setSteps: SwapCallbackParams['setSteps']
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}): { executeSwap: ExecuteSwap } {
  function executeSwap(input: ExecuteSwapInput): void {
    const swapTxContext = ctx.getSwapTxContext?.()
    const account = ctx.getAccount?.()
    if (
      !account ||
      !swapTxContext ||
      account.type !== AccountType.SignerMnemonic ||
      !isValidSwapTxContext(swapTxContext)
    ) {
      return
    }
    const { presetPercentage, preselectAsset } = ctx.getPresetInfo()

    ctx.swapCallback({
      // input
      txId: input.txId,
      currencyInAmountUSD: input.currencyInAmountUSD,
      currencyOutAmountUSD: input.currencyOutAmountUSD,
      isAutoSlippage: input.isAutoSlippage,
      // ctx
      isFiatInputMode: ctx.getIsFiatMode?.(),
      account,
      swapTxContext,
      presetPercentage,
      preselectAsset,
      onSuccess: ctx.onSuccess,
      onFailure: ctx.onFailure,
      setCurrentStep: ctx.setCurrentStep,
      setSteps: ctx.setSteps,
    })
  }

  function executeWrap(input: ExecuteWrapInput): void {
    const account = ctx.getAccount?.()
    const swapTxContext = ctx.getSwapTxContext?.()

    // validate that the account and swapTxContext are defined
    if (!account || !swapTxContext) {
      return
    }

    const txRequest = isUniswapX(swapTxContext) ? undefined : swapTxContext.txRequest

    if (!txRequest || !input.inputCurrencyAmount || !input.wrapType) {
      return
    }

    ctx.wrapCallback({
      // input
      inputCurrencyAmount: input.inputCurrencyAmount,
      txRequest,
      txId: input.txId,
      wrapType: input.wrapType,
      // ctx
      account,
      gasEstimates: swapTxContext.gasFeeEstimation.wrapEstimates,
      onSuccess: ctx.onSuccess,
      onFailure: ctx.onFailure,
    })
  }

  // Our unified interface - determines which operation to execute
  return {
    executeSwap: (): void => {
      const { currencyAmounts, currencyAmountsUSDValue, txId, wrapType } = ctx.getDerivedSwapInfo()
      const { customSlippageTolerance } = ctx.getTxSettings()
      if (wrapType) {
        executeWrap({
          txId,
          wrapType,
          inputCurrencyAmount: currencyAmounts.input ?? undefined,
        })
      } else {
        executeSwap({
          txId,
          currencyInAmountUSD: currencyAmountsUSDValue[CurrencyField.INPUT] ?? undefined,
          currencyOutAmountUSD: currencyAmountsUSDValue[CurrencyField.OUTPUT] ?? undefined,
          isAutoSlippage: !customSlippageTolerance,
        })
      }
    },
  }
}
