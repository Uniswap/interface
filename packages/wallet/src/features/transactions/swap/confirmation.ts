import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlagName, getStatsigClient } from '@universe/gating'
import { SagaGenerator, take } from 'typed-redux-saga'
import { getDelegationService } from 'uniswap/src/domains/services'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { finalizeTransaction } from 'uniswap/src/features/transactions/slice'
import { PermitMethod, SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'

/** Returns success condition after the transactions corresponding to the given hash finalizes. */
export function* waitForTransactionConfirmation(params: { hash: string }): SagaGenerator<{ success: boolean }> {
  const { hash } = params

  while (true) {
    const { payload } = yield* take<ReturnType<typeof finalizeTransaction>>(finalizeTransaction.type)

    if (payload.hash === hash) {
      if (payload.status !== TransactionStatus.Success) {
        return { success: false }
      }
      return { success: true }
    }
  }
}

/**
 * Returns true if the swapper is a delegated EOA and transactions cannot be submitted simultaneously due to
 * the risk of node clients rejecting simultaneous pending transactions from the same account.
 *
 * @param params.swapper - The address of the swapper.
 * @param params.chainId - The chain ID of the transaction.
 * @param params.privateRpcAvailable - Whether private RPC is available, which affects expected behavior when submitting multiple transactions.
 *
 * @returns A boolean indicating whether to wait between transactions.
 */
export async function getShouldWaitBetweenTransactions(params: {
  swapper: string
  chainId: UniverseChainId
  privateRpcAvailable: boolean
}): Promise<boolean> {
  const { swapper, chainId, privateRpcAvailable } = params
  const transactionSpacingEnabled = getStatsigClient().checkGate(
    getFeatureFlagName(FeatureFlags.EnableTransactionSpacingForDelegatedAccounts),
  )

  // Private RPC clients are expected to accept simultaneous pending transactions
  if (!transactionSpacingEnabled || privateRpcAvailable) {
    return false
  }

  const delegationService = getDelegationService()
  const { isDelegated } = await delegationService.getIsAddressDelegated({ address: swapper, chainId })

  return isDelegated
}

export function getSwapTransactionCount(swapTxContext: SwapTxAndGasInfo): number {
  let count = 0

  if (swapTxContext.approveTxRequest) {
    count++
  }

  if (swapTxContext.routing === TradingApi.Routing.CLASSIC) {
    // Increment count for swap transaction
    count++

    if (swapTxContext.permit?.method === PermitMethod.Transaction) {
      // Increment count for swap transaction
      count++
    }
  } else if (swapTxContext.routing === TradingApi.Routing.BRIDGE) {
    // Increment count for bridge transaction
    count++
  }

  return count
}
