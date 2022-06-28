import { MethodParameters } from '@uniswap/v3-sdk'
import { BigNumber, providers } from 'ethers'
import { getProvider } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { maybeApprove } from 'src/features/transactions/approve/approveSaga'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
import { GasSpendEstimate } from 'src/features/transactions/transactionState/transactionState'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  TransactionOptions,
} from 'src/features/transactions/types'
import { Account } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export type SwapParams = {
  account: Account
  chainId: ChainId
  methodParameters: MethodParameters
  swapRouterAddress: Address
  typeInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
  approveAmount: BigNumber
  inputTokenAddress: string
  gasSpendEstimate: GasSpendEstimate
  gasPrice: string
}

export function* approveAndSwap(params: SwapParams) {
  const {
    account,
    chainId,
    inputTokenAddress,
    methodParameters: { calldata, value },
    swapRouterAddress,
    approveAmount,
    typeInfo,
    gasSpendEstimate,
    gasPrice,
  } = params

  if (!gasSpendEstimate.approve || !gasSpendEstimate.swap) {
    logger.info('swapSaga', 'approveAndSwap', 'Gas estimates were not provided')
    return
  }

  try {
    const provider = yield* call(getProvider, chainId)
    const nonce = yield* call([provider, provider.getTransactionCount], account.address)

    const approveSubmitted = yield* call(maybeApprove, {
      account,
      chainId,
      inputTokenAddress,
      spender: swapRouterAddress,
      approveAmount,
      gasLimit: gasSpendEstimate.approve,
      gasPrice,
    })

    const request: providers.TransactionRequest = {
      from: account.address,
      to: swapRouterAddress,
      data: calldata,
      ...(!value || isZero(value) ? {} : { value }),
      gasLimit: gasSpendEstimate.swap,
      gasPrice,
      nonce: approveSubmitted ? nonce + 1 : nonce,
    }

    const options: TransactionOptions = {
      request,
    }

    yield* call(sendTransaction, {
      chainId,
      account,
      options,
      typeInfo,
    })
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
