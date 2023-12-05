import { useMemo, useRef } from 'react'
import { trimToLength } from 'utilities/src/primitives/string'
import { useENSName } from 'wallet/src/features/ens/api'
import useIsFocused from 'wallet/src/features/focus/useIsFocused'
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
  const addressRef = useRef<string | null>(null)
  const isFocused = useIsFocused()
  const activeAccountAddress = useAppSelector(selectActiveAccountAddress)

  // Update the account address only when the screen is focused
  // or the address haven't been set yet
  // (this prevents crashes when the useActiveAccountAddressWithThrow
  // hook is used on screen that is still kept in the navigation stack
  // and the last/only existing account is deleted)
  if (isFocused || !addressRef.current) {
    addressRef.current = activeAccountAddress
  }

  if (!addressRef.current) throw new Error('No active account address')

  return addressRef.current
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
  const selectAccountNotificationSetting = useMemo(() => makeSelectAccountNotificationSetting(), [])
  return useAppSelector((state) => selectAccountNotificationSetting(state, address))
}

export function useSelectAccountHideSmallBalances(address: string): boolean {
  const selectAccountHideSmallBalances = useMemo(() => makeSelectAccountHideSmallBalances(), [])
  return useAppSelector((state) => selectAccountHideSmallBalances(state, address))
}

export function useSelectAccountHideSpamTokens(address: string): boolean {
  const selectAccountHideSpamTokens = useMemo(() => makeSelectAccountHideSpamTokens(), [])
  return useAppSelector((state) => selectAccountHideSpamTokens(state, address))
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
