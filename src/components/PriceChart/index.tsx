import { Token } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { Graph } from 'src/components/PriceChart/Graph'
import { useGraphs } from 'src/components/PriceChart/Model'
import { Text } from 'src/components/Text'

interface PriceChartProps {
  token: Token
}

export const PriceChart = ({ token }: PriceChartProps) => {
  const graphs = useGraphs(token)

  // require all graphs to be loaded before rendering the chart
  // TODO(judo): improve loading state
  const loading = useMemo(() => graphs?.some((g) => g.data === null), [graphs])

  return loading || !graphs ? <Text variant="h2">Loading</Text> : <Graph graphs={graphs} />
}
