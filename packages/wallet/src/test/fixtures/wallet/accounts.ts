import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils'
import {
  AccountBase,
  AccountType,
  BackupType,
  ReadOnlyAccount,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { SAMPLE_SEED_ADDRESS_1, SAMPLE_SEED_ADDRESS_2, SAMPLE_SEED_ADDRESS_3 } from 'wallet/src/test/fixtures'
import { randomEnumValue } from 'wallet/src/test/utils'

/**
 * Base fixtures
 */

export const accountBase = createFixture<AccountBase>()(() => ({
  type: randomEnumValue(AccountType),
  address: faker.finance.ethereumAddress(),
  timeImportedMs: faker.datatype.number(),
  name: faker.name.fullName(),
}))

export const signerMnemonicAccount = createFixture<SignerMnemonicAccount>()(() => ({
  ...accountBase(),
  type: AccountType.SignerMnemonic,
  derivationIndex: faker.datatype.number(),
  mnemonicId: faker.datatype.uuid(),
  backups: [randomEnumValue(BackupType)],
}))

export const readOnlyAccount = createFixture<ReadOnlyAccount>()(() => ({
  ...accountBase(),
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
