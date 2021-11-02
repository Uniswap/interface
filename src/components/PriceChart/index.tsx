import { Token } from '@uniswap/sdk-core'
import React from 'react'
import { Graph } from 'src/components/PriceChart/Graph'
import { useGraphs } from 'src/components/PriceChart/Model'
import { Text } from 'src/components/Text'

interface PriceChartProps {
  token: Token
}

export const PriceChart = ({ token }: PriceChartProps) => {
  const graphs = useGraphs(token)

  return graphs && graphs.length ? <Graph graphs={graphs} /> : <Text variant="h2">Loading</Text>
}
