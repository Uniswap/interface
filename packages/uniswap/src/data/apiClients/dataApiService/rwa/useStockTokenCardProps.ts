import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import type { TokenCardVerticalProps } from 'uniswap/src/components/TokenCard/types'
import { getIssuerTokenLabel } from 'uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol'
import { rwaSparklineToChartPoints } from 'uniswap/src/data/apiClients/dataApiService/rwa/sparklineUtils'
import type { ExploreStockShelfItem } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { getIssuerTokenPrimaryName } from 'uniswap/src/features/rwa/getIssuerTokenPrimaryName'

export function useStockTokenCardProps({ rwa, issuer }: ExploreStockShelfItem): TokenCardVerticalProps {
  const sparkline = useMemo(() => rwaSparklineToChartPoints(issuer.sparkline1d), [issuer.sparkline1d])
  const plainTokenNames = useIsTokenCategoriesEnabled()
  return {
    logoUrl: rwa.logoUrl,
    name: getIssuerTokenPrimaryName({ tokenName: issuer.name, fallbackName: rwa.name, plainTokenNames }),
    symbol: rwa.symbol,
    issuerLabel: getIssuerTokenLabel(issuer),
    priceUsd: issuer.priceUsd,
    pricePercentChange1d: issuer.priceChange24hPct,
    sparkline,
  }
}
