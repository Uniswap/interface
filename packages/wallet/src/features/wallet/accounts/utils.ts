import { Account, BackupType } from 'wallet/src/features/wallet/accounts/types'

/**
 * Passkey is not considered an external backup, we still want the user to add cloud or manual backups.
 */
export function hasExternalBackup(account?: Account): boolean {
  return account?.backups?.some((backupType) => backupType !== BackupType.Passkey) ?? false
}

export function hasBackup(type: BackupType, account?: Account): boolean {
  return account?.backups?.includes(type) ?? false
}
