import { useEffect, useState } from 'react'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { usePoolTickData } from 'hooks/usePoolTickData'
import { TickProcessed } from 'constants/ticks'

export interface ChartEntry {
  index: number
  isCurrent: boolean
  activeLiquidity: number
  price0: number
  price1: number
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
  const [priceAtActiveTick, setPriceAtActiveTick] = useState<number | undefined>()
  const [maxLiquidity, setMaxLiquidity] = useState<number>(0)

  const { loading, syncing, error, activeTick, tickData } = usePoolTickData(currencyA, currencyB, feeAmount)

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
      let maxLiquidity = JSBI.BigInt(0)

      for (let i = 0; i < tickData.length; i++) {
        const t: TickProcessed = tickData[i]
        const active = t.tickIdx === activeTick

        maxLiquidity = JSBI.greaterThan(tickData[i].liquidityActive, maxLiquidity)
          ? tickData[i].liquidityActive
          : maxLiquidity

        const chartEntry = {
          index: i,
          isCurrent: active,
          activeLiquidity: parseFloat(t.liquidityActive.toString()),
          price0: parseFloat(t.price0),
          price1: parseFloat(t.price1),
        }

        if (active) {
          setPriceAtActiveTick(chartEntry.price0)
        }

        newData.push(chartEntry)
      }

      setMaxLiquidity(parseFloat(maxLiquidity.toString()))

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
    syncing,
    error,
    priceAtActiveTick,
    maxLiquidity,
    formattedData,
  }
}
