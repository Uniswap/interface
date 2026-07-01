import { Currency } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  OnChainTransactionFieldsWalletCall,
  RevokeApproveFields,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'
import type { RpcUserOperation } from 'viem/account-abstraction'

export interface TokenApprovalTransactionStep extends RevokeApproveFields {
  type: TransactionStepType.TokenApprovalTransaction
}

export function createApprovalTransactionStep({
  amount,
  txRequest,
  tokenAddress,
  pair,
  chainId,
  tokenSymbol,
}: {
  amount?: TokenApprovalTransactionStep['amount']
  txRequest?: ValidatedTransactionRequest
  pair?: [Currency, Currency]
  tokenAddress?: TokenApprovalTransactionStep['tokenAddress']
  chainId?: TokenApprovalTransactionStep['chainId']
  tokenSymbol?: TokenApprovalTransactionStep['tokenSymbol']
}): TokenApprovalTransactionStep | undefined {
  if (!txRequest?.data || !amount || !chainId || !tokenAddress) {
    return undefined
  }

  const type = TransactionStepType.TokenApprovalTransaction
  const { spender } = parseERC20ApproveCalldata(txRequest.data.toString())

  return { type, txRequest, tokenAddress, amount, pair, spender, chainId, tokenSymbol }
}

export interface ApprovalMetadataFields {
  tokenAddress: Address
  chainId: UniverseChainId
  amount: string
  spender: string
  pair?: [Currency, Currency]
  tokenSymbol?: string
}

// Sponsored approval over 5792 (web)
export interface TokenApprovalWalletCallStep extends OnChainTransactionFieldsWalletCall, ApprovalMetadataFields {
  type: TransactionStepType.TokenApprovalWalletCall
}

// Sponsored approval over 4337 (wallet)
export interface TokenApprovalUserOpStep extends ApprovalMetadataFields {
  type: TransactionStepType.TokenApprovalUserOp
  unsignedUserOp: RpcUserOperation<'0.8'>
  gasSponsored: boolean
  paymasterServiceContext?: TradingApi.PaymasterServiceContext
}

export function createApprovalWalletCallStep(
  params: ApprovalMetadataFields & {
    txRequests: ValidatedTransactionRequest[]
    paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
  },
): TokenApprovalWalletCallStep | undefined {
  const { txRequests, paymasterService, ...metadata } = params
  if (txRequests.length === 0) {
    return undefined
  }

  return {
    type: TransactionStepType.TokenApprovalWalletCall,
    walletCallTxRequests: txRequests,
    paymasterService: paymasterService?.url ? (paymasterService as TradingApi.PaymasterServiceCapability) : undefined,
    ...metadata,
  }
}

export function createApprovalUserOpStep(
  params: ApprovalMetadataFields & {
    unsignedUserOp: RpcUserOperation<'0.8'>
    gasSponsored: boolean
    paymasterServiceContext?: TradingApi.PaymasterServiceContext
  },
): TokenApprovalUserOpStep {
  const { unsignedUserOp, gasSponsored, paymasterServiceContext, ...metadata } = params
  return {
    type: TransactionStepType.TokenApprovalUserOp,
    unsignedUserOp,
    gasSponsored,
    paymasterServiceContext,
    ...metadata,
  }
}
