import { useEffect } from 'react'
import { useUnitagByAddressQuery, useUnitagQuery } from 'uniswap/src/features/unitags/api'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { UnitagAddressResponse, UnitagUsernameResponse } from 'uniswap/src/features/unitags/types'

/**
 * We've split out this file because the web app is using these hooks and the
 * feature flag logic for now in this package is tied to mobile. Specifically,
 * react-native-device-info and react-native-statsig (which imports it) cause an
 * error by hittin navigator.getBattery() on startup
 */

export type UseUnitagNameResponse = { unitag?: UnitagUsernameResponse; loading: boolean }

export const useUnitagByNameWithoutFlag = (
  name?: string,
  enabled = true
): UseUnitagNameResponse => {
  const { data, loading, refetch } = useUnitagQuery(enabled ? name : undefined)

  // Force refetch if counter changes
  const { refetchUnitagsCounter } = useUnitagUpdater()
  useEffect(() => {
    if (!enabled || loading || !name) {
      return
    }

    refetch?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter])

  return { unitag: data, loading }
}

export type UseUnitagAddressResponse = { unitag?: UnitagAddressResponse; loading: boolean }

export const useUnitagByAddressWithoutFlag = (
  address?: Address,
  enabled = true
): UseUnitagAddressResponse => {
  const { data, loading, refetch } = useUnitagByAddressQuery(enabled ? address : undefined)

  // Force refetch if counter changes
  const { refetchUnitagsCounter } = useUnitagUpdater()
  useEffect(() => {
    if (!enabled || loading || !address) {
      return
    }

    refetch?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter])

  return { unitag: data, loading }
}
