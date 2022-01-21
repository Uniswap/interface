import { appSelect } from 'src/app/hooks'
import { getProviderManager } from 'src/app/walletContext'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'
import { Balance } from 'src/features/balances/types'
import { selectActiveChainIds } from 'src/features/chains/utils'
import { ProviderManager } from 'src/features/providers/ProviderManager'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'
import { updateBalances } from './balancesSlice'

// Use in place of address to fetch for all accounts
export const ALL_ACCOUNTS = '__all_accounts__'

export function* fetchBalances(address: Address) {
  const manager = yield* call(getProviderManager)
  const accounts = yield* appSelect((state) => state.wallet.accounts)
  const allAddresses = Object.keys(accounts)
  const addrsToFetch = address === ALL_ACCOUNTS ? allAddresses : [address]
  const activeChains = yield* selectActiveChainIds()
  for (const addr of addrsToFetch) {
    for (const chainId of activeChains) {
      const updatedBalances = yield* call(_fetchBalances, addr, chainId, manager)
      yield* put(updateBalances({ address, chainId, updatedBalances }))
    }
  }
}

async function _fetchBalances(
  address: Address,
  chainId: ChainId,
  manager: ProviderManager
): Promise<{ [currencyKey: string]: Balance }> {
  logger.debug('fetchBalances', '', 'Fetching for:', address)
  const provider = await manager.getInitalizedProvider(chainId)

  // TODO using NULL_ADDRESS for Eth, eventually use currencyId util function
  const amount = await provider.getBalance(address)
  const tokenAddress = NULL_ADDRESS
  const balance: Balance = { amount: amount.toString() }
  logger.debug('fetchBalances', '', 'Fetched balance:', amount.toString())

  return { [tokenAddress]: balance }
}

export const {
  name: fetchBalancesSagaName,
  wrappedSaga: fetchBalancesSaga,
  reducer: fetchBalancesReducer,
  actions: fetchBalancesActions,
} = createMonitoredSaga<Address>(fetchBalances, 'fetchBalances')
