import type { SagaIterator } from 'redux-saga'
import { call } from 'typed-redux-saga'
import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { createTransactionSagaDependencies } from 'wallet/src/features/transactions/factories/createTransactionSagaDependencies'
import { createTransactionServices } from 'wallet/src/features/transactions/factories/createTransactionServices'
import { DelegationType } from 'wallet/src/features/transactions/types/transactionSagaDependencies'

export interface ExecuteUserOpParams {
  userOp: RpcUserOperation<'0.8'>
  account: SignerMnemonicAccountMeta
  chainId: UniverseChainId
  typeInfo?: TransactionTypeInfo
}

export function* executeUserOpSaga(params: ExecuteUserOpParams): SagaIterator<{ userOpHash: string }> {
  const dependencies = createTransactionSagaDependencies()

  const { userOpService } = yield* call(createTransactionServices, dependencies, {
    account: params.account,
    chainId: params.chainId,
    submitViaPrivateRpc: false,
    delegationType: DelegationType.Auto,
    includeUserOpServices: true,
  })

  if (!userOpService) {
    throw new Error('UserOpService not created')
  }

  const { userOpHash } = yield* call([userOpService, userOpService.executeUserOp], {
    userOp: params.userOp,
    account: params.account,
    chainId: params.chainId,
    typeInfo: params.typeInfo,
  })

  return { userOpHash }
}
