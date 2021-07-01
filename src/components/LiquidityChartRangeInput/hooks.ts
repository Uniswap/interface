import { useEffect, useState } from 'react'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { usePoolTickData } from 'hooks/usePoolTickData'
import { TickProcessed } from 'constants/ticks'
import { ChartEntry } from './types'

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

  const { loading, error, activeTick, tickData } = usePoolTickData(currencyA, currencyB, feeAmount)

  // clear data when inputs are cleared
  useEffect(() => {
    if (!currencyA || !currencyB || !feeAmount) {
      setFormattedData(undefined)
    }
  }, [currencyA, currencyB, feeAmount])

  useEffect(() => {
    function formatData() {
      if (!tickData?.length) {
        return
      }

      const newData: ChartEntry[] = []

      for (let i = 0; i < tickData.length; i++) {
        const t: TickProcessed = tickData[i]
        //const active = t.tickIdx === activeTick

        const chartEntry = {
          //index: i,
          //isCurrent: active,
          activeLiquidity: parseFloat(t.liquidityActive.toString()),
          price0: parseFloat(t.price0),
        }

        newData.push(chartEntry)
      }

      if (newData) {
        setFormattedData(newData)
      }
    }

    if (!loading) {
      formatData()
    }
  }, [loading, activeTick, tickData])

  return {
    loading,
    error,
    formattedData,
  }
}
