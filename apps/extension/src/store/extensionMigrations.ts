import { DappRequestStatus } from 'src/app/features/dappRequests/shared'
import type { DappRequestState } from 'src/app/features/dappRequests/slice'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'

export function removeDappInfoToChromeLocalStorage({ dapp: _dapp, ...state }: any): any {
  return state
}

// migrates pending dapp requests array without status or timestamp to a record with status (pending|confirming) and timestamp
export function migratePendingDappRequestsToRecord(state: any): any {
  // If there's no dappRequests state or it's already in the new format, return unchanged
  if (!state.dappRequests || !state.dappRequests.pending || state.dappRequests.requests) {
    return state
  }

  // Create new record object to hold requests
  const requests: DappRequestState['requests'] = {}

  // Convert each pending request to the record format with status
  state.dappRequests.pending.forEach((item: unknown, index: number) => {
    if (
      item !== null &&
      typeof item === 'object' &&
      'dappRequest' in item &&
      typeof item.dappRequest === 'object' &&
      item.dappRequest !== null &&
      'requestId' in item.dappRequest &&
      typeof item.dappRequest.requestId === 'string'
    ) {
      const updatedRequest = {
        ...item,
        // Map to new structure with status and timestamp
        status: DappRequestStatus.Pending,
        createdAt: Date.now() + index * 1000, // Add timestamp for sorting
      } as DappRequestState['requests'][string]

      requests[item.dappRequest.requestId] = updatedRequest
    }
  })

  // Return state with updated dappRequests slice
  return {
    ...state,
    dappRequests: {
      requests,
    },
  }
}

// Migrates accounts with no backup method to have `maybe-manual` backup method.
// Before this migration, we were not setting the backup method on accounts created during Extension onboarding,
// so we're unsure if the user completed the backup flow during onboarding or if they hit "Skip".
export function migrateUnknownBackupAccountsToMaybeManualBackup(state: any): any {
  if (!state.wallet?.accounts) {
    return state
  }

  // Update each account to have manual backup
  const updatedAccounts = Object.entries(state.wallet.accounts as Record<Address, { backups?: BackupType[] }>).reduce(
    (acc, [address, account]) => {
      // Skip if not an object
      if (typeof account !== 'object') {
        return acc
      }

      acc[address] = {
        ...account,
        // Add manual backup if backups array doesn't exist or is empty
        backups: account.backups?.length ? account.backups : ['maybe-manual'],
      }
      return acc
    },
    {} as Record<string, any>,
  )

  return {
    ...state,
    wallet: {
      ...state.wallet,
      accounts: updatedAccounts,
    },
  }
}
