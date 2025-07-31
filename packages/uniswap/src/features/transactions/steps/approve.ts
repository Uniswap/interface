import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'

export interface TokenApprovalTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.TokenApprovalTransaction
  token: Token
  spender: string
  pair?: [Currency, Currency]
  // TODO(WEB-5083): this is used to distinguish a revoke from an approve. It can likely be replaced by a boolean because for LP stuff the amount isn't straight forward.
  amount: string
}

export function createApprovalTransactionStep({
  txRequest,
  amountIn,
  pair,
}: {
  txRequest?: ValidatedTransactionRequest
  amountIn?: CurrencyAmount<Currency>
  pair?: [Currency, Currency]
}): TokenApprovalTransactionStep | undefined {
  if (!txRequest?.data || !amountIn) {
    return undefined
  }

  const type = TransactionStepType.TokenApprovalTransaction
  const token = amountIn.currency.wrapped
  const { spender } = parseERC20ApproveCalldata(txRequest.data.toString())
  const amount = amountIn.quotient.toString()

  return { type, txRequest, token, spender, amount, pair }
}
