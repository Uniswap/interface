import { AccountType } from 'uniswap/src/features/accounts/types'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2, SAMPLE_SEED_ADDRESS_3 } from 'uniswap/src/test/fixtures'
import { faker } from 'uniswap/src/test/shared'
import { createFixture, randomEnumValue } from 'uniswap/src/test/utils'
import {
  BackupType,
  ReadOnlyAccount,
  SignerMnemonicAccount,
  WalletAccountFields,
} from 'wallet/src/features/wallet/accounts/types'

/**
 * Base fixtures
 */

export const accountBaseFields = createFixture<WalletAccountFields>()(() => ({
  type: randomEnumValue(AccountType),
  address: faker.finance.ethereumAddress(),
  timeImportedMs: faker.datatype.number(),
  name: faker.name.fullName(),
  pushNotificationsEnabled: true,
}))

export const signerMnemonicAccount = createFixture<SignerMnemonicAccount>()(() => ({
  ...accountBaseFields(),
  type: AccountType.SignerMnemonic,
  derivationIndex: faker.datatype.number(),
  mnemonicId: faker.datatype.uuid(),
  backups: [randomEnumValue(BackupType)],
  smartWalletConsent: false,
}))

export const readOnlyAccount = createFixture<ReadOnlyAccount>()(() => ({
  ...accountBaseFields(),
  type: AccountType.Readonly,
}))

/**
 * Static fixtures
 */

export const ACCOUNT = signerMnemonicAccount({
  type: AccountType.SignerMnemonic,
  address: SAMPLE_SEED_ADDRESS_1,
  derivationIndex: 0,
  name: 'Test Account',
  timeImportedMs: 10,
  mnemonicId: SAMPLE_SEED_ADDRESS_1,
  backups: [BackupType.Cloud],
})

export const ACCOUNT2 = signerMnemonicAccount({
  type: AccountType.SignerMnemonic,
  address: SAMPLE_SEED_ADDRESS_2,
  derivationIndex: 1,
  name: 'Test Account 2',
  timeImportedMs: 100,
  mnemonicId: SAMPLE_SEED_ADDRESS_1,
  backups: [BackupType.Manual],
})

export const ACCOUNT3 = signerMnemonicAccount({
  type: AccountType.SignerMnemonic,
  address: SAMPLE_SEED_ADDRESS_3,
  derivationIndex: 2,
  name: 'Test Account 3',
  timeImportedMs: 100,
  mnemonicId: SAMPLE_SEED_ADDRESS_1,
  backups: [BackupType.Manual],
})
