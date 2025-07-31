import { Token } from '@uniswap/sdk-core'
import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'

export interface TokenRevocationTransactionStep extends Omit<TokenApprovalTransactionStep, 'type'> {
  type: TransactionStepType.TokenRevocationTransaction
  amount: '0'
}

export function createRevocationTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  token: Token,
): TokenRevocationTransactionStep | undefined {
  if (!txRequest?.data) {
    return undefined
  }

  const type = TransactionStepType.TokenRevocationTransaction
  const { spender, amount } = parseERC20ApproveCalldata(txRequest.data.toString())

  if (amount !== BigInt(0)) {
    return undefined
  }

  return { type, txRequest, token, spender, amount: '0' }
}
