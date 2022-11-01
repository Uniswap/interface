import { ParentSize } from '@visx/responsive'
import { ChartContainer, LoadingChart } from 'components/Tokens/TokenDetails/Skeleton'
import { TokenPriceQuery } from 'graphql/data/__generated__/TokenPriceQuery.graphql'
import { usePreloadedTokenPriceQuery } from 'graphql/data/TokenPrice'
import { Suspense } from 'react'
import { PreloadedQuery } from 'react-relay'

import PriceChart from './PriceChart'

export default function ChartSection({
  priceQueryReference,
}: {
  priceQueryReference?: PreloadedQuery<TokenPriceQuery> | null
}) {
  return (
    <Suspense fallback={<LoadingChart />}>
      {priceQueryReference && (
        <ChartContainer>
          <Chart priceQueryReference={priceQueryReference} />
        </ChartContainer>
      )}
    </Suspense>
  )
}

function Chart({ priceQueryReference }: { priceQueryReference: PreloadedQuery<TokenPriceQuery> }) {
  const prices = usePreloadedTokenPriceQuery(priceQueryReference)
  return (
    <ChartContainer>
      <ParentSize>{({ width }) => <PriceChart prices={prices ?? null} width={width} height={436} />}</ParentSize>
    </ChartContainer>
  )
}
