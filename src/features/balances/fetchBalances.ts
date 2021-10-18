import { getWalletProviders } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { SupportedChainId } from 'src/constants/chains'
import { Balance } from 'src/features/balances/types'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'
import { updateBalances } from './balancesSlice'

export function* fetchBalances(account: AccountStub) {
  const manager = yield* call(getWalletProviders)
  const updatedBalances = yield* call(_fetchBalances, account, manager)
  yield* put(updateBalances({ account, updatedBalances }))
}

async function _fetchBalances(
  account: AccountStub,
  manager: ProviderManager
): Promise<{ [currencyKey: string]: Balance }> {
  logger.debug('Fetching balances for:', account.address)

  // TODO use the appropriate provider
  const goerliProvider = manager.getProvider(SupportedChainId.GOERLI)

  // TODO using NULL_ADDRESS for Eth, eventually use currencyToKey util function
  const amount = await goerliProvider.getBalance(account.address)
  const tokenAddress = NULL_ADDRESS
  const balance: Balance = { amount: amount.toString() }
  logger.debug('Fetched Balance:', amount.toString())

  return { [tokenAddress]: balance }
}

export const {
  name: fetchBalancesSagaName,
  wrappedSaga: fetchBalancesSaga,
  reducer: fetchBalancesReducer,
  actions: fetchBalancesActions,
} = createMonitoredSaga<AccountStub>(fetchBalances, 'fetchBalances')
