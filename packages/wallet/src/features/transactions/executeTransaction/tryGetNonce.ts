import { DEFAULT_FLASHBOTS_ENABLED } from '@universe/chains'
import { SagaIterator } from 'redux-saga'
import { call, select } from 'typed-redux-saga'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { makeSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { isPrivateRpcSupportedOnChain } from 'wallet/src/features/providers/utils'
import { getPrivateProvider, getProvider } from 'wallet/src/features/wallet/context'

export interface CalculatedNonce {
  nonce: number
  pendingPrivateTxCount?: number
}

/**
 * Attempts to fetch the next nonce to be used for a transaction.
 * If the chain supports private RPC, it will use the private RPC provider, in order to account for pending private transactions.
 *
 * @param account - The account to fetch the nonce for.
 * @param chainId - The chain ID to fetch the nonce for.
 * @returns The nonce if it was successfully fetched, otherwise undefined.
 */

export function* tryGetNonce(
  account: SignerMnemonicAccountMeta,
  chainId: UniverseChainId,
): SagaIterator<CalculatedNonce | undefined> {
  try {
    const shouldUseFlashbots = chainId === UniverseChainId.Mainnet && DEFAULT_FLASHBOTS_ENABLED

    const provider = shouldUseFlashbots
      ? yield* call(getPrivateProvider, chainId, account)
      : yield* call(getProvider, chainId)

    // oxlint-disable-next-line typescript/unbound-method -- saga effects can confuse this rule
    const nonce = yield* call([provider, provider.getTransactionCount], account.address, 'pending')

    // If we're using Flashbots with authentication header as private RPC, it will already account for pending private transactions. Otherwise, add the local pending private transactions.
    if (!shouldUseFlashbots && isPrivateRpcSupportedOnChain(chainId)) {
      const pendingPrivateTransactionCount = yield* call(getPendingPrivateTxCount, account.address, chainId)
      return {
        nonce: nonce + pendingPrivateTransactionCount,
        pendingPrivateTxCount: pendingPrivateTransactionCount,
      }
    }
    return {
      nonce,
    }
  } catch (error) {
    logger.error(error, {
      tags: { file: 'executeTransactionSaga', function: 'tryGetNonce' },
    })
    return undefined
  }
}

export function* getPendingPrivateTxCount(address: Address, chainId: number): SagaIterator<number> {
  const selectAddressTransactions = yield* call(makeSelectAddressTransactions)
  const pendingTransactions = yield* select(selectAddressTransactions, { evmAddress: address, svmAddress: null })
  if (!pendingTransactions) {
    return 0
  }

  return pendingTransactions.filter(
    (tx) =>
      tx.chainId === chainId &&
      tx.status === TransactionStatus.Pending &&
      isClassic(tx) &&
      Boolean(tx.options.submitViaPrivateRpc) &&
      tx.hash,
  ).length
}
