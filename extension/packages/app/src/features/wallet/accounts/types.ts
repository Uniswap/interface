import { AccountType } from 'app/src/features/wallet/types'

export enum BackupType {
  Manual = 'manual',
  Cloud = 'cloud',
}

export type AccountCustomizations = {
  localPfp?: string
}

export interface AccountBase {
  type: AccountType
  address: Address
  name?: string
  customizations?: AccountCustomizations
  backups?: BackupType[]
  flashbotsEnabled?: boolean
  pending?: boolean
  timeImportedMs: number
  pushNotificationsEnabled?: boolean
  showSmallBalances?: boolean
  showSpamTokens?: boolean
}

export interface SignerMnemonicAccount extends AccountBase {
  type: AccountType.SignerMnemonic
  derivationIndex: number
  mnemonicId: string
}

export interface ReadOnlyAccount extends AccountBase {
  type: AccountType.Readonly
}

export type Account = SignerMnemonicAccount | ReadOnlyAccount
