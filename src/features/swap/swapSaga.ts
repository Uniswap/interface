import { MethodParameters } from '@uniswap/v3-sdk'
import { providers } from 'ethers'
import { Erc20 } from 'src/abis/types'
import { getSignerManager, getWalletProviders } from 'src/app/walletContext'
import { ChainId } from 'src/constants/chains'
import { maybeApprove } from 'src/features/approve/approveSaga'
import { fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { addTransaction, finalizeTransaction } from 'src/features/transactions/sagaHelpers'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'src/features/transactions/types'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export type SwapParams = {
  account: Account
  chainId: ChainId
  methodParameters: MethodParameters
  swapRouterAddress: Address
  transactionInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
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
    transactionInfo,
  } = params

  try {
    if (account.type === AccountType.readonly) throw new Error('Account must support signing')

    const signerManager = yield* call(getSignerManager)
    const providerManager = yield* call(getWalletProviders)
    const signer = yield* call([signerManager, signerManager.getSignerForAccount], account)
    const provider = providerManager.getProvider(chainId)
    const connectedSigner = yield* call([signer, signer.connect], provider)

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

    const transaction: providers.TransactionRequest = {
      from: account.address,
      to: swapRouterAddress,
      data: calldata,
      ...(!value || isZero(value) ? {} : { value }),
    }

    const tx = yield* call([connectedSigner, connectedSigner.populateTransaction], transaction)
    const signedTx = yield* call([connectedSigner, connectedSigner.signTransaction], tx)
    const transactionResponse = yield* call([provider, provider.sendTransaction], signedTx)

    yield* call(addTransaction, transactionResponse, transactionInfo)

    const transactionReceipt = yield* call(transactionResponse.wait)

    yield* call(finalizeTransaction, transactionResponse, transactionReceipt)

    yield* put(fetchBalancesActions.trigger(account.address))
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
