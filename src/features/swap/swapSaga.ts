import { MethodParameters } from '@uniswap/v3-sdk'
import { providers } from 'ethers'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { ApproveParams, maybeApprove } from 'src/features/approve/approveSaga'
import { addTransaction, finalizeTransaction } from 'src/features/transactions/sagaHelpers'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'src/features/transactions/types'
import { AccountType } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export interface SwapParams extends ApproveParams {
  methodParameters: MethodParameters
  transactionInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
}

export function* approveAndSwap(params: SwapParams) {
  const {
    account,
    chainId,
    methodParameters: { calldata, value },
    spender: swapRouter,
    transactionInfo,
  } = params

  try {
    if (account.type === AccountType.readonly) throw new Error('Account must support signing')

    const signerManager = yield* call(getSignerManager)
    const providerManager = yield* call(getWalletProviders)
    const signer = yield* call([signerManager, signerManager.getSignerForAccount], account)
    const provider = providerManager.getProvider(chainId)
    const connectedSigner = yield* call([signer, signer.connect], provider)

    const approved = yield* call(maybeApprove, params)
    if (!approved) {
      throw new Error('Provided SwapRouter contract is not approved to spend tokens')
    }

    const transaction: providers.TransactionRequest = {
      from: account.address,
      to: swapRouter,
      data: calldata,
      ...(!value || isZero(value) ? {} : { value }),
    }

    const tx = yield* call([connectedSigner, connectedSigner.populateTransaction], transaction)
    const signedTx = yield* call([connectedSigner, connectedSigner.signTransaction], tx)
    const transactionResponse = yield* call([provider, provider.sendTransaction], signedTx)

    yield* call(addTransaction, transactionResponse, transactionInfo)

    const transactionReceipt = yield* call(transactionResponse.wait)

    yield* call(finalizeTransaction, transactionResponse, transactionReceipt)
  } catch (e) {
    logger.error('swapSaga', 'approveAndSwap', 'Failed:', e)
    return false
  }
}

export const {
  name: swapSagaName,
  wrappedSaga: swapSaga,
  reducer: swapReducer,
  actions: swapActions,
} = createMonitoredSaga<SwapParams>(approveAndSwap, 'swap')
