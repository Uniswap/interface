import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { AccountType, DisplayName, DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useOnchainDisplayName, WalletDisplayNameOptions } from 'uniswap/src/features/accounts/useOnchainDisplayName'
import useIsFocused from 'wallet/src/features/focus/useIsFocused'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import {
  makeSelectAccountNotificationSetting,
  selectAccounts,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectHasSmartWalletConsent,
  selectSignerMnemonicAccountExists,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
  selectWalletSwapProtectionSetting,
} from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { WalletState } from 'wallet/src/state/walletReducer'

export function useAccounts(): Record<string, Account> {
  return useSelector(selectAccounts)
}

/**
 * Hook used to get a list of signer mnemonic accounts sorted by derivation index
 * @returns list of signer mnemonic accounts sorted by derivation index
 */
export function useSignerMnemonicAccountsSorted(): SignerMnemonicAccount[] {
  const addressToAccount = useAccounts()

  return useMemo(() => {
    const accounts = Object.values(addressToAccount)
    return accounts
      .filter((a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => {
        return a.derivationIndex - b.derivationIndex
      })
  }, [addressToAccount])
}

/**
 * Hook used to get a list of view-only accounts sorted by time imported
 * @returns list of view-only accounts sorted by time imported
 */
export function useViewOnlyAccountsSorted(): Account[] {
  const addressToAccount = useAccounts()

  return useMemo(() => {
    const accounts = Object.values(addressToAccount)
    return accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
  }, [addressToAccount])
}

/**
 * Hook used to get a list of all accounts
 * @returns list of accounts, with signer accounts first sorted by derivation index then view only accounts sorted by time imported
 */
export function useAccountsList(): Account[] {
  const signerMnemonicAccounts = useSignerMnemonicAccountsSorted()
  const viewOnlyAccounts = useViewOnlyAccountsSorted()

  return useMemo(() => {
    return [...signerMnemonicAccounts, ...viewOnlyAccounts]
  }, [signerMnemonicAccounts, viewOnlyAccounts])
}

export function useAccount(address: Address): Account {
  const account = useSelector(selectAccounts)[address]
  if (!account) {
    throw new Error(`No account found for address ${address}`)
  }
  return account
}

export function useSignerAccount(address: Address): SignerMnemonicAccount | undefined {
  const signerAccounts = useSelector(selectSignerMnemonicAccounts)
  return signerAccounts.find((account) => account.address === address)
}

export function useSignerAccounts(): SignerMnemonicAccount[] {
  return useSelector(selectSignerMnemonicAccounts)
}

export function useViewOnlyAccounts(): Account[] {
  return useSelector(selectViewOnlyAccounts)
}

export function useActiveAccount(): Account | null {
  return useSelector(selectActiveAccount)
}

export function useActiveSignerAccount(): SignerMnemonicAccount | null {
  const activeAccount = useActiveAccount()
  return activeAccount?.type === AccountType.SignerMnemonic ? activeAccount : null
}

export function useActiveAccountAddress(): Address | null {
  return useSelector(selectActiveAccountAddress)
}

export function useNativeAccountExists(): boolean {
  return useSelector(selectSignerMnemonicAccountExists)
}

export function useActiveAccountAddressWithThrow(): Address {
  const addressRef = useRef<string | null>(null)
  const isFocused = useIsFocused()
  const activeAccountAddress = useActiveAccountAddress()

  // Update the account address only when the screen is focused
  // or the address haven't been set yet
  // (this prevents crashes when the useActiveAccountAddressWithThrow
  // hook is used on screen that is still kept in the navigation stack
  // and the last/only existing account is deleted)
  if (isFocused || !addressRef.current) {
    addressRef.current = activeAccountAddress
  }

  if (!addressRef.current) {
    throw new Error('No active account address')
  }

  return addressRef.current
}

export function useActiveAccountWithThrow(): Account {
  const activeAccount = useActiveAccount()
  if (!activeAccount) {
    throw new Error('No active account')
  }
  return activeAccount
}

export function useAccountAddressFromUrlWithThrow(): Address {
  const storedAddress = useActiveAccountAddressWithThrow()
  // Using href instead of search to account for hash paths
  const urlAddress = new URLSearchParams(window.location.href.split('?')[1]).get('address')

  return urlAddress ? urlAddress : storedAddress
}

export function useSwapProtectionSetting(): SwapProtectionSetting {
  return useSelector(selectWalletSwapProtectionSetting)
}

export function useSelectAccountNotificationSetting(address: Address): boolean {
  const selectAccountNotificationSetting = useMemo(() => makeSelectAccountNotificationSetting(), [])
  return useSelector((state: WalletState) => selectAccountNotificationSetting(state, address))
}

/**
 * If user has an onchain ENS/Unitag name, display that name.
 * Otherwise if user is onboarding or has saved a local label, display the local name.
 * Otherwise display the address.
 *
 * @param address - The address to display
 * @param options.showShortenedEns - Whether to shorten the ENS name to ENS_TRIM_LENGTH characters
 * @param options.includeUnitagSuffix - Whether to include the unitag suffix (.uni.eth) in returned unitag name
 * @param options.showLocalName - Whether to show the local wallet name
 */
export function useDisplayName(address: Maybe<string>, options?: WalletDisplayNameOptions): DisplayName | undefined {
  const onchainDisplayName = useOnchainDisplayName(address, options)

  // Need to account for pending accounts for use within onboarding
  const { getOnboardingAccount } = useOnboardingContext()
  const onboardingAccountName = getOnboardingAccount()?.name

  const { showLocalName = true } = options ?? {}
  const localLabel = useAccounts()[address ?? '']?.name
  const localName = localLabel ?? onboardingAccountName

  if (!onchainDisplayName) {
    return undefined
  }

  const isDisplayNameENS =
    onchainDisplayName.type === DisplayNameType.ENS || onchainDisplayName.type === DisplayNameType.Unitag
  if (!isDisplayNameENS && showLocalName && localName) {
    return { name: localName, type: DisplayNameType.Local }
  }

  return onchainDisplayName
}

/**
 * Hook used to get the active account's consent status for smart wallet functionality
 * @param overrideAddress - optional address to check consent status for
 * @returns boolean if a consent status is found for the active account, null otherwise (eg if no account is active)
 */
export function useHasSmartWalletConsent(overrideAddress?: string): boolean | null {
  const activeAddress = useActiveAccount()?.address

  const address = overrideAddress || activeAddress

  const hasSmartWalletConsent = useSelector((state: WalletState) => {
    if (!address || !selectAccounts(state)[address]) {
      return null
    }
    return selectHasSmartWalletConsent(state, address)
  })

  return hasSmartWalletConsent
}

/**
 * Hook to detect when the number of accounts increases (new account added)
 * @param onAccountAdded Callback function that is called when a new account is added
 */
export function useAccountCountChanged(onAccountAdded: () => void): void {
  // Get accounts from Redux store
  const accounts = useAccounts()

  // Track previous account count to detect new accounts
  const prevAccountCountRef = useRef(Object.keys(accounts).length)

  useEffect(() => {
    const currentAccountCount = Object.keys(accounts).length

    // If account count has increased, call the callback
    if (currentAccountCount > prevAccountCountRef.current) {
      onAccountAdded()
    }

    // Update the reference for next comparison
    prevAccountCountRef.current = currentAccountCount
  }, [accounts, onAccountAdded])
}
