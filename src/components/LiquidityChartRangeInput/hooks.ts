import { useEffect, useState } from 'react'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { usePoolActiveLiquidity } from 'hooks/usePoolTickData'
import { ChartEntry } from './types'
import JSBI from 'jsbi'

// Tick with fields parsed to JSBIs, and active liquidity computed.
export interface TickProcessed {
  tickIdx: number
  liquidityActive: JSBI
  liquidityNet: JSBI
  price0: string
}

export function useDensityChartData({
  currencyA,
  currencyB,
  feeAmount,
}: {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  feeAmount: FeeAmount | undefined
}) {
  const [formattedData, setFormattedData] = useState<ChartEntry[] | undefined>()

  const { isLoading, isUninitialized, isError, error, activeTick, data } = usePoolActiveLiquidity(
    currencyA,
    currencyB,
    feeAmount
  )

  useEffect(() => {
    // clear data when inputs are cleared
    setFormattedData(undefined)
  }, [currencyA, currencyB, feeAmount])

  useEffect(() => {
    function formatData() {
      if (!data?.length) {
        return
      }

      const newData: ChartEntry[] = []

      for (let i = 0; i < data.length; i++) {
        const t: TickProcessed = data[i]

        const chartEntry = {
          activeLiquidity: parseFloat(t.liquidityActive.toString()),
          price0: parseFloat(t.price0),
        }

        newData.push(chartEntry)
      }

      if (newData) {
        setFormattedData(newData)
      }
    }

    if (!isLoading) {
      formatData()
    }
  }, [isLoading, activeTick, data])

  return {
    isLoading,
    isUninitialized,
    isError,
    error,
    formattedData,
  }
}
