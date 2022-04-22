import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { generateAndStoreMnemonic, generateAndStorePrivateKey } from 'src/lib/RNEthersRs'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export function* createAccount() {
  const mnemonicId = yield* call(generateAndStoreMnemonic)
  const address = yield* call(generateAndStorePrivateKey, mnemonicId, 0)
  const type = AccountType.Native
  yield* put(addAccount({ type, address }))
  yield* put(activateAccount(address))
  logger.info('createAccountSaga', '', 'New account created:', address)
}

export const {
  name: createAccountSagaName,
  wrappedSaga: createAccountSaga,
  reducer: createAccountReducer,
  actions: createAccountActions,
} = createMonitoredSaga<void>(createAccount, 'createAccount')
