import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { all, call } from 'typed-redux-saga'
import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionOriginType, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
import { shouldSubmitViaPrivateRpc } from 'wallet/src/features/transactions/swap/swapSaga'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export const getRemoveDelegationTransaction = (
  chainId: UniverseChainId,
  walletAddress: Address,
): TransactionRequest => ({
  from: walletAddress,
  to: walletAddress,
  data: '0x',
  value: '0x0',
  chainId,
})

export async function getRemoveDelegationTransactionWithGasLimit(
  chainId: UniverseChainId,
  walletAddress: Address,
): Promise<TransactionRequest> {
  const request = getRemoveDelegationTransaction(chainId, walletAddress)
  const gasAmount = await fetchGasFeeQuery({
    tx: request,
    smartContractDelegationAddress: DEFAULT_NATIVE_ADDRESS,
    // TODO(WALL-7074): replace with the actual statsig ready state
    isStatsigReady: true,
  })
  return {
    ...request,
    gasLimit: gasAmount.params?.gasLimit,
    gasPrice:
      gasAmount.params && 'gasPrice' in gasAmount.params ? gasAmount.params.gasPrice : gasAmount.params?.maxFeePerGas,
  }
}

export type RemoveDelegationParams = {
  account: AccountMeta
  walletAddress: Address
  chainIds: UniverseChainId[]
  onSuccess: () => void
  onFailure: (error: Error) => void
}

type RemoveDelegationForChainParams = {
  chainId: UniverseChainId
  account: AccountMeta
  walletAddress: Address
  onSuccess?: (transactionResponse: TransactionResponse) => void
  onFailure?: (error: Error) => void
}

function* removeDelegationForChain(params: RemoveDelegationForChainParams) {
  const { chainId, account, walletAddress } = params

  const submitViaPrivateRpc = yield* call(shouldSubmitViaPrivateRpc, chainId)

  const executeTransactionParams: ExecuteTransactionParams = {
    chainId,
    account,
    options: {
      request: yield* call(getRemoveDelegationTransactionWithGasLimit, chainId, walletAddress),
      submitViaPrivateRpc,
    },
    typeInfo: {
      type: TransactionType.RemoveDelegation,
    },
    transactionOriginType: TransactionOriginType.Internal,
  }
  const { transactionResponse } = yield* call(executeTransaction, executeTransactionParams)
  return transactionResponse
}

export function* removeDelegation(params: RemoveDelegationParams) {
  const { account, walletAddress, chainIds, onSuccess } = params

  // Process each chain independently, handling errors gracefully
  yield* all(
    chainIds.map((chainId) =>
      call(function* () {
        try {
          const transactionResponse = yield* call(removeDelegationForChain, {
            chainId,
            account,
            walletAddress,
          })
          logger.debug(
            'removeDelegationForChain',
            'removeDelegationForChain',
            'transactionResponse',
            transactionResponse,
          )
        } catch (error) {
          logger.error(error, {
            tags: { file: 'removeDelegationSaga', function: 'removeDelegation' },
            extra: { chainId, error },
          })
        }
      }),
    ),
  )

  // TODO(WALL-7070): handle transaction failures here
  // for now we just call onSuccess for failure case too
  onSuccess()
}

export const {
  name: removeDelegationSagaName,
  wrappedSaga: removeDelegationSaga,
  reducer: removeDelegationReducer,
  actions: removeDelegationActions,
} = createMonitoredSaga({
  saga: removeDelegation,
  name: 'removeDelegation',
})
