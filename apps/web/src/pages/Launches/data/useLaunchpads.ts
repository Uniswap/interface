import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { ListLaunchpadsResponse } from '@uniswap/client-launches/dist/launches/v1/api_pb'
import type { Launchpad } from '@uniswap/client-launches/dist/launches/v1/types_pb'
import { getListLaunchpadsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/launches/queries'
import { resolveIpfsGatewayUrl } from 'utilities/src/format/gatewayUrls'

type LaunchpadRegistry = {
  launchpads: PlainMessage<Launchpad>[]
  launchpadById: Map<string, PlainMessage<Launchpad>>
}

const EMPTY_REGISTRY: LaunchpadRegistry = { launchpads: [], launchpadById: new Map() }

function selectLaunchpadRegistry(data: PlainMessage<ListLaunchpadsResponse> | undefined): LaunchpadRegistry {
  if (!data?.launchpads) {
    return EMPTY_REGISTRY
  }
  const launchpads = data.launchpads.map((launchpad) => ({
    ...launchpad,
    logoUrl: resolveIpfsGatewayUrl(launchpad.logoUrl),
  }))
  return { launchpads, launchpadById: new Map(launchpads.map((launchpad) => [launchpad.id, launchpad])) }
}

/**
 * Fetches the launchpad registry backing the Launches surface (launches.v1.LaunchService ListLaunchpads).
 * Launchpad ids are the stable slugs accepted by ListLaunches' launchpad_id filter.
 */
export function useLaunchpads(): {
  launchpads: PlainMessage<Launchpad>[]
  launchpadById: Map<string, PlainMessage<Launchpad>>
  isLoading: boolean
  isError: boolean
  error: Error | null
} {
  const {
    data: { launchpads, launchpadById } = EMPTY_REGISTRY,
    isLoading,
    isError,
    error,
  } = useQuery(getListLaunchpadsQueryOptions({ params: {}, select: selectLaunchpadRegistry }))

  return { launchpads, launchpadById, isLoading, isError, error }
}
