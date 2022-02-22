import { Currency } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import { serialize } from 'react-native-redash'
import Svg, { Path } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout/Box'
import { buildGraph } from 'src/components/PriceChart/Model'
import { useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'
import { logger } from 'src/utils/logger'

// number of datapoints to normalize to
const GRAPH_PRECISION = 10
const WIDTH = 45
const HEIGHT = 20

interface InlineGraphProps {
  currency: Currency
}

export const InlinePriceChart = ({ currency }: InlineGraphProps) => {
  const theme = useAppTheme()

  // startOf hour to stabilize the reference
  const yesterday = dayjs().subtract(1, 'day').startOf('hour').unix()

  const { prices, error, loading } = useHourlyTokenPrices({
    token: currency.wrapped,
    periodStartUnix: yesterday,
  })

  if (error) {
    logger.error('InlineGraph', '', `Error fetching price for ${currency.wrapped.symbol}: ${error}`)
  }

  const graph = useMemo(
    () =>
      !error && !loading && prices ? buildGraph(prices, GRAPH_PRECISION, WIDTH, HEIGHT) : undefined,
    [error, loading, prices]
  )

  if (!graph) {
    logger.debug('InlinePriceChart', '', `No price data to display for ${currency.wrapped.symbol}`)
    return null
  }

  return (
    <Box alignSelf="center">
      <Svg height={HEIGHT} width={WIDTH}>
        <Path
          d={serialize(graph.path)}
          stroke={theme.colors.primary1}
          strokeLinecap="square"
          strokeWidth={2}
        />
      </Svg>
    </Box>
  )
}
