import { MethodParameters } from '@uniswap/v3-sdk'
import { providers } from 'ethers'
import { Erc20 } from 'src/abis/types'
import { ChainId } from 'src/constants/chains'
import { maybeApprove } from 'src/features/approve/approveSaga'
import { sendTransaction } from 'src/features/transactions/sendTransaction'
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
  txAmount: string

  // Optional. provide if input currency requires approval
  contract: Erc20 | null
}

export function* approveAndSwap(params: SwapParams) {
  const {
    account,
    chainId,
    contract,
    methodParameters: { calldata, value },
    swapRouterAddress,
    txAmount,
    typeInfo,
  } = params

  try {
    if (contract) {
      const approved = yield* call(maybeApprove, {
        account,
        chainId,
        contract,
        spender: swapRouterAddress,
        txAmount,
      })
      if (!approved) {
        throw new Error('Provided SwapRouter contract is not approved to spend tokens')
      }
    }

    const request: providers.TransactionRequest = {
      from: account.address,
      to: swapRouterAddress,
      data: calldata,
      ...(!value || isZero(value) ? {} : { value }),
    }

    const options: TransactionOptions = {
      request,
      fetchBalanceOnSuccess: true,
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
