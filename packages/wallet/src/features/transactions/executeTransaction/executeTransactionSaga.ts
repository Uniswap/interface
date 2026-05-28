import { SagaIterator } from 'redux-saga'
import { call } from 'typed-redux-saga'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { getFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import {
  TransactionOptions,
  TransactionOriginType,
  TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { executeTransactionLegacy } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSagaLegacy'
import { executeTransactionV2 } from 'wallet/src/features/transactions/executeTransaction/executeTransactionSagaV2'
import { TransactionResponse } from 'wallet/src/features/transactions/executeTransaction/services/TransactionSignerService/transactionSignerService'

export interface ExecuteTransactionParams {
  // internal id used for tracking transactions before they're submitted
  // this is optional as an override in txDetail.id calculation
  txId?: string
  chainId: UniverseChainId
  account: AccountMeta
  options: TransactionOptions
  typeInfo: TransactionTypeInfo
  transactionOriginType: TransactionOriginType
  analytics?: SwapTradeBaseProperties
}

// A utility for sagas to send transactions
// All outgoing transactions should go through here

export function* executeTransaction(params: ExecuteTransactionParams): SagaIterator<{
  transactionResponse: TransactionResponse
}> {
  if (shouldUseNewTransactionService()) {
    const result = yield* call(executeTransactionV2, params)
    return result
  } else {
    const result = yield* call(executeTransactionLegacy, params)
    return result
  }
}

// flag check for new transaction service
function shouldUseNewTransactionService(): boolean {
  return getFeatureFlag(FeatureFlags.ExecuteTransactionV2)
}
