import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { Launchpad } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useMemo } from 'react'
import { getListLaunchpadsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/launches/queries'

const EMPTY_LAUNCHPADS: PlainMessage<Launchpad>[] = []

/**
 * Fetches the launchpad registry backing the Launches surface (data-api v2 ListLaunchpads).
 * Launchpad ids are the stable slugs accepted by ListLaunches' launchpad_id filter.
 */
export function useLaunchpads(): {
  launchpads: PlainMessage<Launchpad>[]
  launchpadById: Map<string, PlainMessage<Launchpad>>
  isLoading: boolean
  isError: boolean
  error: Error | null
} {
  const { data, isLoading, isError, error } = useQuery(getListLaunchpadsQueryOptions({ params: {} }))

  const launchpads = data?.launchpads ?? EMPTY_LAUNCHPADS

  const launchpadById = useMemo(() => new Map(launchpads.map((launchpad) => [launchpad.id, launchpad])), [launchpads])

  return { launchpads, launchpadById, isLoading, isError, error }
}
