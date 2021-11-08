import { MethodParameters } from '@uniswap/v3-sdk'
import { providers, utils } from 'ethers'
import { getWalletAccounts, getWalletProviders } from 'src/app/walletContext'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { AccountManager } from 'src/features/wallet/accounts/AccountManager'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { isZero } from 'src/utils/number'
import { createMonitoredSaga } from 'src/utils/saga'
import { call } from 'typed-redux-saga'

export interface SwapParams {
  account: AccountStub
  methodParameters: MethodParameters
}

export function* swap(params: SwapParams) {
  const { account, methodParameters } = params
  const accountManager = yield* call(getWalletAccounts)
  const providerManager = yield* call(getWalletProviders)
  yield* call(_swap, account, methodParameters, accountManager, providerManager)
}

async function _swap(
  account: AccountStub,
  { value, calldata }: MethodParameters,
  accountManager: AccountManager,
  providerManager: ProviderManager
) {
  const provider = providerManager.getProvider(ChainId.RINKEBY)
  const walletAccount = accountManager.getAccount(account.address)

  if (!walletAccount) throw Error('No active account')

  // TODO check balance?
  const currentGasPrice = await provider.getGasPrice()
  const gasPrice = utils.hexlify(parseInt(currentGasPrice.toString(), 10))
  const nonce = await provider.getTransactionCount(account.address, 'pending')
  const transaction: providers.TransactionRequest = {
    from: account.address,
    to: SWAP_ROUTER_ADDRESSES[ChainId.RINKEBY],
    data: calldata,
    nonce,
    gasPrice,
    ...(value && !isZero(value) ? { value: value } : {}),
  }
  transaction.gasLimit = await provider.estimateGas(transaction)
  const signedTransaction = await walletAccount.signer.signTransaction(transaction)
  const transactionResult = await provider.sendTransaction(signedTransaction)
  logger.debug('swap', '', 'Swap finished!', transactionResult)
}

export const {
  name: swapSagaName,
  wrappedSaga: swapSaga,
  reducer: swapReducer,
  actions: swapActions,
} = createMonitoredSaga<SwapParams>(swap, 'swap')
