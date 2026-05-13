import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount, TICK_SPACINGS, tickToPrice } from '@uniswap/v3-sdk'
import { tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'
import JSBI from 'jsbi'
import { UTCTimestamp } from 'lightweight-charts'
import { useEffect, useState } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { LiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart/types'
import { calculateTokensLocked } from '~/features/Liquidity/charts/LiquidityChart/utils/calculateTokensLocked'
import { usePoolActiveLiquidity } from '~/features/Liquidity/hooks/usePoolTickData'
import { PositionField } from '~/types/position'

export function useLiquidityBarData({
  sdkCurrencies,
  feeTier,
  isReversed,
  chainId,
  version,
  tickSpacing,
  hooks,
  poolId,
}: {
  sdkCurrencies: { [field in PositionField]: Currency }
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: ProtocolVersion
  tickSpacing?: number
  hooks?: string
  poolId?: string
}) {
  const { formatNumberOrString } = useLocalizationContext()

  const activePoolData = usePoolActiveLiquidity({
    sdkCurrencies,
    feeAmount: feeTier,
    version,
    poolId,
    chainId,
    tickSpacing: tickSpacing ?? TICK_SPACINGS[feeTier],
    hooks,
  })

  const [tickData, setTickData] = useState<{
    barData: LiquidityBarData[]
    activeRangeData?: LiquidityBarData
    activeRangePercentage?: number
  }>()

  const { data: ticksProcessed, activeTick, currentTick, liquidity } = activePoolData

  useEffect(() => {
    async function formatData() {
      if (!ticksProcessed || activeTick === undefined || !liquidity) {
        return
      }

      let activeRangePercentage: number | undefined
      let activeRangeIndex: number | undefined

      const poolTickSpacing = tickSpacing ?? TICK_SPACINGS[feeTier]

      const barData: LiquidityBarData[] = []
      for (let index = 0; index < ticksProcessed.length; index++) {
        const t = ticksProcessed[index]

        // Lightweight-charts require the x-axis to be time; a fake time base on index is provided
        const fakeTime = (isReversed ? index * 1000 : (ticksProcessed.length - index) * 1000) as UTCTimestamp
        const isActive = activeTick === t.tick

        let price0 = t.sdkPrice
        let price1 = t.sdkPrice.invert()

        if (isActive && currentTick !== undefined) {
          activeRangeIndex = index
          activeRangePercentage = 1 - (currentTick - t.tick) / poolTickSpacing

          price0 =
            version === ProtocolVersion.V3
              ? tickToPrice(sdkCurrencies.TOKEN0.wrapped, sdkCurrencies.TOKEN1.wrapped, t.tick)
              : tickToPriceV4(sdkCurrencies.TOKEN0, sdkCurrencies.TOKEN1, t.tick)
          price1 = price0.invert()
        }

        const nextTick = ticksProcessed[index + 1]?.tick

        const { amount0Locked, amount1Locked } = calculateTokensLocked({
          token0: sdkCurrencies.TOKEN0,
          token1: sdkCurrencies.TOKEN1,
          tickSpacing: poolTickSpacing,
          currentTick: currentTick ?? 0,
          amount: JSBI.BigInt(t.liquidityActive.toString()),
          nextTick,
          tick: t,
        })

        barData.push({
          tick: t.tick,
          liquidity: parseFloat(t.liquidityActive.toString()),
          price0: formatNumberOrString({ value: price0.toSignificant(), type: NumberType.SwapTradeAmount }),
          price1: formatNumberOrString({ value: price1.toSignificant(), type: NumberType.SwapTradeAmount }),
          time: fakeTime,
          amount0Locked,
          amount1Locked,
        })
      }

      const activeRangeData = activeRangeIndex !== undefined ? barData[activeRangeIndex] : undefined

      // Reverse data so that token0 is on the left by default
      if (!isReversed) {
        barData.reverse()
      }
      setTickData({ barData, activeRangeData, activeRangePercentage })
    }

    formatData()
  }, [
    ticksProcessed,
    activeTick,
    currentTick,
    liquidity,
    sdkCurrencies,
    formatNumberOrString,
    isReversed,
    feeTier,
    version,
    tickSpacing,
  ])

  return { tickData, activeTick: activePoolData.activeTick, loading: activePoolData.isLoading || !tickData }
}
