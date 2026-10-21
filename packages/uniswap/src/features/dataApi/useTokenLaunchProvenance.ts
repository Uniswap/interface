import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { type LaunchProvenance, toLaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { CurrencyId } from 'uniswap/src/types/currency'

function selectLaunchProvenance(data: PlainMessage<GetTokenResponse> | undefined): LaunchProvenance | undefined {
  return toLaunchProvenance({ provenance: data?.token?.launchProvenance })
}

/**
 * Where the token launched, read off the GetToken response a token page already fetches — so it
 * arrives with the rest of the token rather than behind the separate auction lookup. Undefined
 * until that read settles, and for every token the backend has no attribution for.
 *
 * Attribution is not comparable across tokens the way a price or a chart period is, so this read
 * opts out of the shared keep-previous-data default: on a token-to-token navigation the surface
 * shows nothing until the new token answers, never the previous token's launchpad.
 */
export function useTokenLaunchProvenance(currencyId: CurrencyId | undefined): LaunchProvenance | undefined {
  const params = useMemo(() => (currencyId ? currencyIdToRestContractInput(currencyId) : undefined), [currencyId])
  const { data } = useQuery(
    getGetTokenQueryOptions({ params, keepPreviousData: false, select: selectLaunchProvenance }),
  )
  return data
}
