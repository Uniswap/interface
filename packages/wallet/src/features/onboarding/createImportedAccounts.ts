import dayjs from 'dayjs'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { NUMBER_OF_WALLETS_TO_GENERATE } from 'wallet/src/features/onboarding/OnboardingContext'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

export const createImportedAccounts = async (
  mnemonicId: string,
  backupType?: BackupType.Cloud | BackupType.Manual,
): Promise<SignerMnemonicAccount[]> => {
  const addresses = await Promise.all(
    Array(NUMBER_OF_WALLETS_TO_GENERATE)
      .fill(null)
      .map(async (_, index) => await Keyring.generateAndStorePrivateKey(mnemonicId, index)),
  )
  const importedAccounts: SignerMnemonicAccount[] = addresses.map((address, index) => ({
    type: AccountType.SignerMnemonic,
    address,
    timeImportedMs: dayjs().valueOf(),
    derivationIndex: index,
    mnemonicId,
    backups: backupType ? [backupType] : undefined,
    pushNotificationsEnabled: true,
  }))
  return importedAccounts
}
