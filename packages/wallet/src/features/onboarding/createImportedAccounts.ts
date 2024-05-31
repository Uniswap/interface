import dayjs from 'dayjs'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import {
  AccountType,
  BackupType,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/wallet/import/utils'

export const createImportedAccounts = async (
  mnemonicId: string,
  backupType?: BackupType.Cloud | BackupType.Manual
): Promise<SignerMnemonicAccount[]> => {
  const addresses = await Promise.all(
    Array(NUMBER_OF_WALLETS_TO_IMPORT)
      .fill(null)
      .map(async (_, index) => Keyring.generateAndStorePrivateKey(mnemonicId, index))
  )

  const importedAccounts: SignerMnemonicAccount[] = addresses.map((address, index) => ({
    type: AccountType.SignerMnemonic,
    address,
    timeImportedMs: dayjs().valueOf(),
    derivationIndex: index,
    mnemonicId,
    backups: backupType ? [backupType] : undefined,
  }))
  return importedAccounts
}
