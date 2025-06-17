import { put } from 'typed-redux-saga'
import { logger } from 'utilities/src/logger/logger'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { addAccounts, setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { createMonitoredSaga } from 'wallet/src/utils/saga'

export interface CreateAccountsParams {
  accounts: Account[]
}

export function* createAccounts({ accounts }: CreateAccountsParams) {
  yield* put(addAccounts(accounts))

  const address = accounts[0]?.address
  if (address) {
    yield* put(setAccountAsActive(address))
  }

  logger.debug(
    'createAccountsSaga',
    'createAccount',
    'New accounts created:',
    accounts.map((acc) => acc.address).join(','),
  )
}

export const {
  name: createAccountsSagaName,
  wrappedSaga: createAccountsSaga,
  reducer: createAccountsReducer,
  actions: createAccountsActions,
} = createMonitoredSaga({
  saga: createAccounts,
  name: 'createAccounts',
})
