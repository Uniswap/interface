import { SwapFormState } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { CurrencyField } from 'uniswap/src/types/currency'

export const getShouldResetExactAmountToken = (
  swapCtx: Pick<SwapFormState, 'exactCurrencyField' | 'input' | 'output'>,
  newState: Partial<SwapFormState>,
): boolean => {
  const isEditingInput = swapCtx.exactCurrencyField === CurrencyField.INPUT
  const isEditingOutput = swapCtx.exactCurrencyField === CurrencyField.OUTPUT
  const newInputAddress = newState.input?.address ?? swapCtx.input?.address
  const newOutputAddress = newState.output?.address ?? swapCtx.output?.address

  const shouldResetInputAmount = isEditingInput && swapCtx.input?.address !== newInputAddress
  const shouldResetOutputAmount = isEditingOutput && swapCtx.output?.address !== newOutputAddress

  return shouldResetInputAmount || shouldResetOutputAmount
}
