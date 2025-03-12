import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { calculateTokensLockedV3, calculateTokensLockedV4 } from 'components/Charts/LiquidityChart'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePoolActiveLiquidity } from 'hooks/usePoolTickData'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TickProcessed } from 'utils/computeSurroundingTicks'

/**
 * Currency A and B should be sorted to get accurate data, but you can pass invertPrices = true
 * to get inverted prices.
 */
export function useDensityChartData({
  poolId,
  currencyA,
  currencyB,
  feeAmount,
  invertPrices,
  version,
  chainId,
  tickSpacing,
  hooks,
  skip,
}: {
  poolId?: string
  currencyA?: Currency
  currencyB?: Currency
  feeAmount?: number
  invertPrices?: boolean
  version: ProtocolVersion
  chainId?: UniverseChainId
  tickSpacing?: number
  hooks?: string
  skip?: boolean
}) {
  const { isLoading, error, data } = usePoolActiveLiquidity({
    currencyA,
    currencyB,
    version,
    poolId,
    feeAmount,
    chainId,
    tickSpacing,
    hooks,
    skip,
  })

  const fetcher = async () => {
    if (!data?.length || !currencyA || !currencyB || !feeAmount || !tickSpacing) {
      return null
    }

    const newData: ChartEntry[] = []

    for (let i = 0; i < data.length; i++) {
      const t: TickProcessed = data[i]

      const price0 = invertPrices ? t.sdkPrice.invert().toSignificant(8) : t.sdkPrice.toSignificant(8)

      const { amount0Locked, amount1Locked } = await (version === ProtocolVersion.V3
        ? calculateTokensLockedV3(currencyA?.wrapped, currencyB?.wrapped, feeAmount, t)
        : calculateTokensLockedV4(
            currencyA?.wrapped,
            currencyB?.wrapped,
            feeAmount,
            tickSpacing,
            hooks ?? ZERO_ADDRESS,
            t,
          ))

      const chartEntry = {
        activeLiquidity: parseFloat(t.liquidityActive.toString()),
        price0: parseFloat(price0),
        tick: t.tick,
        amount0Locked: invertPrices ? amount0Locked : amount1Locked,
        amount1Locked: invertPrices ? amount1Locked : amount0Locked,
      }

      if (chartEntry.activeLiquidity > 0) {
        newData.push(chartEntry)
      }
    }

    return newData
  }

  const { data: formattedData } = useQuery({
    queryKey: [
      'densityChartData',
      poolId,
      currencyA,
      currencyB,
      feeAmount,
      invertPrices,
      version,
      chainId,
      tickSpacing,
      data,
    ],
    queryFn: fetcher,
  })

  return useMemo(() => {
    return {
      isLoading: isLoading || (Boolean(data) && !formattedData),
      error,
      formattedData: isLoading ? undefined : formattedData,
    }
  }, [data, error, formattedData, isLoading])
}
