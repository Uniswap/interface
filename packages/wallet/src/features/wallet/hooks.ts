import { useMemo, useRef } from 'react'
import { trimToLength } from 'utilities/src/primitives/string'
import { useENSAvatar, useENSName } from 'wallet/src/features/ens/api'
import useIsFocused from 'wallet/src/features/focus/useIsFocused'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'
import { useUnitagByAddress } from 'wallet/src/features/unitags/hooks'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { DisplayName, DisplayNameType } from 'wallet/src/features/wallet/types'
import { useAppSelector } from 'wallet/src/state'
import { getValidAddress, sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import {
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
  selectWalletHideSmallBalancesSetting,
  selectWalletHideSpamTokensSetting,
  selectWalletSwapProtectionSetting,
} from './selectors'

const ENS_TRIM_LENGTH = 8

export function useAccounts(): Record<string, Account> {
  return useAppSelector<Record<string, Account>>(selectNonPendingAccounts)
}

export function useAccount(address: Address): Account {
  const account = useAppSelector<Record<string, Account>>(selectAccounts)[address]
  if (!account) {
    throw new Error(`No account found for address ${address}`)
  }
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

/**
 * Displays the ENS name if one is available otherwise displays the local name and if neither are available it shows the address.
 *
 * @param address - The address to display
 * @param options.showShortenedEns - Whether to shorten the ENS name to ENS_TRIM_LENGTH characters
 * @param options.includeUnitagSuffix - Whether to include the unitag suffix (.uni.eth) in returned unitag name
 * @param options.showLocalName - Whether to show the local wallet name
 */

type DisplayNameOptions = {
  showShortenedEns?: boolean
  includeUnitagSuffix?: boolean
  showLocalName?: boolean
  overrideDisplayName?: string
}

export function useDisplayName(
  address: Maybe<string>,
  options?: DisplayNameOptions
): DisplayName | undefined {
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

  // Need to account for pending accounts for use within onboarding
  const maybeLocalName = useAccounts()[address ?? '']?.name
  const maybeLocalNamePending = usePendingAccounts()[address ?? '']?.name
  const localName = maybeLocalName ?? maybeLocalNamePending

  if (!address) {
    return
  }

  if (overrideDisplayName) {
    return {
      name: showShortenedEns
        ? trimToLength(overrideDisplayName, ENS_TRIM_LENGTH)
        : overrideDisplayName,
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
  const { data: ensAvatar, loading: ensLoading } = useENSAvatar(address)
  const { unitag, loading: unitagLoading } = useUnitagByAddress(address || undefined)

  const unitagAvatar = unitag?.metadata?.avatar

  if (unitagAvatar) {
    return { avatar: unitagAvatar, loading: false }
  }

  if (ensAvatar) {
    return { avatar: ensAvatar, loading: false }
  }

  return { avatar: undefined, loading: ensLoading || unitagLoading }
}
