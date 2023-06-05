import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useENSName } from 'src/features/ens/api'
import { useAccounts, usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { getValidAddress, sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import { trimToLength } from 'wallet/src/utils/string'

const ENS_TRIM_LENGTH = 8

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

export function useWCTimeoutError(timeoutDurationInMs: number): {
  hasScanError: boolean
  setHasScanError: Dispatch<SetStateAction<boolean>>
  shouldFreezeCamera: boolean
  setShouldFreezeCamera: Dispatch<SetStateAction<boolean>>
} {
  // hook used in WalletConnectModal for WC timeout error logic
  const { t } = useTranslation()
  const [hasScanError, setHasScanError] = useState<boolean>(false)
  const [shouldFreezeCamera, setShouldFreezeCamera] = useState<boolean>(false)
  const hasScanErrorRef = useRef(hasScanError)
  const shouldFreezeCameraRef = useRef(shouldFreezeCamera)

  hasScanErrorRef.current = hasScanError
  shouldFreezeCameraRef.current = shouldFreezeCamera

  useEffect(() => {
    if (!shouldFreezeCamera) return
    // camera freezes when we attempt to connect, show timeout error if no response after 10 seconds
    const timer = setTimeout(() => {
      // don't show error if error already showing
      if (hasScanErrorRef.current || !shouldFreezeCameraRef.current) return

      setHasScanError(true)
      setShouldFreezeCamera(false)
      Alert.alert(
        t('WalletConnect error'),
        t('Please refresh the site and try connecting again.'),
        [
          {
            text: t('Try again'),
            onPress: (): void => {
              setHasScanError(false)
            },
          },
        ]
      )
    }, timeoutDurationInMs)
    return (): void => clearTimeout(timer)
  }, [shouldFreezeCamera, t, timeoutDurationInMs])

  return { hasScanError, setHasScanError, shouldFreezeCamera, setShouldFreezeCamera }
}
