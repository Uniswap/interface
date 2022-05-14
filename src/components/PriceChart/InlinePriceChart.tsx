import { skipToken } from '@reduxjs/toolkit/dist/query'
import { Currency } from '@uniswap/sdk-core'
import dayjs from 'dayjs'
import React, { useEffect, useMemo } from 'react'
import { serialize } from 'react-native-redash'
import Svg, { Path } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout/Box'
import { buildGraph } from 'src/components/PriceChart/Model'
import { useDailyTokenPricesQuery } from 'src/features/dataApi/slice'
import { isTestnet } from 'src/utils/chainId'
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

  const lastWeek = dayjs().subtract(7, 'day').format('YYYY-MM-DD')

  const {
    currentData: prices,
    isError,
    error,
    isLoading,
    isSuccess,
  } = useDailyTokenPricesQuery(
    isTestnet(currency.chainId)
      ? skipToken
      : {
          address: currency.wrapped.address,
          chainId: currency.chainId,
          from: lastWeek,
        }
  )

  const graph = useMemo(
    () =>
      !error && !isLoading && prices
        ? buildGraph(prices, GRAPH_PRECISION, WIDTH, HEIGHT)
        : undefined,
    [error, isLoading, prices]
  )

  useEffect(() => {
    if (isError) {
      logger.error(
        'InlineGraph',
        '',
        `Error fetching price for ${currency.wrapped.symbol}: ${error}`
      )
    }
  }, [currency.wrapped.symbol, error, isError])

  useEffect(() => {
    if (isSuccess && !graph) {
      logger.debug(
        'InlinePriceChart',
        '',
        `No price data to display for ${currency.wrapped.symbol}`
      )
    }
  }, [currency.wrapped.symbol, error, graph, isSuccess])

  if (isError || !graph) {
    return null
  }

  return (
    <Box alignSelf="center">
      <Svg height={HEIGHT} width={WIDTH}>
        <Path
          d={serialize(graph.path)}
          stroke={theme.colors.deprecated_primary1}
          strokeLinecap="square"
          strokeWidth={2}
        />
      </Svg>
    </Box>
  )
}
