import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { ChainId } from 'src/constants/chains'
import { useENS } from 'src/features/ens/useENS'
import { Account } from 'src/features/wallet/accounts/types'
import {
  makeSelectLocalPfp,
  selectActiveAccount,
  selectActiveAccountAddress,
  selectNonPendingAccounts,
  selectPendingAccounts,
  selectSignerAccounts,
} from 'src/features/wallet/selectors'
import { WalletConnectSession } from 'src/features/walletConnect/walletConnectSlice'
import { shortenAddress } from 'src/utils/addresses'

export function useAccounts() {
  return useAppSelector(selectNonPendingAccounts)
}

export function usePendingAccounts(): AddressTo<Account> {
  return useAppSelector(selectPendingAccounts)
}

export function useSignerAccounts() {
  return useAppSelector(selectSignerAccounts)
}

export function useActiveAccount(): Account | null {
  return useAppSelector(selectActiveAccount)
}

export function useActiveAccountAddress(): Address | null {
  return useAppSelector(selectActiveAccountAddress)
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
  return useAppSelector(useMemo(() => makeSelectLocalPfp(address), [address]))
}

export function useDisplayName(address: Nullable<string>):
  | {
      name: string
      type: 'local' | 'ens' | 'address'
    }
  | undefined {
  const maybeLocalName = useAccounts()[address ?? '']?.name // if address is a local account with a name
  const ens = useENS(ChainId.Mainnet, address)

  if (!address) return

  if (maybeLocalName) return { name: maybeLocalName, type: 'local' }
  if (ens.name) return { name: ens.name, type: 'ens' }
  return { name: shortenAddress(address), type: 'address' }
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
