import { createContext, PropsWithChildren, useContext } from 'react'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import {
  SwapTxAndGasInfo,
  useSwapTxAndGasInfo,
} from 'wallet/src/features/transactions/swap/trade/api/hooks/useSwapTxAndGasInfo'
import { isClassic, isUniswapX } from 'wallet/src/features/transactions/swap/trade/utils'

export type ValidatedSwapTxContext = Required<SwapTxAndGasInfo> & {
  approvalError: false
  gasFee: ValidatedGasFeeResult
}
function validateSwapTxContext(swapTxContext: SwapTxAndGasInfo): ValidatedSwapTxContext | undefined {
  const gasFee = validateGasFeeResult(swapTxContext.gasFee)
  if (!gasFee) {
    return undefined
  }

  if (!swapTxContext.approvalError && swapTxContext.trade) {
    const { approvalError } = swapTxContext
    if (isClassic(swapTxContext) && swapTxContext.trade && swapTxContext.txRequest) {
      const { trade, txRequest } = swapTxContext
      return { ...swapTxContext, trade, txRequest, approvalError, gasFee }
    } else if (isUniswapX(swapTxContext) && swapTxContext.orderParams) {
      const { trade, orderParams } = swapTxContext
      return { ...swapTxContext, trade, gasFee, approvalError, orderParams }
    }
  }
  return undefined
}

type ValidatedGasFeeResult = GasFeeResult & { value: string; error: undefined }
function validateGasFeeResult(gasFee: GasFeeResult): ValidatedGasFeeResult | undefined {
  if (gasFee.value === undefined || gasFee.error) {
    return undefined
  }
  return { ...gasFee, value: gasFee.value, error: undefined }
}

export function isValidSwapTxContext(swapTxContext: SwapTxAndGasInfo): swapTxContext is ValidatedSwapTxContext {
  // Validation fn prevents/futureproofs typeguard against illicit casts
  return validateSwapTxContext(swapTxContext) !== undefined
}

export const SwapTxContext = createContext<SwapTxAndGasInfo | undefined>(undefined)

export function SwapTxContextProviderTradingApi({ children }: PropsWithChildren): JSX.Element {
  const { derivedSwapInfo } = useSwapFormContext()
  const swapTxContext = useSwapTxAndGasInfo({ derivedSwapInfo })

  return <SwapTxContext.Provider value={swapTxContext}>{children}</SwapTxContext.Provider>
}

export const useSwapTxContext = (): SwapTxAndGasInfo => {
  const swapContext = useContext(SwapTxContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapTxContext` must be used inside of `SwapTxContextProvider`')
  }

  return swapContext
}
