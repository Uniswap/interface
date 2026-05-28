import { ReadOnlyAccountMeta, SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'

export enum BackupType {
  Manual = 'manual',
  // This is only being used in the Extension. It was added via a migration for accounts created before May 2025.
  // Before we refactored the onboarding flow, we were not saving the backup type for accounts *created* during onboarding (importing was properly setting 'manual'),
  // so we're unsure if the account was correctly backed up or if the user clicked the "Skip" button when prompted to verify their seed phrase during onboarding.
  MaybeManual = 'maybe-manual',
  Cloud = 'cloud',
  Passkey = 'passkey',
}

type AccountCustomizations = {
  localPfp?: string
}

export interface WalletAccountFields {
  name?: string
  customizations?: AccountCustomizations
  backups?: BackupType[]
  timeImportedMs: number
  hasBalanceOrActivity?: boolean
  pushNotificationsEnabled: boolean
}

export interface SignerMnemonicAccount extends WalletAccountFields, SignerMnemonicAccountMeta {
  derivationIndex: number
  mnemonicId: string
  smartWalletConsent?: boolean
}

export interface ReadOnlyAccount extends WalletAccountFields, ReadOnlyAccountMeta {}

export type Account = SignerMnemonicAccount | ReadOnlyAccount
