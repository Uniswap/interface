import { MethodParameters } from '@uniswap/v3-sdk'
import { providers } from 'ethers'
import { getWalletAccounts, getWalletProviders } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { ApproveParams, maybeApprove } from 'src/features/approve/approveSaga'
import { AccountType } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export interface SwapParams extends ApproveParams {
  chainId: ChainId
  methodParameters: MethodParameters
}

export function* approveAndSwap(params: SwapParams) {
  const {
    account,
    chainId,
    methodParameters: { calldata, value },
    spender: swapRouter,
  } = params

  try {
    const accountManager = yield* call(getWalletAccounts)
    const providerManager = yield* call(getWalletProviders)
    const walletAccount = accountManager.getAccount(account.address)

    if (!walletAccount) throw new Error('No account for specified address')
    if (walletAccount.type === AccountType.readonly) throw new Error('Account must support signing')

    const provider = providerManager.getProvider(chainId)
    const signer = walletAccount.signer.connect(provider)

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

    // Signer.sendTransaction populates fields (gas, nonce, chainId, etc.), signs and sends
    const transactionResponse = yield* call(signer.sendTransaction, transaction)

    const receipt = yield* call(transactionResponse.wait)
    logger.debug('swapSaga', '', 'Swap receipt:', receipt.transactionHash)
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
