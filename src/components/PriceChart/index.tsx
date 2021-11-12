import { Token } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { ActivityIndicator } from 'react-native'
import { Graph } from 'src/components/PriceChart/Graph'
import { useGraphs } from 'src/components/PriceChart/Model'

interface PriceChartProps {
  token: Token
}

export const PriceChart = ({ token }: PriceChartProps) => {
  const graphs = useGraphs(token)

  // require all graphs to be loaded before rendering the chart
  // TODO(judo): improve loading state
  const loading = useMemo(() => graphs?.some((g) => g.data === null), [graphs])

  return loading || !graphs ? <ActivityIndicator /> : <Graph graphs={graphs} />
}
