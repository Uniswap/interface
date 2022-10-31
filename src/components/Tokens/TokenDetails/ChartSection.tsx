import { ParentSize } from '@visx/responsive'
import { TokenPriceQuery } from 'graphql/data/__generated__/TokenPriceQuery.graphql'
import { usePreloadedTokenPriceQuery } from 'graphql/data/TokenPrice'
import { PreloadedQuery } from 'react-relay'
import styled from 'styled-components/macro'

import PriceChart from './PriceChart'

export const ChartContainer = styled.div`
  display: flex;
  height: 436px;
  align-items: center;
  width: 100%;
`

export default function ChartSection({
  priceQueryReference,
}: {
  priceQueryReference: PreloadedQuery<TokenPriceQuery>
}) {
  const prices = usePreloadedTokenPriceQuery(priceQueryReference)
  return (
    <ChartContainer>
      <ParentSize>{({ width }) => <PriceChart prices={prices ?? null} width={width} height={436} />}</ParentSize>
    </ChartContainer>
  )
}
