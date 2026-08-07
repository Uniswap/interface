import { useMemo } from 'react'
import type { TokenCardVerticalProps } from 'uniswap/src/components/TokenCard/types'
import { formatIssuerLabel } from 'uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol'
import { rwaSparklineToChartPoints } from 'uniswap/src/data/apiClients/dataApiService/rwa/sparklineUtils'
import type { ExploreStockShelfItem } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'

export function useStockTokenCardProps({ rwa, issuer }: ExploreStockShelfItem): TokenCardVerticalProps {
  const sparkline = useMemo(() => rwaSparklineToChartPoints(issuer.sparkline1d), [issuer.sparkline1d])
  return {
    logoUrl: rwa.logoUrl,
    name: rwa.name,
    symbol: rwa.symbol,
    issuerLabel: formatIssuerLabel(issuer.issuer),
    priceUsd: issuer.priceUsd,
    pricePercentChange1d: issuer.priceChange24hPct,
    sparkline,
  }
}
