import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { TokenIssuerInfo } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { mapTokenIssuerInfo } from 'uniswap/src/features/rwa/issuers'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import type { CurrencyId } from 'uniswap/src/types/currency'

function selectIssuer(data: PlainMessage<GetTokenResponse> | undefined): PlainMessage<TokenIssuerInfo> | undefined {
  return data?.token?.issuer
}

/**
 * Issuer branding for the TDP header. A grouped token's comes from its group match; with token categories
 * on, an ungrouped RWA (commodities) takes it from GetToken's per-token `issuer` when the backend names one.
 * `isLoading` is true only while that fallback read is in flight.
 */
export function useRwaIssuer({ rwaMatch, currencyId }: { rwaMatch: RWAMatch | undefined; currencyId: CurrencyId }): {
  issuer: RWAIssuerDisplay | undefined
  isLoading: boolean
} {
  const isTokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const isFallbackEnabled = isTokenCategoriesEnabled && !rwaMatch
  const params = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])
  const { data: tokenIssuer, isLoading } = useQuery(
    getGetTokenQueryOptions({ params, enabled: isFallbackEnabled, select: selectIssuer }),
  )

  const issuer = useMemo(() => {
    if (rwaMatch) {
      return rwaMatch.token
    }
    return isFallbackEnabled && tokenIssuer?.displayName ? mapTokenIssuerInfo(tokenIssuer) : undefined
  }, [rwaMatch, isFallbackEnabled, tokenIssuer])

  // Query loading state is shared with the page's own GetToken read; only count it while this observer is enabled.
  return { issuer, isLoading: isFallbackEnabled && isLoading }
}
