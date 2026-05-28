import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'

export interface Permit2TransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.Permit2Transaction
  token: Token
  spender: string
  pair?: [Currency, Currency]
  amount: string
  tokenAddress: Address
}

export function createPermit2TransactionStep({
  txRequest,
  amountIn,
  pair,
}: {
  txRequest?: ValidatedTransactionRequest
  amountIn?: CurrencyAmount<Currency>
  pair?: [Currency, Currency]
}): Permit2TransactionStep | undefined {
  if (!txRequest?.data || !amountIn) {
    return undefined
  }

  const type = TransactionStepType.Permit2Transaction
  const token = amountIn.currency.wrapped
  const { spender } = parseERC20ApproveCalldata(txRequest.data.toString())
  const amount = amountIn.quotient.toString()

  return { type, txRequest, token, spender, amount, pair, tokenAddress: token.address }
}
