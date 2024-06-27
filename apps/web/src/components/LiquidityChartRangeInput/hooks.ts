import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { TickProcessed, usePoolActiveLiquidity } from 'hooks/usePoolTickData'
import { useCallback, useMemo } from 'react'

import { ChartEntry } from './types'

export function useDensityChartData({
  currencyA,
  currencyB,
  feeAmount,
}: {
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: FeeAmount
}) {
  const { isLoading, error, data } = usePoolActiveLiquidity(currencyA, currencyB, feeAmount)

  const formatData = useCallback(() => {
    if (!data?.length) {
      return undefined
    }

    const newData: ChartEntry[] = []

    for (let i = 0; i < data.length; i++) {
      const t: TickProcessed = data[i]

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat(t.price0),
      }

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry)
      }
    }

    return newData
  }, [data])

  return useMemo(() => {
    return {
      isLoading,
      error,
      formattedData: !isLoading ? formatData() : undefined,
    }
  }, [isLoading, error, formatData])
}
