import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getUnitagFormatError } from 'uniswap/src/features/unitags/getUnitagFormatError'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * @param claimerAddress When set, a username that is "unavailable" only because it is already
 *   registered to this address is treated as valid (avoids false errors after a successful claim
 *   when the availability query refetches).
 */
export const useCanClaimUnitagName = (
  unitag: string | undefined,
  claimerAddress?: string,
): { error: string | undefined; loading: boolean } => {
  const { t } = useTranslation()

  const errorMessageRef = useRef<string | undefined>(undefined)

  // Check for length and alphanumeric characters
  const formatError = unitag ? getUnitagFormatError(unitag, t) : undefined

  // Skip the backend calls if we found an error
  const unitagToSearch = formatError ? undefined : unitag

  const { isLoading: unitagLoading, data } = useUnitagsUsernameQuery({
    params: unitagToSearch ? { username: unitagToSearch } : undefined,
    staleTime: 2 * ONE_MINUTE_MS,
  })

  const { loading: ensLoading } = useENS({ nameOrAddress: unitagToSearch, autocompleteDomain: true })
  const loading = unitagLoading || ensLoading

  const usernameOwnedByClaimer =
    !!claimerAddress &&
    data?.available === false &&
    !!data.address &&
    areAddressesEqual({
      addressInput1: { address: data.address, platform: Platform.EVM },
      addressInput2: { address: claimerAddress, platform: Platform.EVM },
    })

  const unitagAvailable = !loading && (Boolean(data?.available) || usernameOwnedByClaimer)

  // Check for local error, if it exists
  if (formatError) {
    errorMessageRef.current = formatError
    return { error: errorMessageRef.current, loading }
  }

  const shouldClearError = unitag === undefined || loading || unitagAvailable

  // This check removes the error when:
  // 1. The unitag input is empty
  // 2. The unitag is being loaded (either from the backend or ENS)
  // 3. The unitag is available (meaning it can be claimed), or already owned by the claimer address
  if (shouldClearError) {
    errorMessageRef.current = undefined
    return { error: errorMessageRef.current, loading }
  }

  // If nothing is loading, and we're told the unitag is unavailable, change the error message to the default remote error message
  if (data?.available === false) {
    errorMessageRef.current = t('unitags.claim.error.unavailable')
    return { error: errorMessageRef.current, loading }
  }

  return { error: errorMessageRef.current, loading }
}
