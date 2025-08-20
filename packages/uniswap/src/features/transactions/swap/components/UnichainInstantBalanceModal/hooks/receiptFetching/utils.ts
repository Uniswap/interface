import { BigNumber } from '@ethersproject/bignumber'
import { TransactionScreen } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'

export const NO_OUTPUT_ERROR = 'No output amount found in receipt logs'

interface ReportOutputAmountParams {
  outputAmount: BigNumber
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  setScreen: (screen: TransactionScreen) => void
}

/**
 * Reports the output amount to the swap form and navigates to the instant balance modal
 */
export function reportOutputAmount({ outputAmount, updateSwapForm, setScreen }: ReportOutputAmountParams): void {
  updateSwapForm({
    instantOutputAmountRaw: outputAmount.toString(),
  })

  setScreen(TransactionScreen.UnichainInstantBalance)
}

interface ResetSwapFormParams {
  updateSwapForm: (newState: Partial<SwapFormState>) => void
  setScreen: (screen: TransactionScreen) => void
}

/**
 * Resets the swap form to initial state and returns to the form screen
 */
export function resetSwapFormAndReturnToForm({ updateSwapForm, setScreen }: ResetSwapFormParams): void {
  updateSwapForm({
    exactAmountFiat: undefined,
    exactAmountToken: '',
    isSubmitting: false,
    showPendingUI: false,
    isConfirmed: false,
    instantOutputAmountRaw: undefined,
    instantReceiptFetchTime: undefined,
    txHash: undefined,
    txHashReceivedTime: undefined,
  })
  setScreen(TransactionScreen.Form)
}
