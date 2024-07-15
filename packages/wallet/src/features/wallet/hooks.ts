import { useMemo, useRef } from 'react'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'
import { getValidAddress, sanitizeAddressText, shortenAddress } from 'uniswap/src/utils/addresses'
import { trimToLength } from 'utilities/src/primitives/string'
import { useENSAvatar, useENSName } from 'wallet/src/features/ens/api'
import useIsFocused from 'wallet/src/features/focus/useIsFocused'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { Account, AccountType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import {
  makeSelectAccountNotificationSetting,
  selectAccounts,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectSignerMnemonicAccountExists,
  selectSignerMnemonicAccounts,
  selectViewOnlyAccounts,
  selectWalletHideSmallBalancesSetting,
  selectWalletHideSpamTokensSetting,
  selectWalletSwapProtectionSetting,
} from 'wallet/src/features/wallet/selectors'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'
import { useAppSelector } from 'wallet/src/state'

const ENS_TRIM_LENGTH = 8

export function useAccounts(): Record<string, Account> {
  return useAppSelector<Record<string, Account>>(selectAccounts)
}

export function useAccount(address: Address): Account {
  const account = useAppSelector<Record<string, Account>>(selectAccounts)[address]
  if (!account) {
    throw new Error(`No account found for address ${address}`)
  }
  return account
}

export function useAccountIfExists(address: Address): Account | undefined {
  const account = useAppSelector<Record<string, Account>>(selectAccounts)[address]
  return account
}

export function useSignerAccountIfExists(address: Address): SignerMnemonicAccount | undefined {
  const signerAccounts = useAppSelector<SignerMnemonicAccount[]>(selectSignerMnemonicAccounts)
  return signerAccounts.find((account) => account.address === address)
}

export function useSignerAccounts(): SignerMnemonicAccount[] {
  return useAppSelector<SignerMnemonicAccount[]>(selectSignerMnemonicAccounts)
}

export function useViewOnlyAccounts(): Account[] {
  return useAppSelector<Account[]>(selectViewOnlyAccounts)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(selectActiveAccount)
}

export function useActiveSignerAccount(): Account | null {
  const activeAccount = useAppSelector(selectActiveAccount)
  return activeAccount?.type === AccountType.SignerMnemonic ? activeAccount : null
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

  if (!addressRef.current) {
    throw new Error('No active account address')
  }

  return addressRef.current
}

export function useActiveAccountWithThrow(): Account {
  const activeAccount = useAppSelector(selectActiveAccount)
  if (!activeAccount) {
    throw new Error('No active account')
  }
  return activeAccount
}

export function useSwapProtectionSetting(): SwapProtectionSetting {
  return useAppSelector(selectWalletSwapProtectionSetting)
}

export function useSelectAccountNotificationSetting(address: Address): boolean {
  const selectAccountNotificationSetting = useMemo(() => makeSelectAccountNotificationSetting(), [])
  return useAppSelector((state) => selectAccountNotificationSetting(state, address))
}

export function useHideSmallBalancesSetting(): boolean {
  return useAppSelector(selectWalletHideSmallBalancesSetting)
}

export function useHideSpamTokensSetting(): boolean {
  return useAppSelector(selectWalletHideSpamTokensSetting)
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
    return
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

/*
 * Fetches avatar for address, in priority uses: unitag avatar, ens avatar, undefined
 *  Note that this hook is used instead of just useENSAvatar because our implementation
 *  of useENSAvatar checks for reverse name resolution which Unitags does not support.
 *  Chose to do this because even if we used useENSAvatar without reverse name resolution,
 *  there is more latency because it has to go to the contract via CCIP-read first.
 */
export function useAvatar(address: Maybe<string>): {
  avatar: Maybe<string>
  loading: boolean
} {
  const validated = getValidAddress(address)
  const { data: ensAvatar, loading: ensLoading } = useENSAvatar(validated)
  const { unitag, loading: unitagLoading } = useUnitagByAddress(validated || undefined)

  const unitagAvatar = unitag?.metadata?.avatar

  if (unitagAvatar) {
    return { avatar: unitagAvatar, loading: false }
  }

  if (ensAvatar) {
    return { avatar: ensAvatar, loading: false }
  }

  return { avatar: undefined, loading: ensLoading || unitagLoading }
}
