import dayjs from 'dayjs'
import { appSelect } from 'src/app/hooks'
import { AccountType, BackupType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { selectSortedSignerMnemonicAccounts } from 'src/features/wallet/selectors'
import { activateAccount, addAccount } from 'src/features/wallet/walletSlice'
import { generateAndStoreMnemonic, generateAndStorePrivateKey } from 'src/lib/RNEthersRs'
import { logger } from 'src/utils/logger'
import { createMonitoredSaga } from 'src/utils/saga'
import { call, put } from 'typed-redux-saga'

export function* createAccount() {
  const sortedMnemonicAccounts: SignerMnemonicAccount[] = yield* appSelect(
    selectSortedSignerMnemonicAccounts
  )
  const { nextDerivationIndex, mnemonicId, existingBackups } = yield* call(
    getNewAccountParams,
    sortedMnemonicAccounts
  )
  const address = yield* call(generateAndStorePrivateKey, mnemonicId, nextDerivationIndex)

  yield* put(
    addAccount({
      type: AccountType.SignerMnemonic,
      address,
      pending: true,
      timeImportedMs: dayjs().valueOf(),
      derivationIndex: nextDerivationIndex,
      mnemonicId,
      backups: existingBackups,
    })
  )
  yield* put(activateAccount(address))
  logger.debug('createAccountSaga', '', 'New account created:', address)
}

async function getNewAccountParams(sortedAccounts: SignerMnemonicAccount[]): Promise<{
  nextDerivationIndex: number
  mnemonicId: string
  existingBackups?: BackupType[]
}> {
  if (sortedAccounts.length === 0 || !sortedAccounts[0]) {
    const mnemonicId = await generateAndStoreMnemonic()
    return { nextDerivationIndex: 0, mnemonicId }
  }
  return {
    nextDerivationIndex: getNextDerivationIndex(sortedAccounts),
    mnemonicId: sortedAccounts[0].mnemonicId,
    existingBackups: sortedAccounts[0].backups,
  }
}

function getNextDerivationIndex(sortedAccounts: SignerMnemonicAccount[]): number {
  // if there is a missing index in the series (0, 1, _, 3), return this missing index
  let nextIndex = 0
  for (const account of sortedAccounts) {
    if (account.derivationIndex !== nextIndex) {
      return Math.min(account.derivationIndex, nextIndex)
    }
    nextIndex += 1
  }
  // if all exist, nextDerivation = sortedMnemonicAccounts.length + 1
  return nextIndex
}

export const {
  name: createAccountSagaName,
  wrappedSaga: createAccountSaga,
  reducer: createAccountReducer,
  actions: createAccountActions,
} = createMonitoredSaga(createAccount, 'createAccount')
