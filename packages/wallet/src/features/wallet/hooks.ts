import { trimToLength } from 'utilities/src/primitives/string'
import { useENSName } from 'wallet/src/features/ens/api'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { useAppSelector } from 'wallet/src/state'
import { getValidAddress, sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import {
  makeSelectAccountHideSmallBalances,
  makeSelectAccountHideSpamTokens,
  makeSelectAccountNotificationSetting,
  selectAccounts,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectNonPendingAccounts,
  selectNonPendingSignerMnemonicAccounts,
  selectPendingAccounts,
  selectSignerMnemonicAccountExists,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
  selectWalletSwapProtectionSetting,
} from './selectors'

const ENS_TRIM_LENGTH = 8

export function useAccounts(): Record<string, Account> {
  return useAppSelector<Record<string, Account>>(selectNonPendingAccounts)
}

export function useAccount(address: Address): Account {
  const account = useAppSelector<Record<string, Account>>(selectAccounts)[address]
  if (!account) throw new Error(`No account found for address ${address}`)
  return account
}

export function usePendingAccounts(): AddressTo<Account> {
  return useAppSelector<AddressTo<Account>>(selectPendingAccounts)
}

export function useSignerAccounts(): Account[] {
  return useAppSelector<Account[]>(selectSignerMnemonicAccounts)
}

export function useNonPendingSignerAccounts(): SignerMnemonicAccount[] {
  return useAppSelector<SignerMnemonicAccount[]>(selectNonPendingSignerMnemonicAccounts)
}

export function useViewOnlyAccounts(): Account[] {
  return useAppSelector<Account[]>(selectViewOnlyAccounts)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(selectActiveAccount)
}

export function useActiveAccountAddress(): Address | null {
  return useAppSelector(selectActiveAccountAddress)
}

export function useNativeAccountExists(): boolean {
  return useAppSelector(selectSignerMnemonicAccountExists)
}

export function useActiveAccountAddressWithThrow(): Address {
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)
  if (!activeAccountAddress) throw new Error('No active account address')
  return activeAccountAddress
}

export function useActiveAccountWithThrow(): Account {
  const activeAccount = useAppSelector(selectActiveAccount)
  if (!activeAccount) throw new Error('No active account')
  return activeAccount
}

export function useSwapProtectionSetting(): SwapProtectionSetting {
  return useAppSelector(selectWalletSwapProtectionSetting)
}

export function useSelectAccountNotificationSetting(address: Address): boolean {
  return useAppSelector(makeSelectAccountNotificationSetting(address))
}

export function useSelectAccountHideSmallBalances(address: string): boolean {
  return useAppSelector(makeSelectAccountHideSmallBalances(address))
}

export function useSelectAccountHideSpamTokens(address: string): boolean {
  return useAppSelector(makeSelectAccountHideSpamTokens(address))
}

/**
 * Displays the ENS name if one is available otherwise displays the local name and if neither are available it shows the address.
 */
export function useDisplayName(
  address: Maybe<string>,
  showShortenedEns = false
):
  | {
      name: string
      type: 'local' | 'ens' | 'address'
    }
  | undefined {
  const validated = getValidAddress(address)
  const ens = useENSName(validated ?? undefined)

  // Need to account for pending accounts for use within onboarding
  const maybeLocalName = useAccounts()[address ?? '']?.name
  const maybeLocalNamePending = usePendingAccounts()[address ?? '']?.name
  const localName = maybeLocalName ?? maybeLocalNamePending

  if (!address) return

  if (ens.data) {
    return {
      name: showShortenedEns ? trimToLength(ens.data, ENS_TRIM_LENGTH) : ens.data,
      type: 'ens',
    }
  }

  if (localName) {
    return { name: localName, type: 'local' }
  }

  return { name: `${sanitizeAddressText(shortenAddress(address))}`, type: 'address' }
}
