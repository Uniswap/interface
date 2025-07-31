import { TFunction } from 'i18next'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useUnitagsUsernameQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsUsernameQuery'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { UNITAG_VALID_REGEX } from 'uniswap/src/features/unitags/constants'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

const MIN_UNITAG_LENGTH = 3
const MAX_UNITAG_LENGTH = 20

// Helper function to enforce unitag length and alphanumeric characters
export const getUnitagFormatError = (unitag: string, t: TFunction): string | undefined => {
  if (unitag.length < MIN_UNITAG_LENGTH) {
    return t('unitags.username.error.min', {
      number: MIN_UNITAG_LENGTH,
    })
  }

  if (unitag.length > MAX_UNITAG_LENGTH) {
    return t('unitags.username.error.max', {
      number: MAX_UNITAG_LENGTH,
    })
  }

  if (unitag !== unitag.toLowerCase()) {
    return t('unitags.username.error.uppercase')
  }

  if (!UNITAG_VALID_REGEX.test(unitag)) {
    return t('unitags.username.error.chars')
  }

  return undefined
}

export const useCanClaimUnitagName = (unitag: string | undefined): { error: string | undefined; loading: boolean } => {
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
  const unitagAvailable = !loading && data?.available

  // Check for local error, if it exists
  if (formatError) {
    errorMessageRef.current = formatError
    return { error: errorMessageRef.current, loading }
  }

  const shouldClearError = unitag === undefined || loading || unitagAvailable

  // This check removes the error when:
  // 1. The unitag input is empty
  // 2. The unitag is being loaded (either from the backend or ENS)
  // 3. The unitag is available (meaning it can be claimed)
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
