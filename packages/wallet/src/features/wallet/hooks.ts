import { useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useENSName } from 'uniswap/src/features/ens/api'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { getValidAddress, sanitizeAddressText } from 'uniswap/src/utils/addresses'
import { shortenAddress } from 'utilities/src/addresses'
import { trimToLength } from 'utilities/src/primitives/string'
import useIsFocused from 'wallet/src/features/focus/useIsFocused'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import {
  makeSelectAccountNotificationSetting,
  selectAccounts,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectSignerMnemonicAccountExists,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
  selectWalletSwapProtectionSetting,
} from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'
import { WalletState } from 'wallet/src/state/walletReducer'

const ENS_TRIM_LENGTH = 8

export function useAccounts(): Record<string, Account> {
  return useSelector(selectAccounts)
}

/**
 * Hook used to get a list of all accounts
 * @returns list of accounts, with signer accounts first sorted by derivation index then view only accounts sorted by time imported
 */
export function useAccountsList(): Account[] {
  const addressToAccount = useAccounts()

  return useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _mnemonicWallets = accounts
      .filter((a): a is SignerMnemonicAccount => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => {
        return a.derivationIndex - b.derivationIndex
      })
    const _viewOnlyWallets = accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    return [..._mnemonicWallets, ..._viewOnlyWallets]
  }, [addressToAccount])
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

type DisplayNameOptions = {
  showShortenedEns?: boolean
  includeUnitagSuffix?: boolean
  showLocalName?: boolean
  overrideDisplayName?: string
}

/**
 * Displays the ENS name if one is available otherwise displays the local name and if neither are available it shows the address.
 *
 * @param address - The address to display
 * @param options.showShortenedEns - Whether to shorten the ENS name to ENS_TRIM_LENGTH characters
 * @param options.includeUnitagSuffix - Whether to include the unitag suffix (.uni.eth) in returned unitag name
 * @param options.showLocalName - Whether to show the local wallet name
 */
export function useDisplayName(address: Maybe<string>, options?: DisplayNameOptions): DisplayName | undefined {
  const defaultOptions = {
    showShortenedEns: false,
    includeUnitagSuffix: false,
    showLocalName: true,
  }
  const hookOptions = { ...defaultOptions, ...options }
  const { showShortenedEns, includeUnitagSuffix, showLocalName, overrideDisplayName } = hookOptions

  const validated = getValidAddress(address)
  const ens = useENSName(validated ?? undefined)
  const { unitag } = useUnitagByAddress(validated ?? undefined)
  const { getOnboardingAccount } = useOnboardingContext()
  const onboardingAccount = getOnboardingAccount()

  // Need to account for pending accounts for use within onboarding
  const maybeLocalName = useAccounts()[address ?? '']?.name
  const localName = maybeLocalName ?? onboardingAccount?.name

  if (!address) {
    return undefined
  }

  if (overrideDisplayName) {
    return {
      name: showShortenedEns ? trimToLength(overrideDisplayName, ENS_TRIM_LENGTH) : overrideDisplayName,
      type: DisplayNameType.ENS,
    }
  }

  if (unitag?.username) {
    return {
      name: includeUnitagSuffix ? unitag.username + UNITAG_SUFFIX : unitag.username,
      type: DisplayNameType.Unitag,
    }
  }

  if (ens.data) {
    return {
      name: showShortenedEns ? trimToLength(ens.data, ENS_TRIM_LENGTH) : ens.data,
      type: DisplayNameType.ENS,
    }
  }

  if (showLocalName && localName) {
    return { name: localName, type: DisplayNameType.Local }
  }

  return {
    name: `${sanitizeAddressText(shortenAddress(address))}`,
    type: DisplayNameType.Address,
  }
}
