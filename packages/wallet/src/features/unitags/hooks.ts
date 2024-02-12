import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { getUniqueId } from 'react-native-device-info'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { useENS } from 'wallet/src/features/ens/useENS'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import {
  useUnitagByAddressQuery,
  useUnitagClaimEligibilityQuery,
  useUnitagQuery,
} from 'wallet/src/features/unitags/api'
import { UnitagAddressResponse } from 'wallet/src/features/unitags/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

const MIN_UNITAG_LENGTH = 3
const MAX_UNITAG_LENGTH = 20

export const useCanActiveAddressClaimUnitag = (): boolean => {
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const activeAddress = useActiveAccountAddressWithThrow()
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { loading, data } = useUnitagClaimEligibilityQuery({
    address: activeAddress,
    deviceId: deviceId ?? '', // this is fine since we skip if deviceId is undefined
    skip: !unitagsFeatureFlagEnabled || !deviceId,
  })
  return unitagsFeatureFlagEnabled && !loading && !!data?.canClaim
}

export const useCanAddressClaimUnitag = (address?: Address): boolean => {
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const { data: deviceId } = useAsyncData(getUniqueId)
  const { loading, data } = useUnitagClaimEligibilityQuery({
    address,
    deviceId: deviceId ?? '', // this is fine since we skip if deviceId is undefined
    skip: !unitagsFeatureFlagEnabled || !deviceId,
  })
  return !loading && !!data?.canClaim
}

export const useUnitag = (
  address?: Address
): { unitag?: UnitagAddressResponse; loading: boolean } => {
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const { data, loading } = useUnitagByAddressQuery(unitagsFeatureFlagEnabled ? address : undefined)
  return { unitag: data, loading }
}

// Helper function to enforce unitag length and alphanumeric characters
export const getUnitagFormatError = (unitag: string, t: TFunction): string | undefined => {
  if (unitag.length < MIN_UNITAG_LENGTH) {
    return t(`Unitags must be at least {{ minUnitagLength }} characters`, {
      minUnitagLength: MIN_UNITAG_LENGTH,
    })
  } else if (unitag.length > MAX_UNITAG_LENGTH) {
    return t(`Unitags cannot be more than {{ maxUnitagLength }} characters`, {
      maxUnitagLength: MAX_UNITAG_LENGTH,
    })
  } else if (!/^[A-Za-z0-9]+$/.test(unitag)) {
    return t('Unitags can only contain letters and numbers')
  }
  return undefined
}

export const useUnitagError = (
  unitagAddress: Address | undefined,
  unitag: string | undefined
): { unitagError: string | undefined; loading: boolean } => {
  const { t } = useTranslation()

  // Check for length and alphanumeric characters
  let unitagError = unitag ? getUnitagFormatError(unitag, t) : undefined

  // Skip the backend calls if we found an error
  const unitagToSearch = unitagError ? undefined : unitag
  const { loading: unitagLoading, data } = useUnitagQuery(unitagToSearch)
  const { loading: ensLoading, address: ensAddress } = useENS(ChainId.Mainnet, unitagToSearch, true)
  const loading = unitagLoading || ensLoading

  // Check for availability and ENS match
  const dataLoaded = !loading && !!data
  const ensAddressMatchesUnitagAddress = areAddressesEqual(unitagAddress, ensAddress)
  if (dataLoaded && !data.available) {
    unitagError = t('This Unitag is not available')
  }
  if (dataLoaded && data.requiresEnsMatch && !ensAddressMatchesUnitagAddress) {
    unitagError = t('To claim this Unitag you must own the {{ unitag }}.eth ENS', { unitag })
  }
  return { unitagError, loading }
}
