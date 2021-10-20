import { getWalletProviders } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { SupportedChainId } from 'src/constants/chains'
import { Balance } from 'src/features/balances/types'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'
import { updateBalances } from './balancesSlice'

export function* fetchBalances(address: Address) {
  const manager = yield* call(getWalletProviders)
  // TODO get actual set of chainIds here
  const chainIds = [SupportedChainId.GOERLI]
  for (const chainId of chainIds) {
    const updatedBalances = yield* call(_fetchBalances, address, chainId, manager)
    yield* put(updateBalances({ address, chainId, updatedBalances }))
  }
}

async function _fetchBalances(
  address: Address,
  chainId: SupportedChainId,
  manager: ProviderManager
): Promise<{ [currencyKey: string]: Balance }> {
  logger.debug('Fetching balances for:', address)
  const provider = manager.getProvider(chainId)

  // TODO using NULL_ADDRESS for Eth, eventually use currencyToKey util function
  const amount = await provider.getBalance(address)
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
} = createMonitoredSaga<Address>(fetchBalances, 'fetchBalances')
