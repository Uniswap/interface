import { AccountType } from 'src/features/wallet/accounts/types'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { generateAndStoreMnemonic, generateAndStorePrivateKey } from 'src/lib/RNEthersRs'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

// default to first index in derivation array
export function* createAccount(derivationIndex = 0) {
  const mnemonicId = yield* call(generateAndStoreMnemonic)
  const address = yield* call(generateAndStorePrivateKey, mnemonicId, derivationIndex)
  const type = AccountType.Native
  yield* put(addAccount({ type, address, pending: true }))
  yield* put(activateAccount(address))
  logger.info('createAccountSaga', '', 'New account created:', address)
}

export const {
  name: createAccountSagaName,
  wrappedSaga: createAccountSaga,
  reducer: createAccountReducer,
  actions: createAccountActions,
} = createMonitoredSaga<number>(createAccount, 'createAccount')
