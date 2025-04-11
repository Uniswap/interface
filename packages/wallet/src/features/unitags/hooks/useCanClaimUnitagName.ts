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
const getUnitagFormatError = (unitag: string, t: TFunction): string | undefined => {
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
  const maybeError = unitag ? getUnitagFormatError(unitag, t) : undefined

  // Skip the backend calls if we found an error
  const unitagToSearch = maybeError ? undefined : unitag

  const { isLoading: unitagLoading, data } = useUnitagsUsernameQuery({
    params: unitagToSearch ? { username: unitagToSearch } : undefined,
    staleTime: 2 * ONE_MINUTE_MS,
  })
  const { loading: ensLoading } = useENS({ nameOrAddress: unitagToSearch, autocompleteDomain: true })
  const loading = unitagLoading || ensLoading

  // This handles the case where the user has already checked a unitag, received an error, and proceeds to change their inputted text
  if (unitag === undefined) {
    errorMessageRef.current = undefined
    return { error: errorMessageRef.current, loading }
  }

  if (maybeError) {
    // Check for local error, if it exists
    errorMessageRef.current = maybeError

    return { error: errorMessageRef.current, loading }
  }

  // If nothing is loading, and we're told the unitag is unavailable, change the error message to the default remote error message
  if (!loading && data?.available === false) {
    errorMessageRef.current = t('unitags.claim.error.unavailable')

    return { error: errorMessageRef.current, loading }
  }

  if (unitagLoading) {
    // If the unitag query is loading, clear the error message
    errorMessageRef.current = undefined
    return { error: errorMessageRef.current, loading }
  }

  return { error: errorMessageRef.current, loading }
}
