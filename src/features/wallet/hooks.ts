import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { useENSName } from 'src/features/ens/api'
import { Account } from 'src/features/wallet/accounts/types'
import {
  makeSelectAccountNotificationSetting,
  makeSelectLocalPfp,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectNonPendingAccounts,
  selectNonPendingSignerAccounts,
  selectPendingAccounts,
  selectSignerAccounts,
  selectSignerMnemonicAccountExists,
  selectViewOnlyAccounts,
} from 'src/features/wallet/selectors'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { getValidAddress, sanitizeAddressText, shortenAddress } from 'src/utils/addresses'
import { trimToLength } from 'src/utils/string'

const ENS_TRIM_LENGTH = 8

export function useAccounts() {
  return useAppSelector(selectNonPendingAccounts)
}

export function usePendingAccounts(): AddressTo<Account> {
  return useAppSelector(selectPendingAccounts)
}

export function useSignerAccounts() {
  return useAppSelector(selectSignerAccounts)
}

export function useNonPendingSignerAccounts() {
  return useAppSelector(selectNonPendingSignerAccounts)
}

export function useViewOnlyAccounts() {
  return useAppSelector(selectViewOnlyAccounts)
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

export function useSelectLocalPfp(address: Address) {
  return useAppSelector(makeSelectLocalPfp(address))
}

export function useSelectAccountNotificationSetting(address: Address) {
  return useAppSelector(makeSelectAccountNotificationSetting(address))
}

/**
 * Displays the ENS name if one is available otherwise displays the local name and if neither are available it shows the address.
 */
export function useDisplayName(
  address: NullUndefined<string>,
  showShortenedEns = false
):
  | {
      name: string
      type: 'local' | 'ens' | 'address'
    }
  | undefined {
  const validated = getValidAddress(address)
  const ens = useENSName(validated ?? undefined)

  const maybeLocalName = useAccounts()[address ?? '']?.name

  if (!address) return

  if (ens.data) {
    return {
      name: showShortenedEns ? trimToLength(ens.data, ENS_TRIM_LENGTH) : ens.data,
      type: 'ens',
    }
  }

  if (maybeLocalName) {
    return { name: maybeLocalName, type: 'local' }
  }

  return { name: `${sanitizeAddressText(shortenAddress(address))}`, type: 'address' }
}

export function useWCTimeoutError(
  pendingSession: WalletConnectSession | null,
  timeoutDurationInMs: number
) {
  // hook used in WalletConnectModal for WC timeout error logic
  const { t } = useTranslation()
  const [hasScanError, setHasScanError] = useState<boolean>(false)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState<boolean>(false)
  const pendingSessionRef = useRef(pendingSession)
  const hasScanErrorRef = useRef(hasScanError)
  const shouldFreezeCameraRef = useRef(shouldFreezeCamera)

  pendingSessionRef.current = pendingSession
  hasScanErrorRef.current = hasScanError
  shouldFreezeCameraRef.current = shouldFreezeCamera

  useEffect(() => {
    if (pendingSession) {
      setShouldFreezeCamera(false)
    }
  }, [pendingSession])

  useEffect(() => {
    if (!shouldFreezeCamera) return
    // camera freezes when we attempt to connect, show timeout error if no response after 10 seconds
    const timer = setTimeout(() => {
      // don't show error if we were sent to pending session screen or already error showing
      if (pendingSessionRef.current || hasScanErrorRef.current || !shouldFreezeCameraRef.current)
        return

      setHasScanError(true)
      setShouldFreezeCamera(false)
      Alert.alert(
        t('WalletConnect error'),
        t('Please refresh the site and try connecting again.'),
        [
          {
            text: t('Try again'),
            onPress: () => {
              setHasScanError(false)
            },
          },
        ]
      )
    }, timeoutDurationInMs)
    return () => clearTimeout(timer)
  }, [shouldFreezeCamera, t, timeoutDurationInMs])

  return { hasScanError, setHasScanError, shouldFreezeCamera, setShouldFreezeCamera }
}
