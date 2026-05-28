import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { createWrapTransactionStep } from 'uniswap/src/features/transactions/steps/wrap'
import { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'

export type WrapSteps =
  | ReturnType<typeof createRevocationTransactionStep>
  | ReturnType<typeof createApprovalTransactionStep>
  | ReturnType<typeof createWrapTransactionStep>

export type WrapFlow = {
  revocation?: ReturnType<typeof createRevocationTransactionStep>
  approval?: ReturnType<typeof createApprovalTransactionStep>
  wrap: ReturnType<typeof createWrapTransactionStep>
}

export function orderWrapSteps(flow: WrapFlow): TransactionStep[] {
  const steps: TransactionStep[] = []

  if (flow.revocation) {
    steps.push(flow.revocation)
  }

  if (flow.approval) {
    steps.push(flow.approval)
  }

  if (flow.wrap) {
    steps.push(flow.wrap)
  }

  return steps
}

export function generateWrapTransactionSteps(
  txContext: SwapTxAndGasInfo,
  inputAmount?: CurrencyAmount<Currency>,
  inputCurrencyId?: string,
  outputCurrencyId?: string,
): TransactionStep[] {
  // Wrap transactions use ClassicSwapTxAndGasInfo structure
  if (!isClassic(txContext)) {
    return []
  }

  const { approveTxRequest, /*revocationTxRequest,*/ txRequests } = txContext

  if (!txRequests?.[0]) {
    return []
  }

  // Create steps
  // const revocation = createRevocationTransactionStep(revocationTxRequest, inputAmount?.currency.wrapped)
  const approval = createApprovalTransactionStep(approveTxRequest, inputAmount)
  const wrap = createWrapTransactionStep(txRequests[0], inputAmount, inputCurrencyId, outputCurrencyId)

  if (!wrap) {
    return []
  }

  // Order steps: revocation -> approval -> wrap
  const orderedSteps = orderWrapSteps({
    revocation: undefined,
    approval,
    wrap,
  })

  return orderedSteps
}
