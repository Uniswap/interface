import { useEffect } from 'react'
import { useUnitagByAddressQuery, useUnitagQuery } from 'uniswap/src/features/unitags/api'
import { useUnitagUpdater } from 'uniswap/src/features/unitags/context'
import { UnitagAddressResponse, UnitagUsernameResponse } from 'uniswap/src/features/unitags/types'

export type UseUnitagAddressResponse = { unitag?: UnitagAddressResponse; loading: boolean }

export const useUnitagByAddress = (address?: Address): UseUnitagAddressResponse => {
  const { data, loading, refetch } = useUnitagByAddressQuery(address)

  // Force refetch if counter changes
  const { refetchUnitagsCounter } = useUnitagUpdater()
  useEffect(() => {
    if (loading || !address) {
      return
    }

    refetch?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter])

  return { unitag: data, loading }
}

export type UseUnitagNameResponse = { unitag?: UnitagUsernameResponse; loading: boolean }

export const useUnitagByName = (name?: string): UseUnitagNameResponse => {
  const { data, loading, refetch } = useUnitagQuery(name)

  // Force refetch if counter changes
  const { refetchUnitagsCounter } = useUnitagUpdater()
  useEffect(() => {
    if (loading || !name) {
      return
    }

    refetch?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchUnitagsCounter])

  return { unitag: data, loading }
}
