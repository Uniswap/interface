import { TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import { call } from 'typed-redux-saga'
import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionOriginType, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import {
  ExecuteTransactionParams,
  executeTransaction,
} from 'wallet/src/features/transactions/executeTransaction/executeTransactionSaga'
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
  account: SignerMnemonicAccountMeta
  walletAddress: Address
  chainIds: UniverseChainId[]
  onSuccess: () => void
  onFailure: (error: Error) => void
}

type RemoveDelegationForChainParams = {
  chainId: UniverseChainId
  account: SignerMnemonicAccountMeta
  walletAddress: Address
  onSuccess?: (transactionResponse: TransactionResponse) => void
  onFailure?: (error: Error) => void
}

function* removeDelegationForChain(params: RemoveDelegationForChainParams) {
  const { chainId, account, walletAddress } = params

  const executeTransactionParams: ExecuteTransactionParams = {
    chainId,
    account,
    options: {
      request: yield* call(getRemoveDelegationTransactionWithGasLimit, chainId, walletAddress),
    },
    typeInfo: {
      type: TransactionType.RemoveDelegation,
    },
    transactionOriginType: TransactionOriginType.Internal,
  }
  const { transactionHash } = yield* call(executeTransaction, executeTransactionParams)
  return transactionHash
}

export function* removeDelegation(params: RemoveDelegationParams) {
  const { account, walletAddress, chainIds, onSuccess, onFailure } = params

  let hasError = false

  for (const chainId of chainIds) {
    try {
      yield* call(removeDelegationForChain, {
        chainId,
        account,
        walletAddress,
      })
    } catch (error) {
      hasError = true
      logger.error(error, {
        tags: { file: 'removeDelegationSaga', function: 'removeDelegation' },
        extra: { chainId, error },
      })
    }
  }

  if (hasError) {
    onFailure(new Error('One or more delegation removal transactions failed'))
  } else {
    onSuccess()
  }
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
